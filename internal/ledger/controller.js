const ledgerService = require('./service');
const logger = require('../db/logger');

/**
 * Handles account deposits.
 * Addresses requirement for positive numeric validation.
 */
const deposit = async (req, res) => {
    try {
        const { account_id, amount, description } = req.body;

        // CRITICAL VALIDATION: Ensure presence, type, and positive value
        if (!account_id || typeof amount !== 'number' || amount <= 0) {
            logger.warn('Invalid deposit attempt', { body: req.body });
            return res.status(400).json({ 
                error: "Valid account_id and positive numeric amount are required" 
            });
        }

        const result = await ledgerService.executeDeposit(account_id, amount, description);
        res.status(201).json(result);
    } catch (err) {
        logger.error('Deposit controller error', { error: err.message });
        res.status(500).json({ error: err.message });
    }
};

/**
 * Handles transfers between accounts.
 * Includes ACID rollback handling and 422 status for insufficient funds.
 */
const transfer = async (req, res) => {
    try {
        const { from_account_id, to_account_id, amount, description } = req.body;

        // CRITICAL VALIDATION: Ensure all IDs present and amount is valid
        if (!from_account_id || !to_account_id || typeof amount !== 'number' || amount <= 0) {
            logger.warn('Invalid transfer attempt', { body: req.body });
            return res.status(400).json({ 
                error: "Valid account IDs and positive numeric amount are required" 
            });
        }

        const result = await ledgerService.executeTransfer(from_account_id, to_account_id, amount, description);
        res.status(200).json(result);
    } catch (err) {
        if (err.message === 'Insufficient funds') {
            // Requirement: Return 422 for business rule violations
            res.status(422).json({ error: err.message });
        } else {
            logger.error('Transfer controller error', { error: err.message });
            res.status(500).json({ error: err.message });
        }
    }
};

/**
 * Handles account withdrawals.
 * Ensures balance integrity and negative balance prevention.
 */
const withdraw = async (req, res) => {
    try {
        const { account_id, amount, description } = req.body;

        // CRITICAL VALIDATION
        if (!account_id || typeof amount !== 'number' || amount <= 0) {
            logger.warn('Invalid withdrawal attempt', { body: req.body });
            return res.status(400).json({ 
                error: "Valid account_id and positive numeric amount are required" 
            });
        }

        const result = await ledgerService.executeWithdrawal(account_id, amount, description);
        res.status(201).json(result);
    } catch (err) {
        if (err.message === 'Insufficient funds') {
            res.status(422).json({ error: err.message });
        } else {
            logger.error('Withdrawal controller error', { error: err.message });
            res.status(500).json({ error: err.message });
        }
    }
};

module.exports = { transfer, deposit, withdraw };