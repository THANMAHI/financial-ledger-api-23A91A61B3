CREATE TABLE accounts (
    id UUID PRIMARY KEY,
    user_name TEXT NOT NULL,
    account_type TEXT NOT NULL,
    currency TEXT NOT NULL,
    status TEXT DEFAULT 'active'
);

CREATE TABLE transactions (
    id UUID PRIMARY KEY,
    type TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ledger_entries (
    id UUID PRIMARY KEY,
    account_id UUID REFERENCES accounts(id),
    transaction_id UUID REFERENCES transactions(id),
    amount DECIMAL(19, 4) NOT NULL,
    entry_type TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);