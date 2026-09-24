import express from 'express';
import { executeQuery } from '../config/database.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { validateRequest, retailerCreateSchema, retailerUpdateSchema } from '../middleware/validation.js';

const router = express.Router();

// Get retailers with filtering, role-based scoping, and pagination
router.get('/', authenticateToken, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      search,
      status,
      area_id,
      confirmed_only
    } = req.query;

    let whereConditions = [];
    let queryParams = [];

    // Role-based filtering
    if (req.user.role !== 'super_admin') {
      if (req.user.role === 'admin' && req.user.company_id) {
        // Admin sees retailers associated with their company's stores
        whereConditions.push('EXISTS (SELECT 1 FROM order_master om LEFT JOIN stores s ON om.Branch = s.Branch_Code WHERE om.Retailer_Id = retailers.Retailer_Id AND s.company_id = ?)');
        queryParams.push(req.user.company_id);
      } else if (req.user.role === 'manager' && req.user.store_id) {
        // Manager sees retailers associated with their store
        whereConditions.push('EXISTS (SELECT 1 FROM order_master om WHERE om.Retailer_Id = retailers.Retailer_Id AND om.Branch = ?)');
        queryParams.push(req.user.store_id);
      } else if (req.user.role === 'salesman' && req.user.store_id) {
        // Salesman sees retailers associated with their store
        whereConditions.push('EXISTS (SELECT 1 FROM order_master om WHERE om.Retailer_Id = retailers.Retailer_Id AND om.Branch = ?)');
        queryParams.push(req.user.store_id);
      } else if (req.user.role === 'retailer' && req.user.retailer_id) {
        // Retailer sees only themselves
        whereConditions.push('Retailer_Id = ?');
        queryParams.push(req.user.retailer_id);
      } else {
        return res.json({ retailers: [], pagination: { page: 1, limit: 50, total: 0, pages: 0 } });
      }
    }

    if (search) {
      whereConditions.push('(Retailer_Name LIKE ? OR Contact_Person LIKE ? OR Retailer_Email LIKE ?)');
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm);
    }

    if (status !== undefined) {
      whereConditions.push('Retailer_Status = ?');
      queryParams.push(status);
    }

    if (area_id) {
      whereConditions.push('Area_Id = ?');
      queryParams.push(area_id);
    }

    if (confirmed_only === 'true') {
      whereConditions.push('Confirm = 1');
    }

    const whereClause = whereConditions.length > 0 ?
      `WHERE ${whereConditions.join(' AND ')}` : '';

    const countResult = await executeQuery(`SELECT COUNT(*) as total FROM retailers ${whereClause}`, queryParams);
    const total = countResult[0].total;

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(limit) || 50));
    const offset = (pageNum - 1) * limitNum;

    const retailers = await executeQuery(
      `SELECT * FROM retailers ${whereClause} ORDER BY Retailer_Name ASC LIMIT ? OFFSET ?`,
      [...queryParams, limitNum, offset]
    );

    res.json({
      retailers,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) }
    });
  } catch (error) {
    console.error('Get retailers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get retailer by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const retailerId = req.params.id;

    const retailers = await executeQuery(
      'SELECT * FROM retailers WHERE Retailer_Id = ?',
      [retailerId]
    );

    if (retailers.length === 0) {
      return res.status(404).json({ error: 'Retailer not found' });
    }

    // Role-based access check
    if (req.user.role === 'retailer' && req.user.retailer_id !== parseInt(retailerId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(retailers[0]);
  } catch (error) {
    console.error('Get retailer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new retailer
router.post('/',
  authenticateToken,
  authorizeRoles('super_admin', 'admin', 'manager'),
  validateRequest(retailerCreateSchema),
  async (req, res) => {
    try {
      const retailerData = {
        ...req.body,
        Retailer_Status: 1,
        Confirm: 0,
        Last_Sync: Date.now()
      };

      const fields = Object.keys(retailerData);
      const values = Object.values(retailerData);
      const placeholders = fields.map(() => '?').join(', ');

      const result = await executeQuery(
        `INSERT INTO retailers (${fields.join(', ')}) VALUES (${placeholders})`,
        values
      );

      res.status(201).json({
        message: 'Retailer created successfully',
        retailer_id: result.insertId
      });
    } catch (error) {
      console.error('Create retailer error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Update retailer (with field allowlist to prevent mass-assignment)
router.put('/:id',
  authenticateToken,
  authorizeRoles('super_admin', 'admin', 'manager'),
  validateRequest(retailerUpdateSchema),
  async (req, res) => {
    try {
      const retailerId = req.params.id;
      const updateData = { ...req.body, Last_Sync: Date.now() };

      delete updateData.Retailer_Id;

      // Only allow known fields
      const allowedFields = [
        'Retailer_Name', 'Retailer_Address', 'Retailer_Mobile', 'Contact_Person',
        'Retailer_Email', 'GST_No', 'Credit_Limit', 'Area_Name', 'Pincode',
        'Retailer_Status', 'Confirm', 'Last_Sync', 'Mobile_Order', 'Mobile_Account',
        'Owner_Mobile', 'latitude', 'logitude', 'Area_Id', 'Type_Id',
        'Retailer_Tour_Id', 'Retailer_TFAT_Id', 'RetailerCRMId', 'RetailerImage'
      ];

      const filteredData = {};
      for (const key of Object.keys(updateData)) {
        if (allowedFields.includes(key)) {
          filteredData[key] = updateData[key];
        }
      }

      const fields = Object.keys(filteredData);
      if (fields.length === 0) {
        return res.status(400).json({ error: 'No valid fields to update' });
      }
      const values = Object.values(filteredData);
      const setClause = fields.map(field => `${field} = ?`).join(', ');

      const result = await executeQuery(
        `UPDATE retailers SET ${setClause} WHERE Retailer_Id = ?`,
        [...values, retailerId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Retailer not found' });
      }

      res.json({ message: 'Retailer updated successfully' });
    } catch (error) {
      console.error('Update retailer error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Confirm retailer
router.patch('/:id/confirm',
  authenticateToken,
  authorizeRoles('super_admin', 'admin', 'manager'),
  async (req, res) => {
    try {
      const retailerId = req.params.id;

      const result = await executeQuery(
        'UPDATE retailers SET Confirm = 1, Last_Sync = ? WHERE Retailer_Id = ?',
        [Date.now(), retailerId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Retailer not found' });
      }

      res.json({ message: 'Retailer confirmed successfully' });
    } catch (error) {
      console.error('Confirm retailer error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Update retailer status
router.patch('/:id/status',
  authenticateToken,
  authorizeRoles('super_admin', 'admin', 'manager'),
  async (req, res) => {
    try {
      const retailerId = req.params.id;
      const { status } = req.body;

      if (![0, 1].includes(status)) {
        return res.status(400).json({ error: 'Status must be 0 (inactive) or 1 (active)' });
      }

      const result = await executeQuery(
        'UPDATE retailers SET Retailer_Status = ?, Last_Sync = ? WHERE Retailer_Id = ?',
        [status, Date.now(), retailerId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Retailer not found' });
      }

      res.json({ message: 'Retailer status updated successfully' });
    } catch (error) {
      console.error('Update retailer status error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Delete retailer (with deletion protection)
router.delete('/:id',
  authenticateToken,
  authorizeRoles('super_admin', 'admin'),
  async (req, res) => {
    try {
      const retailerId = req.params.id;

      // Check for dependent orders
      const orders = await executeQuery(
        'SELECT COUNT(*) as count FROM order_master WHERE Retailer_Id = ?',
        [retailerId]
      );

      if (orders[0].count > 0) {
        return res.status(409).json({
          error: `Cannot delete retailer: ${orders[0].count} order(s) are still associated with this retailer. Deactivate the retailer instead.`
        });
      }

      // Check for dependent users
      const users = await executeQuery(
        'SELECT COUNT(*) as count FROM users WHERE retailer_id = ?',
        [retailerId]
      );

      if (users[0].count > 0) {
        return res.status(409).json({
          error: `Cannot delete retailer: ${users[0].count} user account(s) are still linked to this retailer. Remove them first.`
        });
      }

      const result = await executeQuery(
        'DELETE FROM retailers WHERE Retailer_Id = ?',
        [retailerId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Retailer not found' });
      }

      res.json({ message: 'Retailer deleted successfully' });
    } catch (error) {
      console.error('Delete retailer error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Get retailer statistics (must be before /:id)
router.get('/stats/summary',
  authenticateToken,
  authorizeRoles('super_admin', 'admin', 'manager'),
  async (req, res) => {
    try {
      let whereCondition = '';
      let queryParams = [];

      if (req.user.role === 'admin' && req.user.company_id) {
        whereCondition = 'WHERE EXISTS (SELECT 1 FROM order_master om LEFT JOIN stores s ON om.Branch = s.Branch_Code WHERE om.Retailer_Id = retailers.Retailer_Id AND s.company_id = ?)';
        queryParams.push(req.user.company_id);
      } else if (req.user.role === 'manager' && req.user.store_id) {
        whereCondition = 'WHERE EXISTS (SELECT 1 FROM order_master om WHERE om.Retailer_Id = retailers.Retailer_Id AND om.Branch = ?)';
        queryParams.push(req.user.store_id);
      }

      const stats = await executeQuery(`
        SELECT
          COUNT(*) as total_retailers,
          SUM(CASE WHEN Retailer_Status = 1 THEN 1 ELSE 0 END) as active_retailers,
          SUM(CASE WHEN Confirm = 1 THEN 1 ELSE 0 END) as confirmed_retailers,
          COUNT(DISTINCT Area_Id) as unique_areas,
          AVG(Credit_Limit) as avg_credit_limit
        FROM retailers
        ${whereCondition}
      `, queryParams);

      res.json(stats[0]);
    } catch (error) {
      console.error('Get retailer stats error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;
