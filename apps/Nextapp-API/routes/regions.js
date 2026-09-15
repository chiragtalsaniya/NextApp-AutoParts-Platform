import express from 'express';
import { executeQuery } from '../config/database.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// Get all regions
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { store_id } = req.query;
    
    let query = 'SELECT r.*, s.Branch_Name as store_name FROM regions r LEFT JOIN stores s ON r.store_id = s.Branch_Code';
    let params = [];
    
    if (store_id) {
      query += ' WHERE r.store_id = ?';
      params.push(store_id);
    }
    
    query += ' ORDER BY r.name';
    
    const regions = await executeQuery(query, params);
    res.json(regions);
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
      'SELECT r.*, s.Branch_Name as store_name FROM regions r LEFT JOIN stores s ON r.store_id = s.Branch_Code WHERE r.id = ?',
      [regionId]
    );

    if (regions.length === 0) {
      return res.status(404).json({ error: 'Region not found' });
    }

    res.json(regions[0]);
  } catch (error) {
    console.error('Get region error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new region
router.post('/', 
  authenticateToken,
  authorizeRoles('super_admin', 'admin', 'manager'),
  async (req, res) => {
    try {
      const { id, name, store_id } = req.body;

      if (!id || !name || !store_id) {
        return res.status(400).json({ error: 'Region ID, name, and store ID are required' });
      }

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
        'SELECT Branch_Code FROM stores WHERE Branch_Code = ?',
        [store_id]
      );

      if (stores.length === 0) {
        return res.status(400).json({ error: 'Store not found' });
      }

      // Check if user has access to this store
      if (req.user.role === 'admin') {
        const storeDetails = await executeQuery(
          'SELECT company_id FROM stores WHERE Branch_Code = ?',
          [store_id]
        );
        
        if (storeDetails[0].company_id !== req.user.company_id) {
          return res.status(403).json({ error: 'Cannot create region for store from another company' });
        }
      } else if (req.user.role === 'manager' && req.user.store_id !== store_id) {
        return res.status(403).json({ error: 'Cannot create region for another store' });
      }

      const result = await executeQuery(
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
  async (req, res) => {
    try {
      const regionId = req.params.id;
      const { name, store_id } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'Region name is required' });
      }

      // Check if region exists
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

      // If store_id is changing, check if user has access to the new store
      if (store_id && store_id !== existingRegion.store_id) {
        // Check if store exists
        const stores = await executeQuery(
          'SELECT Branch_Code, company_id FROM stores WHERE Branch_Code = ?',
          [store_id]
        );

        if (stores.length === 0) {
          return res.status(400).json({ error: 'Store not found' });
        }

        // Check access to new store
        if (req.user.role === 'admin' && stores[0].company_id !== req.user.company_id) {
          return res.status(403).json({ error: 'Cannot assign region to store from another company' });
        } else if (req.user.role === 'manager' && store_id !== req.user.store_id) {
          return res.status(403).json({ error: 'Cannot assign region to another store' });
        }
      }

      const result = await executeQuery(
        'UPDATE regions SET name = ?, store_id = ? WHERE id = ?',
        [name, store_id || existingRegion.store_id, regionId]
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

// Delete region
router.delete('/:id',
  authenticateToken,
  authorizeRoles('super_admin', 'admin', 'manager'),
  async (req, res) => {
    try {
      const regionId = req.params.id;

      // Check if region exists
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