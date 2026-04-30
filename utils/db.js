const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  max: 20,
  keepAlive: true
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

const query = async (text, params) => {
  const maxRetries = 3;
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      const result = await pool.query(text, params);
      return result;
    } catch (err) {
      console.error(`Query error (attempt ${retries + 1}):`, err.message);
      retries++;
      if (retries >= maxRetries) throw err;
      await new Promise(r => setTimeout(r, 1000));
    }
  }
};

module.exports = { query, pool };
