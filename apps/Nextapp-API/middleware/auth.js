import jwt from 'jsonwebtoken';
import { executeQuery } from '../config/database.js';

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Get user from database
    const users = await executeQuery(
      'SELECT * FROM users WHERE id = ? AND is_active = TRUE',
      [decoded.userId]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = users[0];
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

export const authorizeCompanyAccess = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Super admin can access everything
  if (req.user.role === 'super_admin') {
    return next();
  }

  const companyId = req.params.companyId || req.body.company_id;
  
  if (!companyId) {
    return res.status(400).json({ error: 'Company ID required' });
  }

  // Check if user has access to this company
  if (req.user.company_id !== companyId) {
    return res.status(403).json({ error: 'Access denied to this company' });
  }

  next();
};

export const authorizeStoreAccess = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Super admin can access everything
  if (req.user.role === 'super_admin') {
    return next();
  }

  const storeId = req.params.storeId || req.body.store_id;
  
  if (!storeId) {
    return res.status(400).json({ error: 'Store ID required' });
  }

  // Admin can access stores in their company
  if (req.user.role === 'admin') {
    const stores = await executeQuery(
      'SELECT * FROM stores WHERE Branch_Code = ? AND company_id = ?',
      [storeId, req.user.company_id]
    );
    
    if (stores.length === 0) {
      return res.status(403).json({ error: 'Access denied to this store' });
    }
    
    return next();
  }

  // Other roles can only access their assigned store
  if (req.user.store_id !== storeId) {
    return res.status(403).json({ error: 'Access denied to this store' });
  }

  next();
};