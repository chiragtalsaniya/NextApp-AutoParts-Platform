import express from 'express';
import { executeQuery } from '../config/database.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { validateRequest, regionCreateSchema, regionUpdateSchema } from '../middleware/validation.js';

const router = express.Router();

// Get regions with filtering, role-based scoping, and pagination
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { store_id, search, page = 1, limit = 50 } = req.query;

    let whereConditions = [];
    let queryParams = [];

    // Role-based filtering
    if (req.user.role !== 'super_admin') {
      if (req.user.role === 'admin' && req.user.company_id) {
        whereConditions.push('s.company_id = ?');
        queryParams.push(req.user.company_id);
      } else if (req.user.role === 'manager' && req.user.store_id) {
        whereConditions.push('r.store_id = ?');
        queryParams.push(req.user.store_id);
      } else {
        return res.json({ regions: [], pagination: { page: 1, limit: 50, total: 0, pages: 0 } });
      }
    }

    if (store_id) {
      whereConditions.push('r.store_id = ?');
      queryParams.push(store_id);
    }

    if (search) {
      whereConditions.push('r.name LIKE ?');
      queryParams.push(`%${search}%`);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const countResult = await executeQuery(
      `SELECT COUNT(*) as total FROM regions r LEFT JOIN stores s ON r.store_id = s.Branch_Code ${whereClause}`,
      queryParams
    );
    const total = countResult[0].total;

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(limit) || 50));
    const offset = (pageNum - 1) * limitNum;

    const regions = await executeQuery(
      `SELECT r.*, s.Branch_Name as store_name FROM regions r LEFT JOIN stores s ON r.store_id = s.Branch_Code ${whereClause} ORDER BY r.name ASC LIMIT ? OFFSET ?`,
      [...queryParams, limitNum, offset]
    );

    res.json({
      regions,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) }
    });
  } catch (error) {
    console.error('Get regions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get region by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const regionId = req.params.id;

    const regions = await executeQuery(
      'SELECT r.*, s.Branch_Name as store_name, s.company_id as store_company_id FROM regions r LEFT JOIN stores s ON r.store_id = s.Branch_Code WHERE r.id = ?',
      [regionId]
    );

    if (regions.length === 0) {
      return res.status(404).json({ error: 'Region not found' });
    }

    const region = regions[0];

    // Role-based access check
    if (req.user.role !== 'super_admin') {
      if (req.user.role === 'admin' && region.store_company_id !== req.user.company_id) {
        return res.status(403).json({ error: 'Access denied' });
      } else if (req.user.role === 'manager' && region.store_id !== req.user.store_id) {
        return res.status(403).json({ error: 'Access denied' });
      } else if (!['admin', 'manager'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    res.json(region);
  } catch (error) {
    console.error('Get region error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new region
router.post('/',
  authenticateToken,
  authorizeRoles('super_admin', 'admin', 'manager'),
  validateRequest(regionCreateSchema),
  async (req, res) => {
    try {
      const { id, name, store_id } = req.body;

      // Check if region ID already exists
      const existingRegions = await executeQuery(
        'SELECT id FROM regions WHERE id = ?',
        [id]
      );

      if (existingRegions.length > 0) {
        return res.status(409).json({ error: 'Region with this ID already exists' });
      }

      // Check if store exists
      const stores = await executeQuery(
        'SELECT Branch_Code, company_id FROM stores WHERE Branch_Code = ?',
        [store_id]
      );

      if (stores.length === 0) {
        return res.status(400).json({ error: 'Store not found' });
      }

      // Check if user has access to this store
      if (req.user.role === 'admin') {
        if (stores[0].company_id !== req.user.company_id) {
          return res.status(403).json({ error: 'Cannot create region for store from another company' });
        }
      } else if (req.user.role === 'manager' && req.user.store_id !== store_id) {
        return res.status(403).json({ error: 'Cannot create region for another store' });
      }

      await executeQuery(
        'INSERT INTO regions (id, name, store_id, created_by) VALUES (?, ?, ?, ?)',
        [id, name, store_id, req.user.id]
      );

      res.status(201).json({
        message: 'Region created successfully',
        region_id: id
      });
    } catch (error) {
      console.error('Create region error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Update region
router.put('/:id',
  authenticateToken,
  authorizeRoles('super_admin', 'admin', 'manager'),
  validateRequest(regionUpdateSchema),
  async (req, res) => {
    try {
      const regionId = req.params.id;
      const { name, store_id } = req.body;

      const existingRegions = await executeQuery(
        'SELECT * FROM regions WHERE id = ?',
        [regionId]
      );

      if (existingRegions.length === 0) {
        return res.status(404).json({ error: 'Region not found' });
      }

      const existingRegion = existingRegions[0];

      // Check if user has access to this region
      if (req.user.role === 'admin') {
        const storeDetails = await executeQuery(
          'SELECT company_id FROM stores WHERE Branch_Code = ?',
          [existingRegion.store_id]
        );

        if (storeDetails.length > 0 && storeDetails[0].company_id !== req.user.company_id) {
          return res.status(403).json({ error: 'Cannot update region from another company' });
        }
      } else if (req.user.role === 'manager' && req.user.store_id !== existingRegion.store_id) {
        return res.status(403).json({ error: 'Cannot update region from another store' });
      }

      // If store_id is changing, check access to new store
      if (store_id && store_id !== existingRegion.store_id) {
        const stores = await executeQuery(
          'SELECT Branch_Code, company_id FROM stores WHERE Branch_Code = ?',
          [store_id]
        );

        if (stores.length === 0) {
          return res.status(400).json({ error: 'Store not found' });
        }

        if (req.user.role === 'admin' && stores[0].company_id !== req.user.company_id) {
          return res.status(403).json({ error: 'Cannot assign region to store from another company' });
        } else if (req.user.role === 'manager' && store_id !== req.user.store_id) {
          return res.status(403).json({ error: 'Cannot assign region to another store' });
        }
      }

      const result = await executeQuery(
        'UPDATE regions SET name = ?, store_id = ? WHERE id = ?',
        [name || existingRegion.name, store_id || existingRegion.store_id, regionId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Region not found' });
      }

      res.json({ message: 'Region updated successfully' });
    } catch (error) {
      console.error('Update region error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Delete region (with deletion protection)
router.delete('/:id',
  authenticateToken,
  authorizeRoles('super_admin', 'admin', 'manager'),
  async (req, res) => {
    try {
      const regionId = req.params.id;

      const existingRegions = await executeQuery(
        'SELECT * FROM regions WHERE id = ?',
        [regionId]
      );

      if (existingRegions.length === 0) {
        return res.status(404).json({ error: 'Region not found' });
      }

      const existingRegion = existingRegions[0];

      // Check if user has access to this region
      if (req.user.role === 'admin') {
        const storeDetails = await executeQuery(
          'SELECT company_id FROM stores WHERE Branch_Code = ?',
          [existingRegion.store_id]
        );

        if (storeDetails.length > 0 && storeDetails[0].company_id !== req.user.company_id) {
          return res.status(403).json({ error: 'Cannot delete region from another company' });
        }
      } else if (req.user.role === 'manager' && req.user.store_id !== existingRegion.store_id) {
        return res.status(403).json({ error: 'Cannot delete region from another store' });
      }

      // Check for dependent retailers
      const retailers = await executeQuery(
        'SELECT COUNT(*) as count FROM retailers WHERE Area_Id IN (SELECT id FROM regions WHERE id = ?)',
        [regionId]
      );

      if (retailers[0].count > 0) {
        return res.status(409).json({
          error: `Cannot delete region: ${retailers[0].count} retailer(s) are still assigned to this region. Reassign them first.`
        });
      }

      const result = await executeQuery(
        'DELETE FROM regions WHERE id = ?',
        [regionId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Region not found' });
      }

      res.json({ message: 'Region deleted successfully' });
    } catch (error) {
      console.error('Delete region error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;
