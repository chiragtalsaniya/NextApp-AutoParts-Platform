import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// ✅ Valid MySQL pool configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '8V4S6o7XDQHh',
  database: process.env.DB_NAME || 'nextapp_crm',
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 60000,
  charset: 'utf8mb4',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: true } : false,
};

// Create connection pool
export const pool = mysql.createPool(dbConfig);

// ✅ Test DB connection and run migrations
export const connectDB = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ MySQL Database connected successfully');
    console.log(`📍 Connected to: ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);

    try {
      await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\``);
      await connection.execute(`USE \`${dbConfig.database}\``);
      console.log(`📊 Database '${dbConfig.database}' is ready`);
    } catch (dbError) {
      console.warn('⚠️ Database creation/selection warning:', dbError.message);
    }

    connection.release();

    const { runMigrations } = await import('../migrations/init-database.js');
    await runMigrations();

  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Connection details:', {
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      database: dbConfig.database
    });
    process.exit(1);
  }
};

// ✅ Execute basic query
export const executeQuery = async (query, params = []) => {
  try {
    const [rows] = await pool.execute(query, params);
    return rows;
  } catch (error) {
    console.error('❌ Database query error:', error);
    throw error;
  }
};

// ✅ Transaction helper
export const executeTransaction = async (queries) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const results = [];
    for (const { query, params } of queries) {
      const [result] = await connection.execute(query, params);
      results.push(result);
    }

    await connection.commit();
    return results;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export default pool;
