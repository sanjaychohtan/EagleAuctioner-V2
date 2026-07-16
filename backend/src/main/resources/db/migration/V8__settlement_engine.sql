-- ==============================================================
-- Flyway Migration: V8__settlement_engine.sql
-- Module: Settlement Engine Core (Phase 7 - Part 1)
-- Target: PostgreSQL 15
-- ==============================================================

-- 1. Table: settlements
CREATE TABLE IF NOT EXISTS settlements (
    id UUID PRIMARY KEY,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    contract_id UUID NOT NULL UNIQUE,
    status VARCHAR(50) NOT NULL,
    contract_number VARCHAR(100) NOT NULL,
    winner_id UUID NOT NULL,
    buyer_snapshot TEXT NOT NULL,
    seller_snapshot TEXT NOT NULL,
    auction_snapshot TEXT NOT NULL,
    lot_snapshot TEXT NOT NULL,
    winning_amount NUMERIC(18, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    tax_snapshot TEXT NOT NULL,
    generated_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_settlements_contract FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE RESTRICT
);

-- 2. Indexes for optimized queries
CREATE INDEX idx_settlements_status ON settlements(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_settlements_winner ON settlements(winner_id) WHERE deleted_at IS NULL;

-- 3. Envers Auditing Table
CREATE TABLE IF NOT EXISTS settlements_aud (
    id UUID NOT NULL,
    rev INTEGER NOT NULL,
    revtype SMALLINT,
    contract_id UUID,
    status VARCHAR(50),
    contract_number VARCHAR(100),
    winner_id UUID,
    buyer_snapshot TEXT,
    seller_snapshot TEXT,
    auction_snapshot TEXT,
    lot_snapshot TEXT,
    winning_amount NUMERIC(18, 2),
    currency VARCHAR(10),
    tax_snapshot TEXT,
    generated_timestamp TIMESTAMP WITH TIME ZONE,
    PRIMARY KEY (id, rev),
    CONSTRAINT fk_settlements_aud_revinfo FOREIGN KEY (rev) REFERENCES revinfo (rev)
);

CREATE INDEX IF NOT EXISTS idx_settlements_aud_rev ON settlements_aud (rev);
