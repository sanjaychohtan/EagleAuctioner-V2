-- ==============================================================
-- Flyway Migration: V11__ledger_engine.sql
-- Module: Ledger & Finance Engine
-- Target: PostgreSQL 15
-- ==============================================================

CREATE TABLE IF NOT EXISTS wallets (
    id UUID PRIMARY KEY,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    user_id UUID NOT NULL UNIQUE,
    available_balance NUMERIC(18, 2) NOT NULL DEFAULT 0,
    locked_balance NUMERIC(18, 2) NOT NULL DEFAULT 0,
    currency VARCHAR(10) NOT NULL,
    last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    permanent_emd NUMERIC(18, 2) DEFAULT 0,
    refund_pending NUMERIC(18, 2) DEFAULT 0,
    settlement_pending NUMERIC(18, 2) DEFAULT 0
);

CREATE TABLE IF NOT EXISTS ledger_transactions (
    id UUID PRIMARY KEY,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    transaction_reference VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(500) NOT NULL,
    status VARCHAR(50) NOT NULL,
    settlement_id UUID NULL,
    payment_id UUID NULL,
    posted_at TIMESTAMP WITH TIME ZONE NOT NULL,
    posted_by VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS ledger_entries (
    id UUID PRIMARY KEY,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    ledger_transaction_id UUID NOT NULL,
    account_type VARCHAR(100) NOT NULL,
    entry_type VARCHAR(20) NOT NULL,
    amount NUMERIC(18, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    CONSTRAINT fk_ledger_entries_tx FOREIGN KEY (ledger_transaction_id) REFERENCES ledger_transactions(id) ON DELETE CASCADE,
    CONSTRAINT chk_ledger_amount CHECK (amount > 0)
);

CREATE INDEX IF NOT EXISTS idx_wallets_user ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_ledger_tx_ref ON ledger_transactions(transaction_reference);
CREATE INDEX IF NOT EXISTS idx_ledger_tx_settlement ON ledger_transactions(settlement_id);
CREATE INDEX IF NOT EXISTS idx_ledger_tx_payment ON ledger_transactions(payment_id);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_tx ON ledger_entries(ledger_transaction_id);

-- Envers Auditing Tables
CREATE TABLE IF NOT EXISTS wallets_aud (
    id UUID NOT NULL,
    rev INTEGER NOT NULL,
    revtype SMALLINT,
    user_id UUID,
    available_balance NUMERIC(18, 2),
    locked_balance NUMERIC(18, 2),
    currency VARCHAR(10),
    last_updated TIMESTAMP WITH TIME ZONE,
    permanent_emd NUMERIC(18, 2),
    refund_pending NUMERIC(18, 2),
    settlement_pending NUMERIC(18, 2),
    PRIMARY KEY (id, rev),
    CONSTRAINT fk_wallets_aud_revinfo FOREIGN KEY (rev) REFERENCES revinfo (rev)
);

CREATE TABLE IF NOT EXISTS ledger_transactions_aud (
    id UUID NOT NULL,
    rev INTEGER NOT NULL,
    revtype SMALLINT,
    transaction_reference VARCHAR(100),
    description VARCHAR(500),
    status VARCHAR(50),
    settlement_id UUID,
    payment_id UUID,
    posted_at TIMESTAMP WITH TIME ZONE,
    posted_by VARCHAR(100),
    PRIMARY KEY (id, rev),
    CONSTRAINT fk_ledger_tx_aud_revinfo FOREIGN KEY (rev) REFERENCES revinfo (rev)
);

CREATE TABLE IF NOT EXISTS ledger_entries_aud (
    id UUID NOT NULL,
    rev INTEGER NOT NULL,
    revtype SMALLINT,
    ledger_transaction_id UUID,
    account_type VARCHAR(100),
    entry_type VARCHAR(20),
    amount NUMERIC(18, 2),
    currency VARCHAR(10),
    PRIMARY KEY (id, rev),
    CONSTRAINT fk_ledger_entries_aud_revinfo FOREIGN KEY (rev) REFERENCES revinfo (rev)
);

CREATE INDEX IF NOT EXISTS idx_wallets_aud_rev ON wallets_aud (rev);
CREATE INDEX IF NOT EXISTS idx_ledger_tx_aud_rev ON ledger_transactions_aud (rev);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_aud_rev ON ledger_entries_aud (rev);
