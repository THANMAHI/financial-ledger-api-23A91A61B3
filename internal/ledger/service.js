const pool = require('../db');
const { randomUUID } = require('crypto');
const logger = require('../db/logger');

const executeTransfer = async (fromAccountId, toAccountId, amount, description) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. PESSIMISTIC LOCKING: Lock the account row to prevent race conditions
        await client.query('SELECT id FROM accounts WHERE id = $1 FOR UPDATE', [fromAccountId]);

        // 2. CALCULATE BALANCE: On-demand sum from immutable ledger
        const balanceRes = await client.query(
            'SELECT COALESCE(SUM(amount), 0) as balance FROM ledger_entries WHERE account_id = $1',
            [fromAccountId]
        );
        
        // Convert to Number safely; for true precision, use a BigInt or Decimal library
        const currentBalance = Number(balanceRes.rows[0].balance);

        if (currentBalance < amount) {
            throw new Error('Insufficient funds');
        }

        const transactionId = randomUUID();

        // 3. TRANSACTION HEADER
        await client.query('INSERT INTO transactions (id, type, description) VALUES ($1, $2, $3)', 
            [transactionId, 'transfer', description]);

        // 4. DOUBLE-ENTRY: Exactly one debit and one credit
        await client.query('INSERT INTO ledger_entries (id, account_id, transaction_id, amount, entry_type) VALUES ($1, $2, $3, $4, $5)', 
            [randomUUID(), fromAccountId, transactionId, -amount, 'debit']);
        
        await client.query('INSERT INTO ledger_entries (id, account_id, transaction_id, amount, entry_type) VALUES ($1, $2, $3, $4, $5)', 
            [randomUUID(), toAccountId, transactionId, amount, 'credit']);

        await client.query('COMMIT');
        logger.info('Transfer successful', { transactionId, fromAccountId, toAccountId, amount });
        return { transactionId, status: 'completed' };
    } catch (err) {
        await client.query('ROLLBACK');
        logger.error('Transfer failed', { message: err.message, fromAccountId, amount });
        throw err;
    } finally {
        client.release();
    }
};

const executeDeposit = async (accountId, amount, description) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const transactionId = randomUUID();
        
        await client.query('INSERT INTO transactions (id, type, description) VALUES ($1, $2, $3)', 
            [transactionId, 'deposit', description]);
            
        await client.query('INSERT INTO ledger_entries (id, account_id, transaction_id, amount, entry_type) VALUES ($1, $2, $3, $4, $5)', 
            [randomUUID(), accountId, transactionId, amount, 'credit']);
            
        await client.query('COMMIT');
        return { transactionId };
    } catch (err) {
        await client.query('ROLLBACK');
        logger.error('Deposit failed', { message: err.message, accountId });
        throw err;
    } finally { client.release(); }
};

const executeWithdrawal = async (accountId, amount, description) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        // Lock account row for updates
        await client.query('SELECT id FROM accounts WHERE id = $1 FOR UPDATE', [accountId]);
        
        const balanceRes = await client.query(
            'SELECT COALESCE(SUM(amount), 0) as balance FROM ledger_entries WHERE account_id = $1',
            [accountId]
        );
        const currentBalance = Number(balanceRes.rows[0].balance);

        if (currentBalance < amount) throw new Error('Insufficient funds');

        const transactionId = randomUUID();
        await client.query('INSERT INTO transactions (id, type, description) VALUES ($1, $2, $3)', 
            [transactionId, 'withdrawal', description]);
            
        await client.query('INSERT INTO ledger_entries (id, account_id, transaction_id, amount, entry_type) VALUES ($1, $2, $3, $4, $5)', 
            [randomUUID(), accountId, transactionId, -amount, 'debit']);

        await client.query('COMMIT');
        return { transactionId, status: 'completed' };
    } catch (err) {
        await client.query('ROLLBACK');
        logger.error('Withdrawal failed', { message: err.message, accountId });
        throw err;
    } finally { client.release(); }
};

module.exports = { executeTransfer, executeDeposit, executeWithdrawal };