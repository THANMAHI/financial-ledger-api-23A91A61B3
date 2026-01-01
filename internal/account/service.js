const pool = require('../db');
const logger = require('../db/logger');

const createAccount = async (id, userName, type, currency) => {
    try {
        const query = 'INSERT INTO accounts (id, user_name, account_type, currency) VALUES ($1, $2, $3, $4) RETURNING *';
        const values = [id, userName, type, currency];
        const res = await pool.query(query, values);
        return res.rows[0];
    } catch (err) {
        logger.error('Account creation failed', { message: err.message, userName });
        throw err;
    }
};

const getAccountWithBalance = async (id) => {
    // 1. Get account identity
    const accountRes = await pool.query('SELECT * FROM accounts WHERE id = $1', [id]);
    if (accountRes.rows.length === 0) return null;

    // 2. Calculate balance on-demand (SUM of all ledger entries)
    // This ensures balance is a verifiable source of truth from history
    const balanceRes = await pool.query(
      'SELECT COALESCE(SUM(amount), 0) as balance FROM ledger_entries WHERE account_id = $1',
      [id]
    );

    const account = accountRes.rows[0];
    account.balance = Number(balanceRes.rows[0].balance);
    return account;
};

const getLedger = async (accountId) => {
    const query = 'SELECT * FROM ledger_entries WHERE account_id = $1 ORDER BY created_at DESC';
    const res = await pool.query(query, [accountId]);
    return res.rows;
};

module.exports = { createAccount, getAccountWithBalance, getLedger };