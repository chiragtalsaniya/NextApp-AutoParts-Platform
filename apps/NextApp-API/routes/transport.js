import express from 'express';
import { executeQuery } from '../config/database.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const rows = await executeQuery(
      `SELECT t.*, s.Branch_Name
       FROM transport t
       LEFT JOIN stores s ON t.store_id = s.Branch_Code
       ORDER BY t.provider ASC`,
    );
    res.json({ transports: rows });
  } catch (error) {
    console.error('Get transport error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authenticateToken, authorizeRoles('super_admin', 'admin', 'manager'), async (req, res) => {
  try {
    const { store_id, type, provider, contact_number } = req.body;
    if (!store_id || !type || !provider) {
      return res.status(400).json({ error: 'Store, type, and provider are required' });
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

router.put('/:id', authenticateToken, authorizeRoles('super_admin', 'admin', 'manager'), async (req, res) => {
  try {
    const { store_id, type, provider, contact_number } = req.body;
    const result = await executeQuery(
      'UPDATE transport SET store_id = ?, type = ?, provider = ?, contact_number = ? WHERE id = ?',
      [store_id, type, provider, contact_number || null, req.params.id],
    );
    if (!result.affectedRows) return res.status(404).json({ error: 'Transport not found' });
    res.json({ message: 'Transport updated successfully' });
  } catch (error) {
    console.error('Update transport error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', authenticateToken, authorizeRoles('super_admin', 'admin'), async (req, res) => {
  try {
    const result = await executeQuery('DELETE FROM transport WHERE id = ?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ error: 'Transport not found' });
    res.json({ message: 'Transport deleted successfully' });
  } catch (error) {
    console.error('Delete transport error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
