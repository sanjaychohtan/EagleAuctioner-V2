-- ==============================================================
-- Flyway Migration: V7__contract_engine.sql
-- Module: Contract Engine Core (Phase 6 - Part 1)
-- Target: PostgreSQL 15
-- ==============================================================

-- 1. Table: sale_confirmations (lightweight stub for relation compatibility)
CREATE TABLE IF NOT EXISTS sale_confirmations (
    id UUID PRIMARY KEY,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    confirmation_number VARCHAR(100) NULL
);

-- 2. Table: contracts
CREATE TABLE IF NOT EXISTS contracts (
    id UUID PRIMARY KEY,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    document_number VARCHAR(100) NOT NULL UNIQUE,
    winner_id UUID NOT NULL,
    sale_confirmation_id UUID NULL,
    status VARCHAR(50) NOT NULL,
    total_amount NUMERIC(18, 2) NOT NULL,
    terms_and_conditions VARCHAR(2000) NULL,
    CONSTRAINT fk_contracts_winner FOREIGN KEY (winner_id) REFERENCES auction_winners(id) ON DELETE RESTRICT,
    CONSTRAINT fk_contracts_sale_confirmation FOREIGN KEY (sale_confirmation_id) REFERENCES sale_confirmations(id) ON DELETE SET NULL
);

-- 3. Table: contract_versions
CREATE TABLE IF NOT EXISTS contract_versions (
    id UUID PRIMARY KEY,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    contract_id UUID NOT NULL,
    version_number INTEGER NOT NULL,
    status VARCHAR(50) NOT NULL,
    total_amount NUMERIC(18, 2) NOT NULL,
    terms_and_conditions VARCHAR(2000) NULL,
    changed_by VARCHAR(255) NOT NULL,
    change_reason VARCHAR(1000) NULL,
    CONSTRAINT fk_contract_versions_contract FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE
);

-- 4. Indexes for optimized queries
CREATE INDEX idx_contracts_doc_num ON contracts(document_number) WHERE deleted_at IS NULL;
CREATE INDEX idx_contracts_status ON contracts(status) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_contracts_winner ON contracts(winner_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_contract_versions_contract ON contract_versions(contract_id) WHERE deleted_at IS NULL;

-- 5. Envers Auditing Tables (Total auditability)
CREATE TABLE IF NOT EXISTS contracts_aud (
    id UUID NOT NULL,
    rev INTEGER NOT NULL,
    revtype SMALLINT,
    document_number VARCHAR(100),
    winner_id UUID,
    sale_confirmation_id UUID,
    status VARCHAR(50),
    total_amount NUMERIC(18, 2),
    terms_and_conditions VARCHAR(2000),
    PRIMARY KEY (id, rev),
    CONSTRAINT fk_contracts_aud_revinfo FOREIGN KEY (rev) REFERENCES revinfo (rev)
);

CREATE TABLE IF NOT EXISTS contract_versions_aud (
    id UUID NOT NULL,
    rev INTEGER NOT NULL,
    revtype SMALLINT,
    contract_id UUID,
    version_number INTEGER,
    status VARCHAR(50),
    total_amount NUMERIC(18, 2),
    terms_and_conditions VARCHAR(2000),
    changed_by VARCHAR(255),
    change_reason VARCHAR(1000),
    PRIMARY KEY (id, rev),
    CONSTRAINT fk_contract_versions_aud_revinfo FOREIGN KEY (rev) REFERENCES revinfo (rev)
);

CREATE INDEX IF NOT EXISTS idx_contracts_aud_rev ON contracts_aud (rev);
CREATE INDEX IF NOT EXISTS idx_contract_versions_aud_rev ON contract_versions_aud (rev);
