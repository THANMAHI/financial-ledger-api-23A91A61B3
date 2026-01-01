const ledgerService = require('./service');

const deposit = async (req, res) => {
    try {
        if (!req.body || !req.body.account_id) {
            return res.status(400).json({ error: "Missing account_id in request body" });
        }
        const { account_id, amount, description } = req.body;
        const result = await ledgerService.executeDeposit(account_id, amount, description);
        res.status(201).json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const transfer = async (req, res) => {
    try {
        const { from_account_id, to_account_id, amount, description } = req.body;
        const result = await ledgerService.executeTransfer(from_account_id, to_account_id, amount, description);
        res.status(200).json(result);
    } catch (err) {
        if (err.message === 'Insufficient funds') {
            res.status(422).json({ error: err.message });
        } else {
            res.status(500).json({ error: err.message });
        }
    }
};

const withdraw = async (req, res) => {
    try {
        const { account_id, amount, description } = req.body;
        // Re-uses the transfer logic (debit only) but without a receiver
        const result = await ledgerService.executeWithdrawal(account_id, amount, description);
        res.status(201).json(result);
    } catch (err) {
        if (err.message === 'Insufficient funds') {
            res.status(422).json({ error: err.message });
        } else {
            res.status(500).json({ error: err.message });
        }
    }
};

module.exports = { transfer, deposit, withdraw };