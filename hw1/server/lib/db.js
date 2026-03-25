const { Pool } = require('pg');

let pool;

function getConnectionString() {
  return process.env.SUPABASE_POOLER_URL || process.env.SUPABASE_DB_URL || process.env.DATABASE_URL || '';
}

function getDbPool() {
  const connectionString = getConnectionString();
  if (!connectionString) return null;

  if (!pool) {
    pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      family: 4,
    });
  }
  return pool;
}

module.exports = { getDbPool };
