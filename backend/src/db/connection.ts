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
      console.warn('Migration note (non-fatal) 1:', err.message);
    }
  }
  try {
    await pool.execute('ALTER TABLE teams ADD COLUMN invite_code VARCHAR(10) NULL UNIQUE AFTER sport');
    console.log('✓ Migration: teams.invite_code added');
  } catch (err: any) {
    if (err.code !== 'ER_DUP_FIELDNAME' && err.code !== 'ER_DUP_FIELD' && !err.message?.includes('Duplicate column')) {
      console.warn('Migration note (non-fatal) 2:', err.message);
    }
  }
  try {
    await pool.execute("ALTER TABLE documents MODIFY COLUMN document_type ENUM('dni', 'asseguranca', 'image_rights') NOT NULL");
    console.log('✓ Migration: documents.document_type includes image_rights');
  } catch (err: any) {
    if (!err.message?.includes('Duplicate')) {
      console.warn('Migration note (non-fatal) 3:', err.message);
    }
  }
  try {
    await pool.execute("ALTER TABLE tournaments ADD COLUMN sport VARCHAR(20) NULL AFTER name");
    console.log('✓ Migration: tournaments.sport added');
  } catch (err: any) {
    if (err.code !== 'ER_DUP_FIELDNAME' && !err.message?.includes('Duplicate column')) {
      console.warn('Migration note (non-fatal) 4:', err.message);
    }
  }
  try {
    await pool.execute("ALTER TABLE tournaments ADD COLUMN status VARCHAR(20) DEFAULT 'actiu' AFTER format");
    console.log('✓ Migration: tournaments.status added');
  } catch (err: any) {
    if (err.code !== 'ER_DUP_FIELDNAME' && !err.message?.includes('Duplicate column')) {
      console.warn('Migration note (non-fatal) 5:', err.message);
    }
  }
  try {
    await pool.execute("ALTER TABLE tournaments ADD COLUMN start_date DATE NULL AFTER tiebreaker");
    console.log('✓ Migration: tournaments.start_date added');
  } catch (err: any) {
    if (err.code !== 'ER_DUP_FIELDNAME' && !err.message?.includes('Duplicate column')) {
      console.warn('Migration note (non-fatal) 6:', err.message);
    }
  }
  try {
    await pool.execute("ALTER TABLE tournaments ADD COLUMN end_date DATE NULL AFTER start_date");
    console.log('✓ Migration: tournaments.end_date added');
  } catch (err: any) {
    if (err.code !== 'ER_DUP_FIELDNAME' && !err.message?.includes('Duplicate column')) {
      console.warn('Migration note (non-fatal) 7:', err.message);
    }
  }
  try {
    await pool.execute("ALTER TABLE tournaments ADD COLUMN match_duration_minutes INT NULL AFTER end_date");
    console.log('✓ Migration: tournaments.match_duration_minutes added');
  } catch (err: any) {
    if (err.code !== 'ER_DUP_FIELDNAME' && !err.message?.includes('Duplicate column')) {
      console.warn('Migration note (non-fatal) 8:', err.message);
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
