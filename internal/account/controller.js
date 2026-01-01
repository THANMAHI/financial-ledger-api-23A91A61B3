const { randomUUID } = require('crypto');
const accountService = require('./service');

const createAccount = async (req, res) => {
    try {
        const { user_name, account_type, currency } = req.body;
        const id = randomUUID();
        const account = await accountService.createAccount(id, user_name, account_type, currency);
        res.status(201).json(account);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const getAccount = async (req, res) => {
    try {
        const account = await accountService.getAccountWithBalance(req.params.id);
        if (!account) return res.status(404).json({ error: "Account not found" });
        res.json(account);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const getLedger = async (req, res) => {
    try {
        const history = await accountService.getLedger(req.params.id);
        res.json(history);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { createAccount, getAccount, getLedger };