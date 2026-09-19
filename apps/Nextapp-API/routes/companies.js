import express from 'express';
import { executeQuery } from '../config/database.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { validateRequest, companyCreateSchema, companyUpdateSchema } from '../middleware/validation.js';

const router = express.Router();

// Get all companies with pagination
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 50, search } = req.query;

    let whereConditions = [];
    let queryParams = [];

    // Non-super_admin users can only see their own company
    if (req.user.role !== 'super_admin') {
      if (req.user.company_id) {
        whereConditions.push('id = ?');
        queryParams.push(req.user.company_id);
      } else {
        return res.json({ companies: [], pagination: { page: 1, limit: 50, total: 0, pages: 0 } });
      }
    }

    if (search) {
      whereConditions.push('(name LIKE ? OR contact_email LIKE ?)');
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const countResult = await executeQuery(`SELECT COUNT(*) as total FROM companies ${whereClause}`, queryParams);
    const total = countResult[0].total;

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(limit) || 50));
    const offset = (pageNum - 1) * limitNum;

    const companies = await executeQuery(
      `SELECT * FROM companies ${whereClause} ORDER BY name ASC LIMIT ? OFFSET ?`,
      [...queryParams, limitNum, offset]
    );

    res.json({
      companies,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) }
    });
  } catch (error) {
    console.error('Get companies error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get company by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const companyId = req.params.id;

    // Non-super_admin users can only view their own company
    if (req.user.role !== 'super_admin' && req.user.company_id !== companyId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const companies = await executeQuery(
      'SELECT * FROM companies WHERE id = ?',
      [companyId]
    );

    if (companies.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }

    res.json(companies[0]);
  } catch (error) {
    console.error('Get company error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new company
router.post('/',
  authenticateToken,
  authorizeRoles('super_admin'),
  validateRequest(companyCreateSchema),
  async (req, res) => {
    try {
      const { name, address, contact_email, contact_phone, logo_url } = req.body;

      const companyId = Date.now().toString();

      await executeQuery(
        `INSERT INTO companies (id, name, address, contact_email, contact_phone, logo_url, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [companyId, name, address || null, contact_email || null, contact_phone || null, logo_url || null, req.user.id]
      );

      res.status(201).json({
        message: 'Company created successfully',
        company_id: companyId
      });
    } catch (error) {
      console.error('Create company error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Update company
router.put('/:id',
  authenticateToken,
  authorizeRoles('super_admin'),
  validateRequest(companyUpdateSchema),
  async (req, res) => {
    try {
      const companyId = req.params.id;
      const updateData = req.body;

      const fields = Object.keys(updateData);
      if (fields.length === 0) {
        return res.status(400).json({ error: 'No valid fields to update' });
      }
      const values = Object.values(updateData);
      const setClause = fields.map(field => `${field} = ?`).join(', ');

      const result = await executeQuery(
        `UPDATE companies SET ${setClause} WHERE id = ?`,
        [...values, companyId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Company not found' });
      }

      res.json({ message: 'Company updated successfully' });
    } catch (error) {
      console.error('Update company error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Delete company (with deletion protection)
router.delete('/:id',
  authenticateToken,
  authorizeRoles('super_admin'),
  async (req, res) => {
    try {
      const companyId = req.params.id;

      // Check for dependent stores
      const stores = await executeQuery(
        'SELECT COUNT(*) as count FROM stores WHERE company_id = ?',
        [companyId]
      );

      if (stores[0].count > 0) {
        return res.status(409).json({
          error: `Cannot delete company: ${stores[0].count} store(s) are still assigned to this company. Remove or reassign them first.`
        });
      }

      // Check for dependent users
      const users = await executeQuery(
        'SELECT COUNT(*) as count FROM users WHERE company_id = ?',
        [companyId]
      );

      if (users[0].count > 0) {
        return res.status(409).json({
          error: `Cannot delete company: ${users[0].count} user(s) are still assigned to this company. Remove or reassign them first.`
        });
      }

      const result = await executeQuery(
        'DELETE FROM companies WHERE id = ?',
        [companyId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Company not found' });
      }

      res.json({ message: 'Company deleted successfully' });
    } catch (error) {
      console.error('Delete company error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;
