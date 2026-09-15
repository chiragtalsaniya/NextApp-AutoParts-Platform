import express from 'express';
import { executeQuery } from '../config/database.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// Get all companies
router.get('/', authenticateToken, async (req, res) => {
  try {
    const companies = await executeQuery('SELECT * FROM companies ORDER BY name');
    res.json(companies);
  } catch (error) {
    console.error('Get companies error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get company by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const companyId = req.params.id;
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
  async (req, res) => {
    try {
      const { name, address, contact_email, contact_phone, logo_url } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'Company name is required' });
      }

      // Generate company ID
      const companyId = Date.now().toString();

      const result = await executeQuery(
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
  async (req, res) => {
    try {
      const companyId = req.params.id;
      const { name, address, contact_email, contact_phone, logo_url } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'Company name is required' });
      }

      const result = await executeQuery(
        `UPDATE companies 
         SET name = ?, address = ?, contact_email = ?, contact_phone = ?, logo_url = ?
         WHERE id = ?`,
        [name, address || null, contact_email || null, contact_phone || null, logo_url || null, companyId]
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

// Delete company
router.delete('/:id',
  authenticateToken,
  authorizeRoles('super_admin'),
  async (req, res) => {
    try {
      const companyId = req.params.id;

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