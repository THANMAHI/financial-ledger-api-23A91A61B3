const express = require('express');
const accountController = require('../../internal/account/controller');
const ledgerController = require('../../internal/ledger/controller');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Account Management
app.post('/accounts', accountController.createAccount);
app.get('/accounts/:id', accountController.getAccount);
app.get('/accounts/:id/ledger', accountController.getLedger); // This was the broken line

// Ledger Operations
app.post('/transfers', ledgerController.transfer);
app.post('/deposits', ledgerController.deposit);
app.post('/withdrawals', ledgerController.withdraw);

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Bank API running on port ${PORT}`);
});