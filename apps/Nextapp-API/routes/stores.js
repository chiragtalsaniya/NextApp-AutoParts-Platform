import express from 'express';
import { executeQuery } from '../config/database.js';
import { authenticateToken, authorizeRoles, authorizeCompanyAccess } from '../middleware/auth.js';

const router = express.Router();

// Get stores with filtering and pagination
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      search,
      company_id
    } = req.query;

    let whereConditions = [];
    let queryParams = [];

    // Role-based filtering
    if (req.user.role !== 'super_admin') {
      if (req.user.company_id) {
        whereConditions.push('company_id = ?');
        queryParams.push(req.user.company_id);
      } else {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    // Additional filters
    if (search) {
      whereConditions.push('(Branch_Code LIKE ? OR Branch_Name LIKE ? OR Branch_Manager LIKE ?)');
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm);
    }

    if (company_id) {
      whereConditions.push('company_id = ?');
      queryParams.push(company_id);
    }

    const whereClause = whereConditions.length > 0 ? 
      `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM stores ${whereClause}`;
    const countResult = await executeQuery(countQuery, queryParams);
    const total = countResult[0].total;

    // Ensure queryParams is always an array
    const safeQueryParams = Array.isArray(queryParams) ? queryParams : [];
    // Get stores with pagination
    const safeLimit = Number.isFinite(Number(limit)) && Number(limit) > 0 ? Number(limit) : 50;
    const safePage = Number.isFinite(Number(page)) && Number(page) > 0 ? Number(page) : 1;
    const offset = (safePage - 1) * safeLimit;
    // Interpolate LIMIT and OFFSET as literals
    const storesQuery = `
      SELECT s.*, c.name as company_name 
      FROM stores s
      LEFT JOIN companies c ON s.company_id = c.id
      ${whereClause}
      ORDER BY s.Branch_Name
      LIMIT ${safeLimit} OFFSET ${offset}`;
    console.log('Stores SQL:', storesQuery);
    console.log('Stores Params:', safeQueryParams);

    const stores = await executeQuery(storesQuery, safeQueryParams);

    res.json({
      stores,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get stores error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get store by ID
router.get('/:branchCode', authenticateToken, async (req, res) => {
  try {
    const branchCode = req.params.branchCode;

    const stores = await executeQuery(
      `SELECT s.*, c.name as company_name 
       FROM stores s
       LEFT JOIN companies c ON s.company_id = c.id
       WHERE s.Branch_Code = ?`,
      [branchCode]
    );

    if (stores.length === 0) {
      return res.status(404).json({ error: 'Store not found' });
    }

    // Check if user has access to this store
    if (req.user.role !== 'super_admin') {
      if (req.user.role === 'admin' && req.user.company_id !== stores[0].company_id) {
        return res.status(403).json({ error: 'Access denied to this store' });
      } else if (['manager', 'storeman', 'salesman'].includes(req.user.role) && req.user.store_id !== branchCode) {
        return res.status(403).json({ error: 'Access denied to this store' });
      }
    }

    res.json(stores[0]);
  } catch (error) {
    console.error('Get store error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new store
router.post('/', 
  authenticateToken,
  authorizeRoles('super_admin', 'admin'),
  async (req, res) => {
    try {
      const { 
        Branch_Code, Branch_Name, Company_Name, Branch_Address, Branch_Phone, 
        Branch_Email, Branch_Manager, Branch_URL, Branch_Manager_Mobile, 
        store_image, company_id 
      } = req.body;

      if (!Branch_Code) {
        return res.status(400).json({ error: 'Branch Code is required' });
      }

      if (!company_id) {
        return res.status(400).json({ error: 'Company ID is required' });
      }

      // Check if user has access to this company
      if (req.user.role === 'admin' && req.user.company_id !== company_id) {
        return res.status(403).json({ error: 'Cannot create store for another company' });
      }

      // Check if store already exists
      const existingStores = await executeQuery(
        'SELECT Branch_Code FROM stores WHERE Branch_Code = ?',
        [Branch_Code]
      );

      if (existingStores.length > 0) {
        return res.status(409).json({ error: 'Store with this Branch Code already exists' });
      }

      // Get company name if not provided
      let companyName = Company_Name;
      if (!companyName && company_id) {
        const companies = await executeQuery(
          'SELECT name FROM companies WHERE id = ?',
          [company_id]
        );
        if (companies.length > 0) {
          companyName = companies[0].name;
        }
      }

      const result = await executeQuery(
        `INSERT INTO stores (
          Branch_Code, Branch_Name, Company_Name, Branch_Address, Branch_Phone, 
          Branch_Email, Branch_Manager, Branch_URL, Branch_Manager_Mobile, 
          store_image, company_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          Branch_Code, Branch_Name || null, companyName || null, 
          Branch_Address || null, Branch_Phone || null, Branch_Email || null, 
          Branch_Manager || null, Branch_URL || null, Branch_Manager_Mobile || null, 
          store_image || null, company_id
        ]
      );

      res.status(201).json({
        message: 'Store created successfully',
        branch_code: Branch_Code
      });
    } catch (error) {
      console.error('Create store error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Update store
router.put('/:branchCode',
  authenticateToken,
  authorizeRoles('super_admin', 'admin'),
  async (req, res) => {
    try {
      const branchCode = req.params.branchCode;
      const { 
        Branch_Name, Company_Name, Branch_Address, Branch_Phone, 
        Branch_Email, Branch_Manager, Branch_URL, Branch_Manager_Mobile, 
        store_image, company_id 
      } = req.body;

      // Check if store exists and get current data
      const existingStores = await executeQuery(
        'SELECT * FROM stores WHERE Branch_Code = ?',
        [branchCode]
      );

      if (existingStores.length === 0) {
        return res.status(404).json({ error: 'Store not found' });
      }

      const existingStore = existingStores[0];

      // Check if user has access to this store
      if (req.user.role === 'admin') {
        if (existingStore.company_id !== req.user.company_id) {
          return res.status(403).json({ error: 'Cannot update store from another company' });
        }
        
        // Admin cannot change company_id
        if (company_id && company_id !== existingStore.company_id) {
          return res.status(403).json({ error: 'Cannot change store company assignment' });
        }
      }

      // Get company name if not provided but company_id is changing
      let companyName = Company_Name;
      if (!companyName && company_id && company_id !== existingStore.company_id) {
        const companies = await executeQuery(
          'SELECT name FROM companies WHERE id = ?',
          [company_id]
        );
        if (companies.length > 0) {
          companyName = companies[0].name;
        }
      }

      const result = await executeQuery(
        `UPDATE stores SET
          Branch_Name = ?, 
          Company_Name = ?, 
          Branch_Address = ?, 
          Branch_Phone = ?, 
          Branch_Email = ?, 
          Branch_Manager = ?, 
          Branch_URL = ?, 
          Branch_Manager_Mobile = ?, 
          store_image = ?, 
          company_id = ?
        WHERE Branch_Code = ?`,
        [
          Branch_Name || existingStore.Branch_Name,
          companyName || existingStore.Company_Name,
          Branch_Address || existingStore.Branch_Address,
          Branch_Phone || existingStore.Branch_Phone,
          Branch_Email || existingStore.Branch_Email,
          Branch_Manager || existingStore.Branch_Manager,
          Branch_URL || existingStore.Branch_URL,
          Branch_Manager_Mobile || existingStore.Branch_Manager_Mobile,
          store_image || existingStore.store_image,
          company_id || existingStore.company_id,
          branchCode
        ]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Store not found' });
      }

      res.json({ message: 'Store updated successfully' });
    } catch (error) {
      console.error('Update store error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Delete store
router.delete('/:branchCode',
  authenticateToken,
  authorizeRoles('super_admin', 'admin'),
  async (req, res) => {
    try {
      const branchCode = req.params.branchCode;

      // Check if store exists and get current data
      const existingStores = await executeQuery(
        'SELECT * FROM stores WHERE Branch_Code = ?',
        [branchCode]
      );

      if (existingStores.length === 0) {
        return res.status(404).json({ error: 'Store not found' });
      }

      const existingStore = existingStores[0];

      // Check if user has access to this store
      if (req.user.role === 'admin' && existingStore.company_id !== req.user.company_id) {
        return res.status(403).json({ error: 'Cannot delete store from another company' });
      }

      const result = await executeQuery(
        'DELETE FROM stores WHERE Branch_Code = ?',
        [branchCode]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Store not found' });
      }

      res.json({ message: 'Store deleted successfully' });
    } catch (error) {
      console.error('Delete store error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;