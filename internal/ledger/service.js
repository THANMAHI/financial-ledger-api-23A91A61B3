const pool = require('../db');
const { randomUUID } = require('crypto');

const executeTransfer = async (fromAccountId, toAccountId, amount, description) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. LOCK the account by selecting the account row itself, NOT the sum
        // This satisfies ACID by preventing concurrent changes to this account
        await client.query('SELECT id FROM accounts WHERE id = $1 FOR UPDATE', [fromAccountId]);

        // 2. Now calculate the balance safely
        const balanceRes = await client.query(
            'SELECT COALESCE(SUM(amount), 0) as balance FROM ledger_entries WHERE account_id = $1',
            [fromAccountId]
        );
        const currentBalance = parseFloat(balanceRes.rows[0].balance);

        if (currentBalance < amount) {
            throw new Error('Insufficient funds');
        }

        const transactionId = randomUUID();

        // 3. Record the transaction header
        await client.query('INSERT INTO transactions (id, type, description) VALUES ($1, $2, $3)', 
            [transactionId, 'transfer', description]);

        // 4. Double-Entry: Debit sender, Credit receiver
        await client.query('INSERT INTO ledger_entries (id, account_id, transaction_id, amount, entry_type) VALUES ($1, $2, $3, $4, $5)', 
            [randomUUID(), fromAccountId, transactionId, -amount, 'debit']);
        
        await client.query('INSERT INTO ledger_entries (id, account_id, transaction_id, amount, entry_type) VALUES ($1, $2, $3, $4, $5)', 
            [randomUUID(), toAccountId, transactionId, amount, 'credit']);

        await client.query('COMMIT');
        return { transactionId, status: 'completed' };
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

const executeDeposit = async (accountId, amount, description) => {
    const transactionId = randomUUID();
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query('INSERT INTO transactions (id, type, description) VALUES ($1, $2, $3)', [transactionId, 'deposit', description]);
        await client.query('INSERT INTO ledger_entries (id, account_id, transaction_id, amount, entry_type) VALUES ($1, $2, $3, $4, $5)', [randomUUID(), accountId, transactionId, amount, 'credit']);
        await client.query('COMMIT');
        return { transactionId };
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally { client.release(); }
};
const executeWithdrawal = async (accountId, amount, description) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const balanceRes = await client.query(
            'SELECT COALESCE(SUM(amount), 0) as balance FROM ledger_entries WHERE account_id = $1 FOR UPDATE',
            [accountId]
        );
        const currentBalance = parseFloat(balanceRes.rows[0].balance);

        if (currentBalance < amount) throw new Error('Insufficient funds');

        const transactionId = randomUUID();
        await client.query('INSERT INTO transactions (id, type, description) VALUES ($1, $2, $3)', [transactionId, 'withdrawal', description]);
        await client.query('INSERT INTO ledger_entries (id, account_id, transaction_id, amount, entry_type) VALUES ($1, $2, $3, $4, $5)', 
            [randomUUID(), accountId, transactionId, -amount, 'debit']);

        await client.query('COMMIT');
        return { transactionId, status: 'completed' };
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally { client.release(); }
};

module.exports = { executeTransfer, executeDeposit, executeWithdrawal };