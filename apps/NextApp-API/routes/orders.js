import express from 'express';
import { executeQuery, executeTransaction, pool } from '../config/database.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { validateRequest, orderCreateSchema, orderStatusUpdateSchema } from '../middleware/validation.js';

const orderStatusTransitions = {
  New: ['Pending', 'Processing', 'Hold', 'Cancelled'],
  Pending: ['Processing', 'Hold', 'Cancelled'],
  Processing: ['Picked', 'Hold', 'Cancelled'],
  Hold: ['Pending', 'Processing', 'Cancelled'],
  Picked: ['Dispatched', 'Hold'],
  Dispatched: ['Completed'],
  Completed: [],
  Cancelled: [],
};

const router = express.Router();

// Get order statistics (must be before /:id)
router.get('/stats/summary', authenticateToken, async (req, res) => {
  try {
    let whereCondition = '';
    let queryParams = [];

    if (req.user.role === 'retailer') {
      whereCondition = 'WHERE om.Retailer_Id = ?';
      queryParams.push(req.user.retailer_id);
    } else if (req.user.role !== 'super_admin') {
      if (req.user.store_id) {
        whereCondition = 'WHERE om.Branch = ?';
        queryParams.push(req.user.store_id);
      } else if (req.user.company_id) {
        whereCondition = 'WHERE s.company_id = ?';
        queryParams.push(req.user.company_id);
      }
    }

    const statsQuery = `
      SELECT
        COUNT(*) as total_orders,
        SUM(CASE WHEN om.Order_Status = 'New' THEN 1 ELSE 0 END) as new_orders,
        SUM(CASE WHEN om.Order_Status = 'Processing' THEN 1 ELSE 0 END) as processing_orders,
        SUM(CASE WHEN om.Order_Status = 'Completed' THEN 1 ELSE 0 END) as completed_orders,
        SUM(CASE WHEN om.Urgent_Status = TRUE THEN 1 ELSE 0 END) as urgent_orders,
        COUNT(DISTINCT om.Retailer_Id) as unique_retailers
      FROM order_master om
      LEFT JOIN stores s ON om.Branch = s.Branch_Code
      ${whereCondition}
    `;

    const stats = await executeQuery(statsQuery, queryParams);

    res.json(stats[0]);
  } catch (error) {
    console.error('Get order stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get orders with filtering and pagination
router.get('/', authenticateToken, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      status,
      urgent,
      retailer_id,
      branch,
      start_date,
      end_date
    } = req.query;

    let whereConditions = [];
    let queryParams = [];

    let branchAlreadyFiltered = false;

    if (req.user.role === 'retailer') {
      whereConditions.push('om.Retailer_Id = ?');
      queryParams.push(req.user.retailer_id);
    } else if (req.user.role !== 'super_admin') {
      if (req.user.store_id) {
        whereConditions.push('om.Branch = ?');
        queryParams.push(req.user.store_id);
        branchAlreadyFiltered = true;
      } else if (req.user.company_id) {
        whereConditions.push('s.company_id = ?');
        queryParams.push(req.user.company_id);
      }
    }

    if (branch && !branchAlreadyFiltered) {
      whereConditions.push('om.Branch = ?');
      queryParams.push(branch);
    }

    if (status) {
      whereConditions.push('om.Order_Status = ?');
      queryParams.push(status);
    }

    if (urgent !== undefined) {
      whereConditions.push('om.Urgent_Status = ?');
      queryParams.push(urgent === 'true' ? 1 : 0);
    }

    if (retailer_id) {
      whereConditions.push('om.Retailer_Id = ?');
      queryParams.push(retailer_id);
    }

    if (start_date) {
      whereConditions.push('om.Place_Date >= ?');
      queryParams.push(new Date(start_date).getTime());
    }

    if (end_date) {
      whereConditions.push('om.Place_Date <= ?');
      queryParams.push(new Date(end_date).getTime());
    }

    const whereClause = whereConditions.length > 0 ?
      `WHERE ${whereConditions.join(' AND ')}` : '';

    const countQuery = `
      SELECT COUNT(*) as total
      FROM order_master om
      LEFT JOIN stores s ON om.Branch = s.Branch_Code
      ${whereClause}
    `;
    const countResult = await executeQuery(countQuery, queryParams);
    const total = countResult[0].total;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
    const offsetNum = (pageNum - 1) * limitNum;

    const ordersQuery = `
      SELECT
        om.*,
        r.Retailer_Name,
        r.Contact_Person,
        s.Branch_Name,
        s.Company_Name,
        COALESCE(item_totals.order_total, 0) as order_total
      FROM order_master om
      LEFT JOIN retailers r ON om.Retailer_Id = r.Retailer_Id
      LEFT JOIN stores s ON om.Branch = s.Branch_Code
      LEFT JOIN (
        SELECT Order_Id, SUM(ItemAmount) as order_total
        FROM order_items
        GROUP BY Order_Id
      ) item_totals ON om.Order_Id = item_totals.Order_Id
      ${whereClause}
      ORDER BY om.Place_Date DESC
      LIMIT ? OFFSET ?
    `;

    const orders = await executeQuery(ordersQuery, [...queryParams, limitNum, offsetNum]);

    res.json({
      orders,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get order by ID with items
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const orderId = req.params.id;

    const orderQuery = `
      SELECT
        om.*,
        r.Retailer_Name,
        r.Contact_Person,
        r.Retailer_Email,
        s.Branch_Name,
        s.Company_Name,
        s.company_id as store_company_id
      FROM order_master om
      LEFT JOIN retailers r ON om.Retailer_Id = r.Retailer_Id
      LEFT JOIN stores s ON om.Branch = s.Branch_Code
      WHERE om.Order_Id = ?
    `;

    const orders = await executeQuery(orderQuery, [orderId]);

    if (orders.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orders[0];

    // Role-based access check
    if (req.user.role === 'retailer' && order.Retailer_Id !== req.user.retailer_id) {
      return res.status(403).json({ error: 'Access denied' });
    } else if (req.user.role === 'admin' && order.store_company_id && order.store_company_id !== req.user.company_id) {
      return res.status(403).json({ error: 'Access denied' });
    } else if (['manager', 'storeman', 'salesman'].includes(req.user.role) && order.Branch !== req.user.store_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get order items
    const itemsQuery = `
      SELECT
        oi.*,
        p.Part_Name,
        p.Part_Image
      FROM order_items oi
      LEFT JOIN parts p ON oi.Part_Admin = p.Part_Number
      WHERE oi.Order_Id = ?
      ORDER BY oi.Order_Srl
    `;

    const items = await executeQuery(itemsQuery, [orderId]);

    res.json({
      ...order,
      items
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new order
router.post('/',
  authenticateToken,
  authorizeRoles('admin', 'manager', 'storeman', 'salesman'),
  validateRequest(orderCreateSchema),
  async (req, res) => {
    try {
      const { retailer_id, po_number, urgent, remark, items } = req.body;

      const year = new Date().getFullYear();
      const crmOrderId = `CRM-${year}-${Date.now().toString().slice(-6)}`;

      const placeDate = Date.now();
      const orderMasterQuery = `
        INSERT INTO order_master (
          CRMOrderId, Retailer_Id, Place_By, Place_Date, Order_Status,
          Branch, Remark, PO_Number, PO_Date, Urgent_Status, IsSync, Last_Sync
        ) VALUES (?, ?, ?, ?, 'New', ?, ?, ?, ?, ?, ?, ?)
      `;

      const orderMasterParams = [
        crmOrderId,
        retailer_id,
        req.user.name,
        placeDate,
        req.user.store_id || 'UNKNOWN',
        remark || null,
        po_number || null,
        po_number ? placeDate : null,
        urgent ? 1 : 0,
        0,
        placeDate
      ];

      const orderItemQueries = items.map((item, index) => {
        const itemAmount = Math.round(
          item.mrp * item.quantity *
          (1 - ((item.basic_discount || 0) + (item.scheme_discount || 0) + (item.additional_discount || 0)) / 100)
        );

        return {
          query: `
            INSERT INTO order_items (
              Order_Id, Order_Srl, Part_Admin, Part_Salesman, Order_Qty,
              Dispatch_Qty, OrderItemStatus, PlaceDate, RetailerId,
              ItemAmount, SchemeDisc, AdditionalDisc, Discount, MRP,
              FirstOrderDate, Urgent_Status, Last_Sync
            ) VALUES (?, ?, ?, ?, ?, 0, 'New', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          params: [
            null,
            index + 1,
            item.part_number,
            item.part_name || item.part_number,
            item.quantity,
            placeDate,
            retailer_id,
            itemAmount,
            item.scheme_discount || 0,
            item.additional_discount || 0,
            item.basic_discount || 0,
            item.mrp,
            placeDate,
            item.urgent ? 1 : 0,
            placeDate
          ]
        };
      });

      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();

        const [orderResult] = await connection.execute(orderMasterQuery, orderMasterParams);
        const orderId = orderResult.insertId;

        for (const itemQuery of orderItemQueries) {
          itemQuery.params[0] = orderId;
          await connection.execute(itemQuery.query, itemQuery.params);
        }

        await connection.commit();

        const createdOrder = await executeQuery(`
          SELECT
            om.*,
            r.Retailer_Name,
            r.Contact_Person
          FROM order_master om
          LEFT JOIN retailers r ON om.Retailer_Id = r.Retailer_Id
          WHERE om.Order_Id = ?
        `, [orderId]);

        res.status(201).json({
          message: 'Order created successfully',
          order: createdOrder[0]
        });

      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }

    } catch (error) {
      console.error('Create order error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Update order status
router.put('/:id',
  authenticateToken,
  authorizeRoles('admin', 'manager', 'storeman', 'salesman'),
  validateRequest(orderCreateSchema),
  async (req, res) => {
    const connection = await pool.getConnection();
    try {
      const orderId = req.params.id;
      const { retailer_id, po_number, urgent, remark, items } = req.body;
      const [orders] = await connection.execute(
        'SELECT Order_Status, Branch FROM order_master WHERE Order_Id = ?',
        [orderId],
      );

      if (orders.length === 0) return res.status(404).json({ error: 'Order not found' });
      if (!['New', 'Pending', 'Processing'].includes(orders[0].Order_Status)) {
        return res.status(409).json({ error: 'Only new, pending, or processing orders can be edited' });
      }
      if (req.user.role !== 'super_admin' && req.user.store_id && orders[0].Branch !== req.user.store_id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      await connection.beginTransaction();
      await connection.execute(
        `UPDATE order_master
         SET Retailer_Id = ?, PO_Number = ?, Urgent_Status = ?, Remark = ?, Last_Sync = ?
         WHERE Order_Id = ?`,
        [retailer_id, po_number || null, urgent ? 1 : 0, remark || null, Date.now(), orderId],
      );
      await connection.execute('DELETE FROM order_items WHERE Order_Id = ?', [orderId]);

      for (const [index, item] of items.entries()) {
        const itemAmount = Math.round(
          item.mrp * item.quantity * (1 - ((item.basic_discount || 0) + (item.scheme_discount || 0) + (item.additional_discount || 0)) / 100),
        );
        await connection.execute(
          `INSERT INTO order_items
           (Order_Id, Order_Srl, Part_Admin, Part_Salesman, Order_Qty, Dispatch_Qty,
            OrderItemStatus, PlaceDate, RetailerId, ItemAmount, SchemeDisc,
            AdditionalDisc, Discount, MRP, FirstOrderDate, Urgent_Status, Last_Sync)
           VALUES (?, ?, ?, ?, ?, 0, 'New', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [orderId, index + 1, item.part_number, item.part_name || item.part_number,
            item.quantity, Date.now(), retailer_id, itemAmount,
            item.scheme_discount || 0, item.additional_discount || 0,
            item.basic_discount || 0, item.mrp, Date.now(), item.urgent ? 1 : 0, Date.now()],
        );
      }

      await connection.commit();
      res.json({ message: 'Order updated successfully' });
    } catch (error) {
      await connection.rollback();
      console.error('Update order error:', error);
      res.status(500).json({ error: 'Internal server error' });
    } finally {
      connection.release();
    }
  }
);

router.patch('/:id/status',
  authenticateToken,
  authorizeRoles('admin', 'manager', 'storeman'),
  validateRequest(orderStatusUpdateSchema),
  async (req, res) => {
    try {
      const orderId = req.params.id;
      const { status, notes } = req.body;

      const currentOrders = await executeQuery(
        'SELECT Order_Status, Retailer_Id, Branch FROM order_master WHERE Order_Id = ?',
        [orderId],
      );

      if (currentOrders.length === 0) {
        return res.status(404).json({ error: 'Order not found' });
      }

      const currentOrder = currentOrders[0];
      const currentStatus = currentOrder.Order_Status;

      // Authorization check: non-super_admin users can only update orders in their scope
      if (req.user.role !== 'super_admin') {
        if (req.user.role === 'admin' && req.user.company_id) {
          const storeCheck = await executeQuery(
            'SELECT company_id FROM stores WHERE Branch_Code = ?',
            [currentOrder.Branch]
          );
          if (storeCheck.length > 0 && storeCheck[0].company_id !== req.user.company_id) {
            return res.status(403).json({ error: 'Access denied' });
          }
        } else if (['manager', 'storeman'].includes(req.user.role) && currentOrder.Branch !== req.user.store_id) {
          return res.status(403).json({ error: 'Access denied' });
        }
      }

      if (!orderStatusTransitions[currentStatus]?.includes(status)) {
        return res.status(409).json({
          error: `Cannot change order status from ${currentStatus} to ${status}`,
          currentStatus,
          allowedStatuses: orderStatusTransitions[currentStatus] || [],
        });
      }

      const updateFields = ['Order_Status = ?'];
      const updateParams = [status];

      const currentTime = Date.now();
      const userName = req.user.name;

      switch (status) {
        case 'Processing':
          updateFields.push('Confirm_By = ?', 'Confirm_Date = ?');
          updateParams.push(userName, currentTime);
          break;
        case 'Picked':
          updateFields.push('Pick_By = ?', 'Pick_Date = ?');
          updateParams.push(userName, currentTime);
          break;
        case 'Dispatched':
          updateFields.push('Pack_By = ?', 'Pack_Date = ?');
          updateParams.push(userName, currentTime);
          break;
        case 'Completed':
          updateFields.push('Delivered_By = ?', 'Delivered_Date = ?');
          updateParams.push(userName, currentTime);
          break;
      }

      if (notes) {
        updateFields.push('Remark = ?');
        updateParams.push(notes);
      }

      updateFields.push('Last_Sync = ?');
      updateParams.push(currentTime);
      updateParams.push(orderId);

      const updateQuery = `
        UPDATE order_master
        SET ${updateFields.join(', ')}
        WHERE Order_Id = ?
      `;

      await executeQuery(updateQuery, updateParams);

      res.json({ message: 'Order status updated successfully' });

    } catch (error) {
      console.error('Update order status error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;
