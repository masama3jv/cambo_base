import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

let pool: mysql.Pool;

export async function connectDatabase(): Promise<mysql.Pool> {
  if (pool) {
    return pool;
  }

  const dbUrl = process.env.MYSQL_URL || process.env.DATABASE_URL;

  if (dbUrl) {
    pool = mysql.createPool({
      uri: dbUrl,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
  } else {
    const mysqlHost = process.env.MYSQLHOST || process.env.MYSQL_HOST || process.env.DB_HOST || 'localhost';
    const mysqlPort = parseInt(process.env.MYSQLPORT || process.env.MYSQL_PORT || process.env.DB_PORT || '3306');
    const mysqlUser = process.env.MYSQLUSER || process.env.MYSQL_USER || process.env.DB_USER || 'root';
    const mysqlPass = process.env.MYSQLPASSWORD || process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || '';
    const mysqlDb = process.env.MYSQLDATABASE || process.env.MYSQL_DATABASE || process.env.DB_NAME || 'campo_base';

    pool = mysql.createPool({
      host: mysqlHost,
      port: mysqlPort,
      user: mysqlUser,
      password: mysqlPass,
      database: mysqlDb,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
  }

  // Test connection
  const connection = await pool.getConnection();
  await connection.ping();
  connection.release();

  await runMigrations();

  console.log('Database pool created successfully');
  return pool;
}

async function runMigrations() {
  try {
    await pool.execute('ALTER TABLE courts MODIFY COLUMN tournament_id INT NULL');
    console.log('✓ Migration: courts.tournament_id set to nullable');
  } catch (err: any) {
    if (err.code !== 'ER_DUP_FIELDNAME' && err.code !== 'ER_CANT_DROP_FIELD_OR_KEY') {
      console.warn('Migration note (non-fatal):', err.message);
    }
  }
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
