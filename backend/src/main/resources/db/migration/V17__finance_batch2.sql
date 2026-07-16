-- ==============================================================
-- Flyway Migration: V17__finance_batch2.sql
-- Module: Financial Closing, Reconciliation & Tax configurations
-- Target: PostgreSQL 15
-- ==============================================================

CREATE TABLE IF NOT EXISTS closing_periods (
    id UUID PRIMARY KEY,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    period_name VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    period_year INTEGER NOT NULL,
    period_month INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL,
    closed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    closed_by UUID DEFAULT NULL,
    created_by UUID DEFAULT NULL,
    approved_by UUID DEFAULT NULL,
    approved_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    reopened_by UUID DEFAULT NULL,
    reopened_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    correlation_id VARCHAR(100) DEFAULT NULL,
    trace_id VARCHAR(100) DEFAULT NULL,
    node_id VARCHAR(100) DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS settlement_reconciliations (
    id UUID PRIMARY KEY,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    settlement_id UUID NOT NULL,
    payment_id UUID DEFAULT NULL,
    ledger_batch_id UUID DEFAULT NULL,
    gst_invoice_id UUID DEFAULT NULL,
    status VARCHAR(30) NOT NULL,
    notes TEXT DEFAULT NULL,
    reconciled_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    correlation_id VARCHAR(100) DEFAULT NULL,
    trace_id VARCHAR(100) DEFAULT NULL,
    node_id VARCHAR(100) DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS bank_reconciliations (
    id UUID PRIMARY KEY,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    payment_id UUID NOT NULL,
    bank_transaction_id VARCHAR(100) NOT NULL UNIQUE,
    expected_amount BIGINT NOT NULL,
    actual_amount BIGINT NOT NULL,
    status VARCHAR(30) NOT NULL,
    reconciled_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    notes TEXT DEFAULT NULL,
    correlation_id VARCHAR(100) DEFAULT NULL,
    trace_id VARCHAR(100) DEFAULT NULL,
    node_id VARCHAR(100) DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS tax_configurations (
    id UUID PRIMARY KEY,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    region_code VARCHAR(50) NOT NULL,
    tax_name VARCHAR(100) NOT NULL,
    rate NUMERIC(5, 2) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS tax_breakups (
    id UUID PRIMARY KEY,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    settlement_id UUID NOT NULL,
    tax_name VARCHAR(100) NOT NULL,
    tax_rate NUMERIC(5, 2) NOT NULL,
    taxable_basis BIGINT NOT NULL,
    calculated_tax BIGINT NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_closing_periods_year_month ON closing_periods(period_year, period_month);
CREATE INDEX IF NOT EXISTS idx_settlement_recon_settlement ON settlement_reconciliations(settlement_id);
CREATE INDEX IF NOT EXISTS idx_bank_recon_payment ON bank_reconciliations(payment_id);
CREATE INDEX IF NOT EXISTS idx_tax_config_region ON tax_configurations(region_code, tax_name);
CREATE INDEX IF NOT EXISTS idx_tax_config_is_active ON tax_configurations(is_active);
CREATE INDEX IF NOT EXISTS idx_tax_breakup_settlement ON tax_breakups(settlement_id);

-- Envers Auditing Tables
CREATE TABLE IF NOT EXISTS closing_periods_aud (
    id UUID NOT NULL,
    rev INTEGER NOT NULL,
    revtype SMALLINT,
    period_name VARCHAR(50),
    start_date DATE,
    end_date DATE,
    period_year INTEGER,
    period_month INTEGER,
    status VARCHAR(20),
    closed_at TIMESTAMP WITH TIME ZONE,
    closed_by UUID,
    created_by UUID,
    approved_by UUID,
    approved_at TIMESTAMP WITH TIME ZONE,
    reopened_by UUID,
    reopened_at TIMESTAMP WITH TIME ZONE,
    correlation_id VARCHAR(100),
    trace_id VARCHAR(100),
    node_id VARCHAR(100),
    PRIMARY KEY (id, rev),
    CONSTRAINT fk_closing_periods_aud_revinfo FOREIGN KEY (rev) REFERENCES revinfo (rev)
);

CREATE TABLE IF NOT EXISTS settlement_reconciliations_aud (
    id UUID NOT NULL,
    rev INTEGER NOT NULL,
    revtype SMALLINT,
    settlement_id UUID,
    payment_id UUID,
    ledger_batch_id UUID,
    gst_invoice_id UUID,
    status VARCHAR(30),
    notes TEXT,
    reconciled_at TIMESTAMP WITH TIME ZONE,
    correlation_id VARCHAR(100),
    trace_id VARCHAR(100),
    node_id VARCHAR(100),
    PRIMARY KEY (id, rev),
    CONSTRAINT fk_settlement_recon_aud_revinfo FOREIGN KEY (rev) REFERENCES revinfo (rev)
);

CREATE TABLE IF NOT EXISTS bank_reconciliations_aud (
    id UUID NOT NULL,
    rev INTEGER NOT NULL,
    revtype SMALLINT,
    payment_id UUID,
    bank_transaction_id VARCHAR(100),
    expected_amount BIGINT,
    actual_amount BIGINT,
    status VARCHAR(30),
    reconciled_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    correlation_id VARCHAR(100),
    trace_id VARCHAR(100),
    node_id VARCHAR(100),
    PRIMARY KEY (id, rev),
    CONSTRAINT fk_bank_recon_aud_revinfo FOREIGN KEY (rev) REFERENCES revinfo (rev)
);

CREATE TABLE IF NOT EXISTS tax_configurations_aud (
    id UUID NOT NULL,
    rev INTEGER NOT NULL,
    revtype SMALLINT,
    region_code VARCHAR(50),
    tax_name VARCHAR(100),
    rate NUMERIC(5, 2),
    is_active BOOLEAN,
    PRIMARY KEY (id, rev),
    CONSTRAINT fk_tax_configurations_aud_revinfo FOREIGN KEY (rev) REFERENCES revinfo (rev)
);

CREATE TABLE IF NOT EXISTS tax_breakups_aud (
    id UUID NOT NULL,
    rev INTEGER NOT NULL,
    revtype SMALLINT,
    settlement_id UUID,
    tax_name VARCHAR(100),
    tax_rate NUMERIC(5, 2),
    taxable_basis BIGINT,
    calculated_tax BIGINT,
    PRIMARY KEY (id, rev),
    CONSTRAINT fk_tax_breakups_aud_revinfo FOREIGN KEY (rev) REFERENCES revinfo (rev)
);

CREATE INDEX IF NOT EXISTS idx_closing_periods_aud_rev ON closing_periods_aud (rev);
CREATE INDEX IF NOT EXISTS idx_settlement_recon_aud_rev ON settlement_reconciliations_aud (rev);
CREATE INDEX IF NOT EXISTS idx_bank_recon_aud_rev ON bank_reconciliations_aud (rev);
CREATE INDEX IF NOT EXISTS idx_tax_configurations_aud_rev ON tax_configurations_aud (rev);
CREATE INDEX IF NOT EXISTS idx_tax_breakups_aud_rev ON tax_breakups_aud (rev);
