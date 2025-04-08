import pg from 'pg';

const pool = new pg.Pool({
  connectionString: 'postgresql://anupam_owner:npg_QIupmAj8R6tX@ep-twilight-boat-a5xlp3cw-pooler.us-east-2.aws.neon.tech/anupam?sslmode=require',
  ssl: {
    rejectUnauthorized: false
  }
});

async function testConnection() {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('✅ Connected to Neon DB:', res.rows[0]);
  } catch (err) {
    console.error('❌ Failed to connect to Neon DB:', err);
  } finally {
    await pool.end();
  }
}

testConnection();
