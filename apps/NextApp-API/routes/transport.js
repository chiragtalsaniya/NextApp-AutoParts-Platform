import express from 'express';
import { executeQuery } from '../config/database.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { validateRequest, transportCreateSchema, transportUpdateSchema } from '../middleware/validation.js';

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const conditions = [];
    const params = [];
    if (req.user.role === 'manager' && req.user.store_id) {
      conditions.push('t.store_id = ?');
      params.push(req.user.store_id);
    } else if (req.user.role === 'admin' && req.user.company_id) {
      conditions.push('s.company_id = ?');
      params.push(req.user.company_id);
    } else if (req.user.role !== 'super_admin') {
      return res.json({ transports: [] });
    }

    const rows = await executeQuery(
      `SELECT t.*, s.Branch_Name
       FROM transport t
       LEFT JOIN stores s ON t.store_id = s.Branch_Code
       ${conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''}
       ORDER BY t.provider ASC`,
      params,
    );
    res.json({ transports: rows });
  } catch (error) {
    console.error('Get transport error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authenticateToken, authorizeRoles('super_admin', 'admin', 'manager'), validateRequest(transportCreateSchema), async (req, res) => {
  try {
    const { store_id, type, provider, contact_number } = req.body;
    if (req.user.role === 'manager' && store_id !== req.user.store_id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    if (req.user.role === 'admin' && req.user.company_id) {
      const stores = await executeQuery('SELECT 1 FROM stores WHERE Branch_Code = ? AND company_id = ?', [store_id, req.user.company_id]);
      if (!stores.length) return res.status(403).json({ error: 'Access denied' });
    }
    const result = await executeQuery(
      'INSERT INTO transport (store_id, type, provider, contact_number) VALUES (?, ?, ?, ?)',
      [store_id, type, provider, contact_number || null],
    );
    res.status(201).json({ message: 'Transport created successfully', id: result.insertId });
  } catch (error) {
    console.error('Create transport error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', authenticateToken, authorizeRoles('super_admin', 'admin', 'manager'), validateRequest(transportUpdateSchema), async (req, res) => {
  try {
    const { store_id, type, provider, contact_number } = req.body;
    const existing = await executeQuery(
      `SELECT t.store_id, s.company_id
       FROM transport t
       LEFT JOIN stores s ON t.store_id = s.Branch_Code
       WHERE t.id = ?`,
      [req.params.id],
    );
    if (!existing.length) return res.status(404).json({ error: 'Transport not found' });
    const targetStore = store_id || existing[0].store_id;
    if (req.user.role === 'manager' && targetStore !== req.user.store_id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    if (req.user.role === 'admin' && req.user.company_id) {
      const stores = await executeQuery('SELECT 1 FROM stores WHERE Branch_Code = ? AND company_id = ?', [targetStore, req.user.company_id]);
      if (!stores.length) return res.status(403).json({ error: 'Access denied' });
    }
    const result = await executeQuery(
      'UPDATE transport SET store_id = ?, type = ?, provider = ?, contact_number = ? WHERE id = ?',
      [targetStore, type, provider, contact_number || null, req.params.id],
    );
    res.json({ message: 'Transport updated successfully' });
  } catch (error) {
    console.error('Update transport error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', authenticateToken, authorizeRoles('super_admin', 'admin'), async (req, res) => {
  try {
    if (req.user.role === 'admin' && req.user.company_id) {
      const stores = await executeQuery(
        `SELECT 1
         FROM transport t
         INNER JOIN stores s ON t.store_id = s.Branch_Code
         WHERE t.id = ? AND s.company_id = ?`,
        [req.params.id, req.user.company_id],
      );
      if (!stores.length) return res.status(403).json({ error: 'Access denied' });
    }
    const result = await executeQuery('DELETE FROM transport WHERE id = ?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ error: 'Transport not found' });
    res.json({ message: 'Transport deleted successfully' });
  } catch (error) {
    console.error('Delete transport error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
