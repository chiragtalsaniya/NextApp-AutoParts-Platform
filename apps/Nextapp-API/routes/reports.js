import express from 'express';
import { executeQuery } from '../config/database.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// Get order report
router.get('/orders', 
  authenticateToken,
  authorizeRoles('super_admin', 'admin', 'manager'),
  async (req, res) => {
    try {
      const { 
        start_date, 
        end_date, 
        status, 
        retailer_id,
        store_id,
        company_id
      } = req.query;

      let whereConditions = [];
      let queryParams = [];

      // Role-based filtering
      if (req.user.role !== 'super_admin') {
        if (req.user.role === 'admin' && req.user.company_id) {
          whereConditions.push('s.company_id = ?');
          queryParams.push(req.user.company_id);
        } else if (req.user.role === 'manager' && req.user.store_id) {
          whereConditions.push('om.Branch = ?');
          queryParams.push(req.user.store_id);
        }
      }

      // Date range filtering
      if (start_date) {
        whereConditions.push('om.Place_Date >= ?');
        queryParams.push(new Date(start_date).getTime());
      }

      if (end_date) {
        whereConditions.push('om.Place_Date <= ?');
        queryParams.push(new Date(end_date).getTime());
      }

      // Additional filters
      if (status && status !== 'all') {
        whereConditions.push('om.Order_Status = ?');
        queryParams.push(status);
      }

      if (retailer_id) {
        whereConditions.push('om.Retailer_Id = ?');
        queryParams.push(retailer_id);
      }

      if (store_id) {
        whereConditions.push('om.Branch = ?');
        queryParams.push(store_id);
      }

      if (company_id) {
        whereConditions.push('s.company_id = ?');
        queryParams.push(company_id);
      }

      const whereClause = whereConditions.length > 0 ? 
        `WHERE ${whereConditions.join(' AND ')}` : '';

      // Get orders
      const ordersQuery = `
        SELECT 
          om.*,
          r.Retailer_Name,
          r.Contact_Person,
          s.Branch_Name,
          s.Company_Name,
          c.name as company_name
        FROM order_master om
        LEFT JOIN retailers r ON om.Retailer_Id = r.Retailer_Id
        LEFT JOIN stores s ON om.Branch = s.Branch_Code
        LEFT JOIN companies c ON s.company_id = c.id
        ${whereClause}
        ORDER BY om.Place_Date DESC
      `;

      const orders = await executeQuery(ordersQuery, queryParams);

      // Get order items for these orders
      const orderIds = orders.map(order => order.Order_Id);
      
      let orderItems = [];
      if (orderIds.length > 0) {
        const placeholders = orderIds.map(() => '?').join(',');
        const itemsQuery = `
          SELECT 
            oi.*,
            p.Part_Name,
            p.Part_Image
          FROM order_items oi
          LEFT JOIN parts p ON oi.Part_Admin = p.Part_Number
          WHERE oi.Order_Id IN (${placeholders})
          ORDER BY oi.Order_Id, oi.Order_Srl
        `;
        
        orderItems = await executeQuery(itemsQuery, orderIds);
      }

      // Calculate statistics
      const totalOrders = orders.length;
      
      let totalRevenue = 0;
      const statusCounts = {};
      
      orders.forEach(order => {
        // Count by status
        statusCounts[order.Order_Status] = (statusCounts[order.Order_Status] || 0) + 1;
        
        // Sum items for this order
        const orderTotal = orderItems
          .filter(item => item.Order_Id === order.Order_Id)
          .reduce((sum, item) => sum + (item.ItemAmount || 0), 0);
        
        totalRevenue += orderTotal;
      });
      
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      res.json({
        orders,
        orderItems,
        stats: {
          totalOrders,
          totalRevenue,
          avgOrderValue,
          statusCounts
        }
      });
    } catch (error) {
      console.error('Get order report error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Get inventory report
router.get('/inventory', 
  authenticateToken,
  authorizeRoles('super_admin', 'admin', 'manager', 'storeman'),
  async (req, res) => {
    try {
      const { 
        store_id,
        category,
        focus_group,
        low_stock_only
      } = req.query;

      let whereConditions = [];
      let queryParams = [];

      // Role-based filtering
      if (req.user.role !== 'super_admin') {
        if (req.user.role === 'admin' && req.user.company_id) {
          whereConditions.push('s.company_id = ?');
          queryParams.push(req.user.company_id);
        } else if (['manager', 'storeman'].includes(req.user.role) && req.user.store_id) {
          whereConditions.push('ist.Branch_Code = ?');
          queryParams.push(req.user.store_id);
        }
      }

      // Additional filters
      if (store_id) {
        whereConditions.push('ist.Branch_Code = ?');
        queryParams.push(store_id);
      }

      if (category) {
        whereConditions.push('p.Part_Catagory = ?');
        queryParams.push(category);
      }

      if (focus_group) {
        whereConditions.push('p.Focus_Group = ?');
        queryParams.push(focus_group);
      }

      if (low_stock_only === 'true') {
        whereConditions.push('(CAST(ist.Part_A AS UNSIGNED) + CAST(ist.Part_B AS UNSIGNED) + CAST(ist.Part_C AS UNSIGNED)) < CAST(ist.Part_Max AS UNSIGNED) * 0.2');
      }

      const whereClause = whereConditions.length > 0 ? 
        `WHERE ${whereConditions.join(' AND ')}` : '';

      // Get inventory data
      const inventoryQuery = `
        SELECT 
          ist.*,
          s.Branch_Name,
          s.Company_Name,
          p.Part_Name,
          p.Part_Price,
          p.Part_MinQty,
          p.Part_Catagory,
          p.Focus_Group,
          p.Part_Image,
          (CAST(ist.Part_A AS UNSIGNED) + CAST(ist.Part_B AS UNSIGNED) + CAST(ist.Part_C AS UNSIGNED)) as total_stock,
          CAST(ist.Part_Max AS UNSIGNED) as max_stock,
          c.name as company_name
        FROM item_status ist
        LEFT JOIN stores s ON ist.Branch_Code = s.Branch_Code
        LEFT JOIN parts p ON ist.Part_No = p.Part_Number
        LEFT JOIN companies c ON s.company_id = c.id
        ${whereClause}
        ORDER BY ist.Branch_Code, ist.Part_No
      `;

      const inventory = await executeQuery(inventoryQuery, queryParams);

      // Calculate statistics
      const totalItems = inventory.length;
      
      let totalStock = 0;
      let criticalStock = 0;
      let lowStock = 0;
      let goodStock = 0;
      
      inventory.forEach(item => {
        const totalItemStock = item.total_stock || 0;
        const maxItemStock = item.max_stock || 0;
        const stockPercentage = maxItemStock > 0 ? (totalItemStock / maxItemStock) * 100 : 0;
        
        totalStock += totalItemStock;
        
        if (stockPercentage < 20) {
          criticalStock++;
        } else if (stockPercentage < 40) {
          lowStock++;
        } else {
          goodStock++;
        }
        
        // Add stock level indicator
        item.stock_percentage = Math.round(stockPercentage);
        
        if (stockPercentage < 20) {
          item.stock_level = 'critical';
        } else if (stockPercentage < 40) {
          item.stock_level = 'low';
        } else if (stockPercentage < 70) {
          item.stock_level = 'medium';
        } else {
          item.stock_level = 'good';
        }
      });

      res.json({
        inventory,
        stats: {
          totalItems,
          totalStock,
          criticalStock,
          lowStock,
          goodStock
        }
      });
    } catch (error) {
      console.error('Get inventory report error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Get sales report
router.get('/sales', 
  authenticateToken,
  authorizeRoles('super_admin', 'admin', 'manager'),
  async (req, res) => {
    try {
      const { 
        start_date, 
        end_date, 
        store_id,
        company_id
      } = req.query;

      let whereConditions = [];
      let queryParams = [];

      // Role-based filtering
      if (req.user.role !== 'super_admin') {
        if (req.user.role === 'admin' && req.user.company_id) {
          whereConditions.push('s.company_id = ?');
          queryParams.push(req.user.company_id);
        } else if (req.user.role === 'manager' && req.user.store_id) {
          whereConditions.push('om.Branch = ?');
          queryParams.push(req.user.store_id);
        }
      }

      // Date range filtering
      if (start_date) {
        whereConditions.push('om.Place_Date >= ?');
        queryParams.push(new Date(start_date).getTime());
      }

      if (end_date) {
        whereConditions.push('om.Place_Date <= ?');
        queryParams.push(new Date(end_date).getTime());
      }

      // Additional filters
      if (store_id) {
        whereConditions.push('om.Branch = ?');
        queryParams.push(store_id);
      }

      if (company_id) {
        whereConditions.push('s.company_id = ?');
        queryParams.push(company_id);
      }

      // Only include completed orders
      whereConditions.push("om.Order_Status IN ('Completed', 'Delivered')");

      const whereClause = whereConditions.length > 0 ? 
        `WHERE ${whereConditions.join(' AND ')}` : '';

      // Get sales data
      const salesQuery = `
        SELECT 
          om.Order_Id,
          om.CRMOrderId,
          om.Place_Date,
          om.Delivered_Date,
          om.Branch,
          s.Branch_Name,
          s.Company_Name,
          r.Retailer_Name,
          r.Contact_Person,
          SUM(oi.ItemAmount) as total_amount,
          COUNT(oi.Order_Item_Id) as item_count
        FROM order_master om
        JOIN order_items oi ON om.Order_Id = oi.Order_Id
        LEFT JOIN retailers r ON om.Retailer_Id = r.Retailer_Id
        LEFT JOIN stores s ON om.Branch = s.Branch_Code
        ${whereClause}
        GROUP BY om.Order_Id
        ORDER BY om.Place_Date DESC
      `;

      const sales = await executeQuery(salesQuery, queryParams);

      // Get sales by store
      const storeQuery = `
        SELECT 
          s.Branch_Code,
          s.Branch_Name,
          s.Company_Name,
          COUNT(DISTINCT om.Order_Id) as order_count,
          SUM(oi.ItemAmount) as total_amount
        FROM order_master om
        JOIN order_items oi ON om.Order_Id = oi.Order_Id
        JOIN stores s ON om.Branch = s.Branch_Code
        ${whereClause}
        GROUP BY s.Branch_Code
        ORDER BY total_amount DESC
      `;

      const salesByStore = await executeQuery(storeQuery, queryParams);

      // Get sales by part category
      const categoryQuery = `
        SELECT 
          p.Part_Catagory,
          COUNT(oi.Order_Item_Id) as item_count,
          SUM(oi.ItemAmount) as total_amount
        FROM order_items oi
        JOIN parts p ON oi.Part_Admin = p.Part_Number
        JOIN order_master om ON oi.Order_Id = om.Order_Id
        LEFT JOIN stores s ON om.Branch = s.Branch_Code
        ${whereClause}
        GROUP BY p.Part_Catagory
        ORDER BY total_amount DESC
      `;

      const salesByCategory = await executeQuery(categoryQuery, queryParams);

      // Calculate statistics
      const totalSales = sales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
      const totalOrders = sales.length;
      const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

      res.json({
        sales,
        salesByStore,
        salesByCategory,
        stats: {
          totalSales,
          totalOrders,
          avgOrderValue
        }
      });
    } catch (error) {
      console.error('Get sales report error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Get retailer report
router.get('/retailers', 
  authenticateToken,
  authorizeRoles('super_admin', 'admin', 'manager'),
  async (req, res) => {
    try {
      const { 
        start_date, 
        end_date, 
        area_id,
        active_only
      } = req.query;

      let whereConditions = [];
      let queryParams = [];

      // Role-based filtering
      if (req.user.role !== 'super_admin') {
        // For admin and manager, we'll filter retailers based on orders placed with their company/store
        if (req.user.role === 'admin' && req.user.company_id) {
          whereConditions.push('EXISTS (SELECT 1 FROM order_master om JOIN stores s ON om.Branch = s.Branch_Code WHERE om.Retailer_Id = r.Retailer_Id AND s.company_id = ?)');
          queryParams.push(req.user.company_id);
        } else if (req.user.role === 'manager' && req.user.store_id) {
          whereConditions.push('EXISTS (SELECT 1 FROM order_master om WHERE om.Retailer_Id = r.Retailer_Id AND om.Branch = ?)');
          queryParams.push(req.user.store_id);
        }
      }

      // Additional filters
      if (area_id) {
        whereConditions.push('r.Area_Id = ?');
        queryParams.push(area_id);
      }

      if (active_only === 'true') {
        whereConditions.push('r.Retailer_Status = 1');
      }

      const whereClause = whereConditions.length > 0 ? 
        `WHERE ${whereConditions.join(' AND ')}` : '';

      // Get retailers
      const retailersQuery = `
        SELECT 
          r.*,
          COUNT(DISTINCT om.Order_Id) as order_count,
          SUM(oi.ItemAmount) as total_spent
        FROM retailers r
        LEFT JOIN order_master om ON r.Retailer_Id = om.Retailer_Id
        LEFT JOIN order_items oi ON om.Order_Id = oi.Order_Id
        ${whereClause}
        ${start_date ? `AND (om.Place_Date IS NULL OR om.Place_Date >= ${new Date(start_date).getTime()})` : ''}
        ${end_date ? `AND (om.Place_Date IS NULL OR om.Place_Date <= ${new Date(end_date).getTime()})` : ''}
        GROUP BY r.Retailer_Id
        ORDER BY total_spent DESC
      `;

      const retailers = await executeQuery(retailersQuery, queryParams);

      // Get retailers by area
      const areaQuery = `
        SELECT 
          r.Area_Name,
          r.Area_Id,
          COUNT(DISTINCT r.Retailer_Id) as retailer_count,
          COUNT(DISTINCT om.Order_Id) as order_count,
          SUM(oi.ItemAmount) as total_spent
        FROM retailers r
        LEFT JOIN order_master om ON r.Retailer_Id = om.Retailer_Id
        LEFT JOIN order_items oi ON om.Order_Id = oi.Order_Id
        ${whereClause}
        ${start_date ? `AND (om.Place_Date IS NULL OR om.Place_Date >= ${new Date(start_date).getTime()})` : ''}
        ${end_date ? `AND (om.Place_Date IS NULL OR om.Place_Date <= ${new Date(end_date).getTime()})` : ''}
        GROUP BY r.Area_Name, r.Area_Id
        ORDER BY retailer_count DESC
      `;

      const retailersByArea = await executeQuery(areaQuery, queryParams);

      // Calculate statistics
      const totalRetailers = retailers.length;
      const activeRetailers = retailers.filter(r => r.Retailer_Status === 1).length;
      const retailersWithOrders = retailers.filter(r => r.order_count > 0).length;
      const totalSpent = retailers.reduce((sum, retailer) => sum + (retailer.total_spent || 0), 0);

      res.json({
        retailers,
        retailersByArea,
        stats: {
          totalRetailers,
          activeRetailers,
          retailersWithOrders,
          totalSpent
        }
      });
    } catch (error) {
      console.error('Get retailer report error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;