import express from 'express';
import bcrypt from 'bcryptjs';
import { executeQuery } from '../config/database.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { validateRequest, userCreateSchema, userUpdateSchema } from '../middleware/validation.js';

const router = express.Router();

// Get users with filtering and pagination
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      search,
      role,
      company_id,
      store_id,
      is_active
    } = req.query;

    let whereConditions = [];
    let queryParams = [];

    // Role-based filtering
    if (req.user.role !== 'super_admin') {
      if (req.user.role === 'admin' && req.user.company_id) {
        whereConditions.push('(company_id = ? OR role = "super_admin")');
        queryParams.push(req.user.company_id);
      } else if (req.user.role === 'manager' && req.user.store_id) {
        whereConditions.push('(store_id = ? OR (company_id = ? AND role IN ("admin", "manager")))');
        queryParams.push(req.user.store_id, req.user.company_id);
      } else {
        // Other roles can only see themselves
        whereConditions.push('id = ?');
        queryParams.push(req.user.id);
      }
    }

    // Additional filters
    if (search) {
      whereConditions.push('(name LIKE ? OR email LIKE ?)');
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm);
    }

    if (role) {
      whereConditions.push('role = ?');
      queryParams.push(role);
    }

    if (company_id) {
      whereConditions.push('company_id = ?');
      queryParams.push(company_id);
    }

    if (store_id) {
      whereConditions.push('store_id = ?');
      queryParams.push(store_id);
    }

    if (is_active !== undefined) {
      whereConditions.push('is_active = ?');
      queryParams.push(is_active === 'true');
    }

    const whereClause = whereConditions.length > 0 ? 
      `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM users ${whereClause}`;
    const countResult = await executeQuery(countQuery, queryParams);
    const total = countResult[0].total;

    // Get users with pagination
    const safeLimit = Number.isFinite(Number(limit)) && Number(limit) > 0 ? Number(limit) : 50;
    const safePage = Number.isFinite(Number(page)) && Number(page) > 0 ? Number(page) : 1;
    const offset = (safePage - 1) * safeLimit;
    console.log('Users query params:', safeLimit, offset);
    let usersQuery = 'SELECT id, name, email, role, company_id, store_id, region_id, retailer_id, profile_image, is_active, last_login, created_at, updated_at FROM users';
    if (whereClause) usersQuery += ` ${whereClause}`;
    usersQuery += ` ORDER BY created_at DESC LIMIT ${safeLimit} OFFSET ${offset}`;
    console.log('Users SQL:', usersQuery);
    console.log('Users params:', queryParams);
    const users = await executeQuery(usersQuery, queryParams);

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.params.id;

    // Check if user can access this user
    if (req.user.role !== 'super_admin' && 
        req.user.role !== 'admin' && 
        req.user.role !== 'manager' && 
        req.user.id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const users = await executeQuery(
      `SELECT id, name, email, role, company_id, store_id, region_id, retailer_id, 
              profile_image, is_active, last_login, created_at, updated_at
       FROM users WHERE id = ?`,
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(users[0]);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new user
router.post('/', 
  authenticateToken,
  authorizeRoles('super_admin', 'admin', 'manager'),
  validateRequest(userCreateSchema),
  async (req, res) => {
    try {
      const userData = req.body;

      // Check if email already exists
      const existingUsers = await executeQuery(
        'SELECT id FROM users WHERE email = ?',
        [userData.email]
      );

      if (existingUsers.length > 0) {
        return res.status(409).json({ error: 'Email already exists' });
      }

      // Hash password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

      // Generate user ID
      const userId = Date.now().toString();

      // Prepare user data
      const newUser = {
        id: userId,
        name: userData.name,
        email: userData.email,
        password_hash: hashedPassword,
        role: userData.role,
        company_id: userData.company_id || null,
        store_id: userData.store_id || null,
        region_id: userData.region_id || null,
        retailer_id: userData.retailer_id || null,
        profile_image: userData.profile_image || null,
        is_active: true
      };

      // Role-based validation
      if (req.user.role === 'admin') {
        // Admin can only create users in their company
        if (userData.role !== 'retailer' && userData.company_id !== req.user.company_id) {
          return res.status(403).json({ error: 'Cannot create users outside your company' });
        }
      } else if (req.user.role === 'manager') {
        // Manager can only create users in their store
        if (!['storeman', 'salesman'].includes(userData.role) || userData.store_id !== req.user.store_id) {
          return res.status(403).json({ error: 'Cannot create users outside your store' });
        }
      }

      const fields = Object.keys(newUser);
      const values = Object.values(newUser);
      const placeholders = fields.map(() => '?').join(', ');

      const insertQuery = `
        INSERT INTO users (${fields.join(', ')})
        VALUES (${placeholders})
      `;

      await executeQuery(insertQuery, values);

      // Return user without password
      const { password_hash, ...userResponse } = newUser;
      res.status(201).json({
        message: 'User created successfully',
        user: userResponse
      });
    } catch (error) {
      console.error('Create user error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Update user
router.put('/:id',
  authenticateToken,
  authorizeRoles('super_admin', 'admin', 'manager'),
  validateRequest(userUpdateSchema),
  async (req, res) => {
    try {
      const userId = req.params.id;
      const updateData = req.body;

      // Check if user exists
      const existingUsers = await executeQuery(
        'SELECT * FROM users WHERE id = ?',
        [userId]
      );

      if (existingUsers.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      const existingUser = existingUsers[0];

      // Role-based access control
      if (req.user.role === 'admin') {
        if (existingUser.company_id !== req.user.company_id && existingUser.role !== 'retailer') {
          return res.status(403).json({ error: 'Cannot update users outside your company' });
        }
      } else if (req.user.role === 'manager') {
        if (existingUser.store_id !== req.user.store_id) {
          return res.status(403).json({ error: 'Cannot update users outside your store' });
        }
      }

      // Check if email is being changed and if it already exists
      if (updateData.email && updateData.email !== existingUser.email) {
        const emailExists = await executeQuery(
          'SELECT id FROM users WHERE email = ? AND id != ?',
          [updateData.email, userId]
        );

        if (emailExists.length > 0) {
          return res.status(409).json({ error: 'Email already exists' });
        }
      }

      // Remove password from update data (use separate endpoint for password changes)
      delete updateData.password;

      const fields = Object.keys(updateData);
      const values = Object.values(updateData);
      const setClause = fields.map(field => `${field} = ?`).join(', ');

      const updateQuery = `
        UPDATE users 
        SET ${setClause}
        WHERE id = ?
      `;

      await executeQuery(updateQuery, [...values, userId]);

      res.json({ message: 'User updated successfully' });
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Delete user
router.delete('/:id',
  authenticateToken,
  authorizeRoles('super_admin', 'admin'),
  async (req, res) => {
    try {
      const userId = req.params.id;

      // Prevent deleting self
      if (userId === req.user.id) {
        return res.status(400).json({ error: 'Cannot delete your own account' });
      }

      // Check if user exists
      const existingUsers = await executeQuery(
        'SELECT * FROM users WHERE id = ?',
        [userId]
      );

      if (existingUsers.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      const existingUser = existingUsers[0];

      // Role-based access control
      if (req.user.role === 'admin') {
        if (existingUser.company_id !== req.user.company_id && existingUser.role !== 'retailer') {
          return res.status(403).json({ error: 'Cannot delete users outside your company' });
        }
        // Admin cannot delete super_admin
        if (existingUser.role === 'super_admin') {
          return res.status(403).json({ error: 'Cannot delete super admin users' });
        }
      }

      await executeQuery('DELETE FROM users WHERE id = ?', [userId]);

      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Update user status (activate/deactivate)
router.patch('/:id/status',
  authenticateToken,
  authorizeRoles('super_admin', 'admin', 'manager'),
  async (req, res) => {
    try {
      const userId = req.params.id;
      const { is_active } = req.body;

      if (typeof is_active !== 'boolean') {
        return res.status(400).json({ error: 'is_active must be a boolean' });
      }

      // Prevent deactivating self
      if (userId === req.user.id && !is_active) {
        return res.status(400).json({ error: 'Cannot deactivate your own account' });
      }

      const updateQuery = `
        UPDATE users 
        SET is_active = ?
        WHERE id = ?
      `;

      const result = await executeQuery(updateQuery, [is_active, userId]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ 
        message: `User ${is_active ? 'activated' : 'deactivated'} successfully` 
      });
    } catch (error) {
      console.error('Update user status error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Get user statistics
router.get('/stats/summary', 
  authenticateToken,
  authorizeRoles('super_admin', 'admin'),
  async (req, res) => {
    try {
      let whereCondition = '';
      let queryParams = [];

      // Role-based filtering
      if (req.user.role === 'admin') {
        whereCondition = 'WHERE company_id = ? OR role = "retailer"';
        queryParams.push(req.user.company_id);
      }

      const statsQuery = `
        SELECT 
          COUNT(*) as total_users,
          SUM(CASE WHEN is_active = TRUE THEN 1 ELSE 0 END) as active_users,
          SUM(CASE WHEN role = 'retailer' THEN 1 ELSE 0 END) as retailer_users,
          SUM(CASE WHEN role != 'retailer' THEN 1 ELSE 0 END) as staff_users,
          SUM(CASE WHEN last_login >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as active_last_30_days
        FROM users
        ${whereCondition}
      `;

      const stats = await executeQuery(statsQuery, queryParams);

      res.json(stats[0]);
    } catch (error) {
      console.error('Get user stats error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;