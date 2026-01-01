const { Pool } = require('pg');

const pool = new Pool({
  // Use process.env to pull values from Docker or your .env file
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'db', 
  database: process.env.DB_NAME || 'financial_ledger',
  password: process.env.DB_PASSWORD || 'password', // Default only for local dev
  port: process.env.DB_PORT || 5432,
});

module.exports = pool;