import express from 'express';
import { executeQuery } from '../config/database.js';
import { authenticateToken, authorizeRoles, authorizeStoreAccess } from '../middleware/auth.js';
import Joi from 'joi';

const router = express.Router();

// Validation schema for item status
const itemStatusSchema = Joi.object({
  Branch_Code: Joi.string().max(10).required(),
  Part_No: Joi.string().max(50).required(),
  Part_A: Joi.string().max(10).allow(''),
  Part_B: Joi.string().max(10).allow(''),
  Part_C: Joi.string().max(10).allow(''),
  Part_Max: Joi.string().max(10).allow(''),
  Part_Rack: Joi.string().max(20).allow(''),
  LastSale: Joi.number().allow(null),
  LastPurchase: Joi.number().allow(null),
  Narr: Joi.string().max(50).allow('')
});

// Get item status with filtering and pagination
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      branch_code,
      part_no,
      rack,
      search,
      low_stock_only
    } = req.query;

    // Parse page and limit as integers with proper defaults
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 50;
    
    // Ensure positive values
    const safePage = Math.max(1, pageNum);
    const safeLimit = Math.max(1, Math.min(1000, limitNum)); // Cap at 1000 for safety

    let whereConditions = [];
    let queryParams = [];

    // Role-based filtering
    if (req.user.role !== 'super_admin') {
      if (req.user.store_id) {
        whereConditions.push('ist.Branch_Code = ?');
        queryParams.push(req.user.store_id);
      } else if (req.user.company_id) {
        whereConditions.push('s.company_id = ?');
        queryParams.push(req.user.company_id);
      }
    }

    // Additional filters
    if (branch_code) {
      whereConditions.push('ist.Branch_Code = ?');
      queryParams.push(branch_code);
    }

    if (part_no) {
      whereConditions.push('ist.Part_No = ?');
      queryParams.push(part_no);
    }

    if (rack) {
      whereConditions.push('ist.Part_Rack LIKE ?');
      queryParams.push(`%${rack}%`);
    }

    if (search) {
      whereConditions.push('(ist.Part_No LIKE ? OR p.Part_Name LIKE ? OR ist.Part_Rack LIKE ?)');
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm);
    }

    if (low_stock_only === 'true') {
      whereConditions.push('(CAST(ist.Part_A AS UNSIGNED) + CAST(ist.Part_B AS UNSIGNED) + CAST(ist.Part_C AS UNSIGNED)) < CAST(ist.Part_Max AS UNSIGNED) * 0.2');
    }

    const whereClause = whereConditions.length > 0 ? 
      `WHERE ${whereConditions.join(' AND ')}` : '';

    // Clean query parameters - remove any undefined/null values
    const cleanQueryParams = queryParams.filter(param => param !== undefined && param !== null);

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM item_status ist
      LEFT JOIN stores s ON ist.Branch_Code = s.Branch_Code
      LEFT JOIN parts p ON ist.Part_No = p.Part_Number
      ${whereClause}
    `;
    const countResult = await executeQuery(countQuery, cleanQueryParams);
    const total = countResult[0].total;

    // Get item status with pagination
    const offset = (safePage - 1) * safeLimit;
    const finalLimit = Number(safeLimit);
    const finalOffset = Number(offset);

    // Debug logging
    console.log('Pagination params:', { 
      safePage, 
      safeLimit, 
      finalLimit, 
      finalOffset, 
      originalQueryParams: queryParams.length,
      cleanQueryParams: cleanQueryParams.length,
      allParams: [...cleanQueryParams, finalLimit, finalOffset]
    });

    // Build the query with LIMIT/OFFSET interpolated
    const itemStatusQuery = `
      SELECT 
        ist.*,
        s.Branch_Name,
        s.Company_Name,
        p.Part_Name,
        p.Part_Price,
        p.Part_MinQty,
        p.Part_Catagory,
        p.Focus_Group,
        (CAST(ist.Part_A AS UNSIGNED) + CAST(ist.Part_B AS UNSIGNED) + CAST(ist.Part_C AS UNSIGNED)) as total_stock,
        CAST(ist.Part_Max AS UNSIGNED) as max_stock
      FROM item_status ist
      LEFT JOIN stores s ON ist.Branch_Code = s.Branch_Code
      LEFT JOIN parts p ON ist.Part_No = p.Part_Number
      ${whereClause}
      ORDER BY ist.Branch_Code, ist.Part_No
      LIMIT ${finalLimit} OFFSET ${finalOffset}
    `;

    const itemStatus = await executeQuery(itemStatusQuery, cleanQueryParams);

    // Add stock level indicators
    const enrichedData = itemStatus.map(item => {
      const totalStock = item.total_stock || 0;
      const maxStock = item.max_stock || 0;
      const stockPercentage = maxStock > 0 ? (totalStock / maxStock) * 100 : 0;
      
      let stockLevel = 'good';
      if (stockPercentage < 20) stockLevel = 'critical';
      else if (stockPercentage < 40) stockLevel = 'low';
      else if (stockPercentage < 70) stockLevel = 'medium';

      return {
        ...item,
        stock_percentage: Math.round(stockPercentage),
        stock_level: stockLevel
      };
    });

    res.json({
      data: enrichedData,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        pages: Math.ceil(total / safeLimit)
      }
    });
  } catch (error) {
    console.error('Get item status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get item status by store and part
router.get('/:branchCode/:partNo', authenticateToken, async (req, res) => {
  try {
    const { branchCode, partNo } = req.params;

    // Check store access
    if (req.user.role !== 'super_admin' && req.user.store_id !== branchCode) {
      return res.status(403).json({ error: 'Access denied to this store' });
    }

    const itemStatusQuery = `
      SELECT 
        ist.*,
        s.Branch_Name,
        s.Company_Name,
        p.Part_Name,
        p.Part_Price,
        p.Part_MinQty,
        p.Part_Catagory,
        p.Focus_Group,
        p.Part_Image,
        (CAST(ist.Part_A AS UNSIGNED) + CAST(ist.Part_B AS UNSIGNED) + CAST(ist.Part_C AS UNSIGNED)) as total_stock,
        CAST(ist.Part_Max AS UNSIGNED) as max_stock
      FROM item_status ist
      LEFT JOIN stores s ON ist.Branch_Code = s.Branch_Code
      LEFT JOIN parts p ON ist.Part_No = p.Part_Number
      WHERE ist.Branch_Code = ? AND ist.Part_No = ?
    `;

    const result = await executeQuery(itemStatusQuery, [branchCode, partNo]);

    if (result.length === 0) {
      return res.status(404).json({ error: 'Item status not found' });
    }

    const item = result[0];
    const totalStock = item.total_stock || 0;
    const maxStock = item.max_stock || 0;
    const stockPercentage = maxStock > 0 ? (totalStock / maxStock) * 100 : 0;
    
    let stockLevel = 'good';
    if (stockPercentage < 20) stockLevel = 'critical';
    else if (stockPercentage < 40) stockLevel = 'low';
    else if (stockPercentage < 70) stockLevel = 'medium';

    res.json({
      ...item,
      stock_percentage: Math.round(stockPercentage),
      stock_level: stockLevel
    });
  } catch (error) {
    console.error('Get item status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create or update item status
router.post('/', 
  authenticateToken,
  authorizeRoles('super_admin', 'admin', 'manager', 'storeman'),
  async (req, res) => {
    try {
      const { error } = itemStatusSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          error: 'Validation error',
          details: error.details.map(detail => detail.message)
        });
      }

      const { Branch_Code, Part_No, ...itemData } = req.body;

      // Check store access
      if (req.user.role !== 'super_admin' && req.user.store_id !== Branch_Code) {
        return res.status(403).json({ error: 'Access denied to this store' });
      }

      // Generate Part_Branch key
      const Part_Branch = `${Branch_Code}-${Part_No}`;

      // Check if item status already exists
      const existingItem = await executeQuery(
        'SELECT Part_Branch FROM item_status WHERE Branch_Code = ? AND Part_No = ?',
        [Branch_Code, Part_No]
      );

      const currentTime = Date.now();

      if (existingItem.length > 0) {
        // Update existing item status
        const updateFields = Object.keys(itemData);
        const updateValues = Object.values(itemData);
        const setClause = updateFields.map(field => `${field} = ?`).join(', ');

        const updateQuery = `
          UPDATE item_status 
          SET ${setClause}, Last_Sync = ?
          WHERE Branch_Code = ? AND Part_No = ?
        `;

        await executeQuery(updateQuery, [...updateValues, currentTime, Branch_Code, Part_No]);

        res.json({ message: 'Item status updated successfully' });
      } else {
        // Create new item status
        const insertData = {
          Branch_Code,
          Part_No,
          Part_Branch,
          ...itemData,
          Last_Sync: currentTime
        };

        const fields = Object.keys(insertData);
        const values = Object.values(insertData);
        const placeholders = fields.map(() => '?').join(', ');

        const insertQuery = `
          INSERT INTO item_status (${fields.join(', ')})
          VALUES (${placeholders})
        `;

        await executeQuery(insertQuery, values);

        res.status(201).json({ 
          message: 'Item status created successfully',
          part_branch: Part_Branch
        });
      }
    } catch (error) {
      console.error('Create/Update item status error:', error);
      if (error.code === 'ER_NO_REFERENCED_ROW_2') {
        res.status(400).json({ error: 'Invalid Branch_Code or Part_No reference' });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }
);

// Update stock levels (Part_A, Part_B, Part_C)
router.patch('/:branchCode/:partNo/stock',
  authenticateToken,
  authorizeRoles('super_admin', 'admin', 'manager', 'storeman'),
  async (req, res) => {
    try {
      const { branchCode, partNo } = req.params;
      const { Part_A, Part_B, Part_C, Narr } = req.body;

      // Check store access
      if (req.user.role !== 'super_admin' && req.user.store_id !== branchCode) {
        return res.status(403).json({ error: 'Access denied to this store' });
      }

      const updateQuery = `
        UPDATE item_status 
        SET Part_A = ?, Part_B = ?, Part_C = ?, Narr = ?, Last_Sync = ?
        WHERE Branch_Code = ? AND Part_No = ?
      `;

      const result = await executeQuery(updateQuery, [
        Part_A || '0',
        Part_B || '0', 
        Part_C || '0',
        Narr || '',
        Date.now(),
        branchCode,
        partNo
      ]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Item status not found' });
      }

      res.json({ message: 'Stock levels updated successfully' });
    } catch (error) {
      console.error('Update stock levels error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Update rack location
router.patch('/:branchCode/:partNo/rack',
  authenticateToken,
  authorizeRoles('super_admin', 'admin', 'manager', 'storeman'),
  async (req, res) => {
    try {
      const { branchCode, partNo } = req.params;
      const { Part_Rack } = req.body;

      // Check store access
      if (req.user.role !== 'super_admin' && req.user.store_id !== branchCode) {
        return res.status(403).json({ error: 'Access denied to this store' });
      }

      const updateQuery = `
        UPDATE item_status 
        SET Part_Rack = ?, Last_Sync = ?
        WHERE Branch_Code = ? AND Part_No = ?
      `;

      const result = await executeQuery(updateQuery, [
        Part_Rack || '',
        Date.now(),
        branchCode,
        partNo
      ]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Item status not found' });
      }

      res.json({ message: 'Rack location updated successfully' });
    } catch (error) {
      console.error('Update rack location error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Record sale transaction
router.post('/:branchCode/:partNo/sale',
  authenticateToken,
  authorizeRoles('super_admin', 'admin', 'manager', 'storeman'),
  async (req, res) => {
    try {
      const { branchCode, partNo } = req.params;
      const { quantity, notes } = req.body;

      // Check store access
      if (req.user.role !== 'super_admin' && req.user.store_id !== branchCode) {
        return res.status(403).json({ error: 'Access denied to this store' });
      }

      if (!quantity || quantity <= 0) {
        return res.status(400).json({ error: 'Valid quantity is required' });
      }

      const currentTime = Date.now();

      const updateQuery = `
        UPDATE item_status 
        SET LastSale = ?, Narr = ?, Last_Sync = ?
        WHERE Branch_Code = ? AND Part_No = ?
      `;

      const result = await executeQuery(updateQuery, [
        currentTime,
        notes || 'Sale recorded',
        currentTime,
        branchCode,
        partNo
      ]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Item status not found' });
      }

      res.json({ message: 'Sale transaction recorded successfully' });
    } catch (error) {
      console.error('Record sale error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Record purchase transaction
router.post('/:branchCode/:partNo/purchase',
  authenticateToken,
  authorizeRoles('super_admin', 'admin', 'manager', 'storeman'),
  async (req, res) => {
    try {
      const { branchCode, partNo } = req.params;
      const { quantity, notes } = req.body;

      // Check store access
      if (req.user.role !== 'super_admin' && req.user.store_id !== branchCode) {
        return res.status(403).json({ error: 'Access denied to this store' });
      }

      if (!quantity || quantity <= 0) {
        return res.status(400).json({ error: 'Valid quantity is required' });
      }

      const currentTime = Date.now();

      const updateQuery = `
        UPDATE item_status 
        SET LastPurchase = ?, Narr = ?, Last_Sync = ?
        WHERE Branch_Code = ? AND Part_No = ?
      `;

      const result = await executeQuery(updateQuery, [
        currentTime,
        notes || 'Purchase recorded',
        currentTime,
        branchCode,
        partNo
      ]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Item status not found' });
      }

      res.json({ message: 'Purchase transaction recorded successfully' });
    } catch (error) {
      console.error('Record purchase error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Get low stock items by store
router.get('/alerts/low-stock', 
  authenticateToken,
  authorizeRoles('super_admin', 'admin', 'manager', 'storeman'),
  async (req, res) => {
    try {
      const { branch_code } = req.query;

      let whereConditions = [];
      let queryParams = [];

      // Role-based filtering
      if (req.user.role !== 'super_admin') {
        if (req.user.store_id) {
          whereConditions.push('ist.Branch_Code = ?');
          queryParams.push(req.user.store_id);
        } else if (req.user.company_id) {
          whereConditions.push('s.company_id = ?');
          queryParams.push(req.user.company_id);
        }
      }

      if (branch_code) {
        whereConditions.push('ist.Branch_Code = ?');
        queryParams.push(branch_code);
      }

      // Low stock condition (less than 20% of max stock)
      whereConditions.push('(CAST(ist.Part_A AS UNSIGNED) + CAST(ist.Part_B AS UNSIGNED) + CAST(ist.Part_C AS UNSIGNED)) < CAST(ist.Part_Max AS UNSIGNED) * 0.2');

      const whereClause = whereConditions.length > 0 ? 
        `WHERE ${whereConditions.join(' AND ')}` : '';

      const lowStockQuery = `
        SELECT 
          ist.*,
          s.Branch_Name,
          p.Part_Name,
          p.Part_Price,
          (CAST(ist.Part_A AS UNSIGNED) + CAST(ist.Part_B AS UNSIGNED) + CAST(ist.Part_C AS UNSIGNED)) as total_stock,
          CAST(ist.Part_Max AS UNSIGNED) as max_stock
        FROM item_status ist
        LEFT JOIN stores s ON ist.Branch_Code = s.Branch_Code
        LEFT JOIN parts p ON ist.Part_No = p.Part_Number
        ${whereClause}
        ORDER BY total_stock ASC
      `;

      const lowStockItems = await executeQuery(lowStockQuery, queryParams);

      // Add stock level indicators
      const enrichedData = lowStockItems.map(item => {
        const totalStock = item.total_stock || 0;
        const maxStock = item.max_stock || 0;
        const stockPercentage = maxStock > 0 ? (totalStock / maxStock) * 100 : 0;
        
        return {
          ...item,
          stock_percentage: Math.round(stockPercentage),
          urgency: stockPercentage < 10 ? 'critical' : 'low'
        };
      });

      res.json(enrichedData);
    } catch (error) {
      console.error('Get low stock error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Get item status statistics by store
router.get('/stats/:branchCode', authenticateToken, async (req, res) => {
  try {
    const { branchCode } = req.params;

    // Check store access
    if (req.user.role !== 'super_admin' && req.user.store_id !== branchCode) {
      return res.status(403).json({ error: 'Access denied to this store' });
    }

    const statsQuery = `
      SELECT 
        COUNT(*) as total_items,
        SUM(CAST(Part_A AS UNSIGNED) + CAST(Part_B AS UNSIGNED) + CAST(Part_C AS UNSIGNED)) as total_stock,
        AVG(CAST(Part_A AS UNSIGNED) + CAST(Part_B AS UNSIGNED) + CAST(Part_C AS UNSIGNED)) as avg_stock,
        COUNT(CASE WHEN (CAST(Part_A AS UNSIGNED) + CAST(Part_B AS UNSIGNED) + CAST(Part_C AS UNSIGNED)) < CAST(Part_Max AS UNSIGNED) * 0.2 THEN 1 END) as low_stock_items,
        COUNT(CASE WHEN (CAST(Part_A AS UNSIGNED) + CAST(Part_B AS UNSIGNED) + CAST(Part_C AS UNSIGNED)) = 0 THEN 1 END) as out_of_stock_items,
        COUNT(DISTINCT Part_Rack) as unique_racks
      FROM item_status 
      WHERE Branch_Code = ?
    `;

    const stats = await executeQuery(statsQuery, [branchCode]);

    res.json(stats[0]);
  } catch (error) {
    console.error('Get item status stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;