import express from 'express';
import { executeQuery } from '../config/database.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { validateRequest, retailerCreateSchema } from '../middleware/validation.js';

const router = express.Router();

// Get retailers with filtering and pagination
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

    // Role-based filtering for non-super_admin users
    if (req.user.role !== 'super_admin') {
      // Add filtering based on user's access level
      // This would need to be implemented based on your business logic
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

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM retailers ${whereClause}`;
    const countResult = await executeQuery(countQuery, queryParams);
    const total = countResult[0].total;

    // Ensure queryParams is always an array
    const safeQueryParams = Array.isArray(queryParams) ? queryParams : [];
    // Get retailers with pagination
    const safeLimit = Number.isFinite(Number(limit)) && Number(limit) > 0 ? Number(limit) : 50;
    const safePage = Number.isFinite(Number(page)) && Number(page) > 0 ? Number(page) : 1;
    const offset = (safePage - 1) * safeLimit;
    const finalLimit = Number.isFinite(safeLimit) ? safeLimit : 50;
    const finalOffset = Number.isFinite(offset) ? offset : 0;
    console.log('Retailers query params:', finalLimit, finalOffset); // Debug log
    // Build SQL with direct interpolation for LIMIT/OFFSET
    const retailersQuery = `SELECT * FROM retailers${whereClause ? ' ' + whereClause : ''} ORDER BY Retailer_Name ASC LIMIT ${finalLimit} OFFSET ${finalOffset}`;
    console.log('Retailers SQL:', retailersQuery);
    console.log('Retailers params:', safeQueryParams);
    const retailers = await executeQuery(retailersQuery, safeQueryParams);

    res.json({
      retailers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
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

      const insertQuery = `
        INSERT INTO retailers (${fields.join(', ')})
        VALUES (${placeholders})
      `;

      const result = await executeQuery(insertQuery, values);

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

// Update retailer
router.put('/:id',
  authenticateToken,
  authorizeRoles('super_admin', 'admin', 'manager'),
  async (req, res) => {
    try {
      const retailerId = req.params.id;
      const updateData = {
        ...req.body,
        Last_Sync: Date.now()
      };

      // Remove Retailer_Id from update data if present
      delete updateData.Retailer_Id;

      const fields = Object.keys(updateData);
      const values = Object.values(updateData);
      const setClause = fields.map(field => `${field} = ?`).join(', ');

      const updateQuery = `
        UPDATE retailers 
        SET ${setClause}
        WHERE Retailer_Id = ?
      `;

      const result = await executeQuery(updateQuery, [...values, retailerId]);

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

      const updateQuery = `
        UPDATE retailers 
        SET Confirm = 1, Last_Sync = ?
        WHERE Retailer_Id = ?
      `;

      const result = await executeQuery(updateQuery, [Date.now(), retailerId]);

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

      const updateQuery = `
        UPDATE retailers 
        SET Retailer_Status = ?, Last_Sync = ?
        WHERE Retailer_Id = ?
      `;

      const result = await executeQuery(updateQuery, [status, Date.now(), retailerId]);

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

// Get retailer statistics
router.get('/stats/summary', authenticateToken, async (req, res) => {
  try {
    const statsQuery = `
      SELECT 
        COUNT(*) as total_retailers,
        SUM(CASE WHEN Retailer_Status = 1 THEN 1 ELSE 0 END) as active_retailers,
        SUM(CASE WHEN Confirm = 1 THEN 1 ELSE 0 END) as confirmed_retailers,
        COUNT(DISTINCT Area_Id) as unique_areas,
        AVG(Credit_Limit) as avg_credit_limit
      FROM retailers
    `;

    const stats = await executeQuery(statsQuery);

    res.json(stats[0]);
  } catch (error) {
    console.error('Get retailer stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;