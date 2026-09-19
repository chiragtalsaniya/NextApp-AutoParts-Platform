import express from 'express';
import { executeQuery } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const role = req.user.role;
    const companyId = req.user.company_id;
    const storeId = req.user.store_id;
    const retailerId = req.user.retailer_id;

    const stats = {};

    if (role === 'super_admin') {
      const [companyCount] = await executeQuery('SELECT COUNT(*) as count FROM companies');
      stats.companies = companyCount.count;

      const [storeCount] = await executeQuery('SELECT COUNT(*) as count FROM stores');
      stats.stores = storeCount.count;

      const [userCount] = await executeQuery('SELECT COUNT(*) as count FROM users WHERE is_active = TRUE');
      stats.activeUsers = userCount.count;

      const [partCount] = await executeQuery("SELECT COUNT(*) as count FROM parts WHERE Item_Status = 'Active'");
      stats.totalParts = partCount.count;

      const [orderStats] = await executeQuery(`
        SELECT 
          COUNT(*) as total_orders,
          SUM(CASE WHEN DATE(FROM_UNIXTIME(Place_Date / 1000)) = CURDATE() THEN 1 ELSE 0 END) as orders_today
        FROM order_master
      `);
      stats.ordersToday = orderStats.orders_today || 0;
      stats.totalOrders = orderStats.total_orders || 0;

      const [revenue] = await executeQuery(`
        SELECT COALESCE(SUM(oi.ItemAmount), 0) as total_revenue
        FROM order_items oi
        JOIN order_master om ON oi.Order_Id = om.Order_Id
        WHERE om.Order_Status IN ('Completed', 'Dispatched')
      `);
      stats.totalRevenue = revenue.total_revenue || 0;

      const [retailerCount] = await executeQuery('SELECT COUNT(*) as count FROM retailers WHERE Retailer_Status = 1');
      stats.activeRetailers = retailerCount.count;

      const [lowStockCount] = await executeQuery(`
        SELECT COUNT(*) as count FROM parts
        WHERE Item_Status = 'Active' AND (T1 + T2 + T3 + T4 + T5) <= Part_MinQty
      `);
      stats.lowStockItems = lowStockCount.count;
    } else if (role === 'admin') {
      const [storeCount] = await executeQuery('SELECT COUNT(*) as count FROM stores WHERE company_id = ?', [companyId]);
      stats.stores = storeCount.count;

      const [userCount] = await executeQuery('SELECT COUNT(*) as count FROM users WHERE company_id = ? AND is_active = TRUE', [companyId]);
      stats.companyUsers = userCount.count;

      const [partCount] = await executeQuery("SELECT COUNT(*) as count FROM parts WHERE Item_Status = 'Active'");
      stats.totalParts = partCount.count;

      const [orderStats] = await executeQuery(`
        SELECT 
          COUNT(*) as total_orders,
          SUM(CASE WHEN DATE(FROM_UNIXTIME(Place_Date / 1000)) = CURDATE() THEN 1 ELSE 0 END) as orders_today
        FROM order_master om
        LEFT JOIN stores s ON om.Branch = s.Branch_Code
        WHERE s.company_id = ?
      `, [companyId]);
      stats.ordersToday = orderStats.orders_today || 0;
      stats.totalOrders = orderStats.total_orders || 0;

      const [retailerCount] = await executeQuery(`
        SELECT COUNT(DISTINCT om.Retailer_Id) as count
        FROM order_master om
        LEFT JOIN stores s ON om.Branch = s.Branch_Code
        WHERE s.company_id = ? AND om.Retailer_Id IS NOT NULL
      `, [companyId]);
      stats.activeRetailers = retailerCount.count;

      const [revenue] = await executeQuery(`
        SELECT COALESCE(SUM(oi.ItemAmount), 0) as total_revenue
        FROM order_items oi
        JOIN order_master om ON oi.Order_Id = om.Order_Id
        LEFT JOIN stores s ON om.Branch = s.Branch_Code
        WHERE om.Order_Status IN ('Completed', 'Dispatched') AND s.company_id = ?
      `, [companyId]);
      stats.totalRevenue = revenue.total_revenue || 0;
    } else if (role === 'manager') {
      const [partCount] = await executeQuery(`
        SELECT COUNT(*) as count FROM item_status WHERE Branch_Code = ?
      `, [storeId]);
      stats.storeInventory = partCount.count;

      const [orderStats] = await executeQuery(`
        SELECT 
          COUNT(*) as total_orders,
          SUM(CASE WHEN om.Order_Status IN ('New', 'Processing', 'Pending') THEN 1 ELSE 0 END) as pending_orders,
          SUM(CASE WHEN DATE(FROM_UNIXTIME(Place_Date / 1000)) = CURDATE() THEN 1 ELSE 0 END) as orders_today
        FROM order_master om WHERE om.Branch = ?
      `, [storeId]);
      stats.pendingOrders = orderStats.pending_orders || 0;
      stats.ordersToday = orderStats.orders_today || 0;
      stats.totalOrders = orderStats.total_orders || 0;

      const [staffCount] = await executeQuery('SELECT COUNT(*) as count FROM users WHERE store_id = ? AND is_active = TRUE', [storeId]);
      stats.storeStaff = staffCount.count;

      const [retailerCount] = await executeQuery(`
        SELECT COUNT(DISTINCT om.Retailer_Id) as count
        FROM order_master om WHERE om.Branch = ? AND om.Retailer_Id IS NOT NULL
      `, [storeId]);
      stats.storeRetailers = retailerCount.count;

      const [lowStockCount] = await executeQuery(`
        SELECT COUNT(*) as count FROM item_status ist
        JOIN parts p ON ist.Part_No = p.Part_Number
        WHERE ist.Branch_Code = ? AND p.Item_Status = 'Active'
        AND (CAST(ist.Part_A AS UNSIGNED) + CAST(ist.Part_B AS UNSIGNED) + CAST(ist.Part_C AS UNSIGNED)) <= CAST(ist.Part_Max AS UNSIGNED) * 0.2
      `, [storeId]);
      stats.lowStockItems = lowStockCount.count;
    } else if (role === 'storeman') {
      const [partCount] = await executeQuery(`
        SELECT COUNT(*) as count FROM item_status WHERE Branch_Code = ?
      `, [storeId]);
      stats.availableParts = partCount.count;

      const [orderStats] = await executeQuery(`
        SELECT 
          SUM(CASE WHEN om.Order_Status IN ('New', 'Processing', 'Pending') THEN 1 ELSE 0 END) as pending_tasks,
          SUM(CASE WHEN DATE(FROM_UNIXTIME(Place_Date / 1000)) = CURDATE() THEN 1 ELSE 0 END) as orders_today,
          SUM(CASE WHEN om.Order_Status = 'Completed' THEN 1 ELSE 0 END) as completed_orders
        FROM order_master om WHERE om.Branch = ?
      `, [storeId]);
      stats.ordersToday = orderStats.orders_today || 0;
      stats.pendingTasks = orderStats.pending_tasks || 0;
      stats.completedOrders = orderStats.completed_orders || 0;
    } else if (role === 'salesman') {
      const [retailerCount] = await executeQuery(`
        SELECT COUNT(DISTINCT om.Retailer_Id) as count
        FROM order_master om WHERE om.Branch = ? AND om.Retailer_Id IS NOT NULL
      `, [storeId]);
      stats.myRetailers = retailerCount.count;

      const [orderStats] = await executeQuery(`
        SELECT 
          COUNT(*) as orders_created,
          SUM(CASE WHEN DATE(FROM_UNIXTIME(Place_Date / 1000)) = CURDATE() THEN 1 ELSE 0 END) as orders_today
        FROM order_master om WHERE om.Branch = ? AND om.Place_By = ?
      `, [storeId, req.user.id]);
      stats.ordersCreated = orderStats.orders_created || 0;
      stats.ordersToday = orderStats.orders_today || 0;

      const [partCount] = await executeQuery("SELECT COUNT(*) as count FROM parts WHERE Item_Status = 'Active' AND Is_Order_Pad = 1");
      stats.availableParts = partCount.count;
    } else if (role === 'retailer') {
      const [orderStats] = await executeQuery(`
        SELECT 
          COUNT(*) as total_orders,
          SUM(CASE WHEN om.Order_Status IN ('New', 'Processing', 'Pending') THEN 1 ELSE 0 END) as pending_orders,
          SUM(CASE WHEN om.Order_Status = 'Completed' THEN 1 ELSE 0 END) as completed_orders
        FROM order_master om WHERE om.Retailer_Id = ?
      `, [retailerId]);
      stats.myOrders = orderStats.total_orders || 0;
      stats.pendingOrders = orderStats.pending_orders || 0;
      stats.completedOrders = orderStats.completed_orders || 0;

      const [retailer] = await executeQuery('SELECT Credit_Limit FROM retailers WHERE Retailer_Id = ?', [retailerId]);
      stats.creditAvailable = retailer && retailer.length > 0 ? retailer[0].Credit_Limit || 0 : 0;
    }

    res.json(stats);
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
