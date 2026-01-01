const { Pool } = require('pg');

const pool = new Pool({
  user: 'user',
  host: 'db', // Important: 'db' refers to the name in docker-compose
  database: 'ledger_db',
  password: 'password',
  port: 5432,
});

module.exports = pool;