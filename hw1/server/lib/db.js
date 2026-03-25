const { Pool } = require('pg');

let pool;

function getConnectionString() {
  return process.env.SUPABASE_DB_URL || process.env.DATABASE_URL || '';
}

function getDbPool() {
  const connectionString = getConnectionString();
  if (!connectionString) return null;

  if (!pool) {
    pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
    });
  }
  return pool;
}

module.exports = { getDbPool };
