import express from 'express';
import { executeQuery, executeTransaction, pool } from '../config/database.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { validateRequest, orderCreateSchema } from '../middleware/validation.js';

const router = express.Router();

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

    // Role-based filtering with conflict-safe branch filter
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

    // Additional filters
    if (status) {
      whereConditions.push('om.Order_Status = ?');
      queryParams.push(status);
    }

    if (urgent !== undefined) {
      whereConditions.push('om.Urgent_Status = ?');
      queryParams.push(urgent === 'true' ? 1 : 0); // Convert string to boolean for MySQL
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

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM order_master om 
      LEFT JOIN stores s ON om.Branch = s.Branch_Code 
      ${whereClause}
    `;
    const countResult = await executeQuery(countQuery, queryParams);
    const total = countResult[0].total;

    const limitNum = parseInt(limit, 10);
const pageNum = parseInt(page, 10);
const offsetNum = (pageNum - 1) * limitNum;

// Safe and compatible: inline LIMIT/OFFSET into SQL (not as ? placeholders)
const ordersQuery = `
  SELECT 
    om.*,
    r.Retailer_Name,
    r.Contact_Person,
    s.Branch_Name,
    s.Company_Name
  FROM order_master om
  LEFT JOIN retailers r ON om.Retailer_Id = r.Retailer_Id
  LEFT JOIN stores s ON om.Branch = s.Branch_Code
  ${whereClause}
  ORDER BY om.Place_Date DESC
  LIMIT ${limitNum} OFFSET ${offsetNum}
`;

const orders = await executeQuery(ordersQuery, queryParams); // Only for WHERE placeholders

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

    // Get order details
    const orderQuery = `
      SELECT 
        om.*,
        r.Retailer_Name,
        r.Contact_Person,
        r.Retailer_Email,
        s.Branch_Name,
        s.Company_Name
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

    // Check access permissions
    if (req.user.role === 'retailer' && order.Retailer_Id !== req.user.retailer_id) {
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

      // Generate CRM Order ID
      const year = new Date().getFullYear();
      const crmOrderId = `CRM-${year}-${Date.now().toString().slice(-6)}`;

      // Prepare order master data
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
        urgent ? 1 : 0, // Convert boolean to 0/1 for MySQL
        0, // IsSync
        placeDate
      ];

      // Prepare order items data
      const orderItemQueries = items.map((item, index) => {
        const itemAmount = Math.round(
          item.mrp * item.quantity * 
          (1 - (item.basic_discount + item.scheme_discount + item.additional_discount) / 100)
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
            null, // Will be set after order creation
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
            item.urgent ? 1 : 0, // Convert boolean to 0/1 for MySQL
            placeDate
          ]
        };
      });

      // Execute transaction
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();

        // Insert order master
        const [orderResult] = await connection.execute(orderMasterQuery, orderMasterParams);
        const orderId = orderResult.insertId;

        // Insert order items
        for (const itemQuery of orderItemQueries) {
          itemQuery.params[0] = orderId; // Set Order_Id
          await connection.execute(itemQuery.query, itemQuery.params);
        }

        await connection.commit();

        // Get the created order with details
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
router.patch('/:id/status', 
  authenticateToken,
  authorizeRoles('admin', 'manager', 'storeman'),
  async (req, res) => {
    try {
      const orderId = req.params.id;
      const { status, notes } = req.body;

      const validStatuses = ['New', 'Processing', 'Completed', 'Hold', 'Picked', 'Dispatched', 'Pending', 'Cancelled'];
      
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }

      // Update order status
      const updateFields = ['Order_Status = ?'];
      const updateParams = [status];

      // Add status-specific fields
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

      updateParams.push(orderId);

      const updateQuery = `
        UPDATE order_master 
        SET ${updateFields.join(', ')}, Last_Sync = ?
        WHERE Order_Id = ?
      `;

      updateParams.splice(-1, 0, currentTime); // Add Last_Sync before Order_Id

      await executeQuery(updateQuery, updateParams);

      res.json({ message: 'Order status updated successfully' });

    } catch (error) {
      console.error('Update order status error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Get order statistics
router.get('/stats/summary', authenticateToken, async (req, res) => {
  try {
    let whereCondition = '';
    let queryParams = [];

    // Role-based filtering
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

export default router;
