import pg from 'pg';
import POSTGRESQL_DB from '.env'
const pool = new pg.Pool({
  connectionString: POSTGRESQL_DB,
  ssl: {
    rejectUnauthorized: false
  }
});

async function testConnection() {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log(' Connected to Neon DB:', res.rows[0]);
  } catch (err) {
    console.error('Failed to connect to Neon DB:', err);
  } finally {
    await pool.end();
  }
}

testConnection();
