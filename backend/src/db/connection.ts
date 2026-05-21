import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

let pool: mysql.Pool;

export async function connectDatabase(): Promise<mysql.Pool> {
  if (pool) {
    return pool;
  }

  pool = mysql.createPool({
    host: process.env.DB_HOST || process.env.MYSQLHOST || 'localhost',
    port: parseInt(process.env.DB_PORT || process.env.MYSQLPORT || '3306'),
    user: process.env.DB_USER || process.env.MYSQLUSER || 'root',
    password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || '',
    database: process.env.DB_NAME || process.env.MYSQLDATABASE || 'campo_base',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  // Test connection
  const connection = await pool.getConnection();
  await connection.ping();
  connection.release();

  console.log('Database pool created successfully');
  return pool;
}

export async function getConnection(): Promise<mysql.PoolConnection> {
  if (!pool) {
    await connectDatabase();
  }
  return pool.getConnection();
}

export async function query(sql: string, values?: any[]): Promise<any> {
  const connection = await getConnection();
  try {
    const [rows] = await connection.execute(sql, values);
    return rows;
  } finally {
    connection.release();
  }
}

export { pool };
