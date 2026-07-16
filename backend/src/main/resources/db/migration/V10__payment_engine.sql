-- ==============================================================
-- Flyway Migration: V10__payment_engine.sql
-- Module: Payment Engine
-- Target: PostgreSQL 15
-- ==============================================================

CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    payment_number VARCHAR(100) NOT NULL UNIQUE,
    settlement_id UUID NOT NULL,
    status VARCHAR(50) NOT NULL,
    total_amount NUMERIC(18, 2) NOT NULL,
    reference_number VARCHAR(255) NULL UNIQUE,
    payment_method VARCHAR(100) NULL,
    payment_date TIMESTAMP WITH TIME ZONE NULL,
    CONSTRAINT fk_payments_settlement FOREIGN KEY (settlement_id) REFERENCES settlements(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS payment_allocations (
    id UUID PRIMARY KEY,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    payment_id UUID NOT NULL,
    settlement_id UUID NOT NULL,
    allocated_amount NUMERIC(18, 2) NOT NULL,
    allocation_type VARCHAR(100) NOT NULL,
    allocated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_allocations_payment FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE,
    CONSTRAINT fk_allocations_settlement FOREIGN KEY (settlement_id) REFERENCES settlements(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID PRIMARY KEY,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    payment_id UUID NOT NULL,
    gateway_reference VARCHAR(255) NULL,
    amount NUMERIC(18, 2) NOT NULL,
    status VARCHAR(50) NOT NULL,
    error_message VARCHAR(1000) NULL,
    completed_at TIMESTAMP WITH TIME ZONE NULL,
    CONSTRAINT fk_transactions_payment FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS payment_advices (
    id UUID PRIMARY KEY,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    advice_number VARCHAR(100) NOT NULL UNIQUE,
    settlement_id UUID NOT NULL UNIQUE,
    amount_due NUMERIC(18, 2) NOT NULL,
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(50) NOT NULL,
    CONSTRAINT fk_advices_settlement FOREIGN KEY (settlement_id) REFERENCES settlements(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_payments_num ON payments(payment_number);
CREATE INDEX IF NOT EXISTS idx_payments_reference_number ON payments(reference_number);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_settlement ON payments(settlement_id);
CREATE INDEX IF NOT EXISTS idx_pay_tx_reference ON payment_transactions(gateway_reference);
CREATE INDEX IF NOT EXISTS idx_advice_number ON payment_advices(advice_number);

CREATE INDEX IF NOT EXISTS idx_payment_allocations_payment ON payment_allocations(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_allocations_settlement ON payment_allocations(settlement_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_payment ON payment_transactions(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_advices_settlement ON payment_advices(settlement_id);

CREATE TABLE IF NOT EXISTS payments_aud (
    id UUID NOT NULL,
    rev INTEGER NOT NULL,
    revtype SMALLINT,
    payment_number VARCHAR(100),
    settlement_id UUID,
    status VARCHAR(50),
    total_amount NUMERIC(18, 2),
    reference_number VARCHAR(255),
    payment_method VARCHAR(100),
    payment_date TIMESTAMP WITH TIME ZONE,
    PRIMARY KEY (id, rev),
    CONSTRAINT fk_payments_aud_revinfo FOREIGN KEY (rev) REFERENCES revinfo (rev)
);

CREATE TABLE IF NOT EXISTS payment_allocations_aud (
    id UUID NOT NULL,
    rev INTEGER NOT NULL,
    revtype SMALLINT,
    payment_id UUID,
    settlement_id UUID,
    allocated_amount NUMERIC(18, 2),
    allocation_type VARCHAR(100),
    allocated_at TIMESTAMP WITH TIME ZONE,
    PRIMARY KEY (id, rev),
    CONSTRAINT fk_payment_alloc_aud_revinfo FOREIGN KEY (rev) REFERENCES revinfo (rev)
);

CREATE TABLE IF NOT EXISTS payment_transactions_aud (
    id UUID NOT NULL,
    rev INTEGER NOT NULL,
    revtype SMALLINT,
    payment_id UUID,
    gateway_reference VARCHAR(255),
    amount NUMERIC(18, 2),
    status VARCHAR(50),
    error_message VARCHAR(1000),
    completed_at TIMESTAMP WITH TIME ZONE,
    PRIMARY KEY (id, rev),
    CONSTRAINT fk_payment_tx_aud_revinfo FOREIGN KEY (rev) REFERENCES revinfo (rev)
);

CREATE TABLE IF NOT EXISTS payment_advices_aud (
    id UUID NOT NULL,
    rev INTEGER NOT NULL,
    revtype SMALLINT,
    advice_number VARCHAR(100),
    settlement_id UUID,
    amount_due NUMERIC(18, 2),
    due_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50),
    PRIMARY KEY (id, rev),
    CONSTRAINT fk_payment_adv_aud_revinfo FOREIGN KEY (rev) REFERENCES revinfo (rev)
);
