-- ==============================================================
-- Flyway Migration: V13__document_engine.sql
-- Module: Commercial Document Engine
-- ==============================================================

-- 1. Table: financial_configurations
CREATE TABLE IF NOT EXISTS financial_configurations (
    config_key VARCHAR(100) PRIMARY KEY,
    config_value VARCHAR(255) NOT NULL,
    description VARCHAR(500),
    tolerance_value DECIMAL(19,2),
    effective_from TIMESTAMPTZ,
    effective_to TIMESTAMPTZ,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_financial_config_dates CHECK (effective_to IS NULL OR effective_from IS NULL OR effective_to >= effective_from)
);

-- Seed Dynamic Rules
INSERT INTO financial_configurations (config_key, config_value, tolerance_value, effective_from, effective_to, description) VALUES
('PLATFORM_FEE_PERCENTAGE', '5.00', NULL, NULL, NULL, 'Percentage fee charged by the platform for transaction facilitation'),
('VAT_PERCENTAGE', '18.00', NULL, NULL, NULL, 'Standard dynamic Value Added Tax rate applied to facilitation fees'),
('GST_PERCENTAGE', '18.00', NULL, NULL, NULL, 'Standard Goods & Services Tax rate applied to regional transactions'),
('TDS_PERCENTAGE', '1.00', NULL, NULL, NULL, 'Tax Deducted at Source regulatory retention percentage'),
('COMMISSION_PERCENTAGE', '2.50', NULL, NULL, NULL, 'Brokerage trade facilitation commission percentage'),
('PENALTY_AMOUNT', '100.00', NULL, NULL, NULL, 'Flat rate penalty charged for late settlement or document default'),
('ROUNDING_MODE', 'HALF_UP', NULL, NULL, NULL, 'Dynamic calculation rounding mode'),
('CURRENCY_PRECISION', '2', NULL, NULL, NULL, 'Standard currency decimal precision representation limit'),
('RECONCILIATION_TOLERANCE', '0.10', 0.10, '2020-01-01 00:00:00+00', '2099-12-31 23:59:59+00', 'Dynamic tolerance limit for reconciliation checks')
ON CONFLICT (config_key) DO NOTHING;

-- 2. Table: document_sequences
CREATE TABLE IF NOT EXISTS document_sequences (
    tenant_id VARCHAR(50) NOT NULL DEFAULT 'DEFAULT',
    branch_code VARCHAR(50) NOT NULL DEFAULT 'MAIN',
    year INTEGER NOT NULL DEFAULT 0,
    region_code VARCHAR(50) NOT NULL DEFAULT 'GLOBAL',
    document_type VARCHAR(50) NOT NULL,
    next_value BIGINT NOT NULL DEFAULT 1,
    version BIGINT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (tenant_id, branch_code, year, region_code, document_type)
);

-- Initialize Standard Default Sequences
INSERT INTO document_sequences (tenant_id, branch_code, year, region_code, document_type, next_value) VALUES 
('DEFAULT', 'MAIN', 2026, 'GLOBAL', 'SALE_CONFIRMATION', 1),
('DEFAULT', 'MAIN', 2026, 'GLOBAL', 'PURCHASE_ORDER', 1),
('DEFAULT', 'MAIN', 2026, 'GLOBAL', 'FEE_INVOICE', 1),
('DEFAULT', 'MAIN', 2026, 'GLOBAL', 'GST_INVOICE', 1)
ON CONFLICT (tenant_id, branch_code, year, region_code, document_type) DO NOTHING;

-- 3. Table: sale_confirmations
CREATE TABLE IF NOT EXISTS sale_confirmations (
    id UUID PRIMARY KEY,
    version BIGINT NOT NULL DEFAULT 0,
    document_number VARCHAR(100) NOT NULL,
    winner_id UUID NOT NULL,
    status VARCHAR(50) NOT NULL,
    sale_amount NUMERIC(18,2) NOT NULL,
    terms_and_conditions VARCHAR(2000),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    CONSTRAINT fk_sale_confirmations_winner FOREIGN KEY (winner_id) REFERENCES auction_winners (id),
    CONSTRAINT uq_sc_document_number UNIQUE (document_number)
);

CREATE INDEX IF NOT EXISTS idx_sc_document_number ON sale_confirmations (document_number);
CREATE INDEX IF NOT EXISTS idx_sale_confirmations_winner ON sale_confirmations (winner_id);

-- 4. Table: sale_confirmation_versions
CREATE TABLE IF NOT EXISTS sale_confirmation_versions (
    id UUID PRIMARY KEY,
    version BIGINT NOT NULL DEFAULT 0,
    sale_confirmation_id UUID NOT NULL,
    version_number INTEGER NOT NULL,
    status VARCHAR(50) NOT NULL,
    sale_amount NUMERIC(18,2) NOT NULL,
    terms_and_conditions VARCHAR(2000),
    changed_by VARCHAR(255) NOT NULL,
    change_reason VARCHAR(1000),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    CONSTRAINT fk_sc_versions_sc FOREIGN KEY (sale_confirmation_id) REFERENCES sale_confirmations (id) ON DELETE CASCADE
);

-- 5. Table: purchase_orders
CREATE TABLE IF NOT EXISTS purchase_orders (
    id UUID PRIMARY KEY,
    version BIGINT NOT NULL DEFAULT 0,
    document_number VARCHAR(100) NOT NULL,
    sale_confirmation_id UUID NOT NULL,
    status VARCHAR(50) NOT NULL,
    total_amount NUMERIC(18,2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    CONSTRAINT fk_purchase_orders_sc FOREIGN KEY (sale_confirmation_id) REFERENCES sale_confirmations (id),
    CONSTRAINT uq_po_document_number UNIQUE (document_number),
    CONSTRAINT uq_po_sc UNIQUE (sale_confirmation_id)
);

-- 6. Table: purchase_order_items
CREATE TABLE IF NOT EXISTS purchase_order_items (
    id UUID PRIMARY KEY,
    version BIGINT NOT NULL DEFAULT 0,
    purchase_order_id UUID NOT NULL,
    item_description VARCHAR(500) NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price NUMERIC(18,2) NOT NULL,
    line_total NUMERIC(18,2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    CONSTRAINT fk_po_items_po FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders (id) ON DELETE CASCADE
);

-- 7. Table: fee_invoices
CREATE TABLE IF NOT EXISTS fee_invoices (
    id UUID PRIMARY KEY,
    version BIGINT NOT NULL DEFAULT 0,
    document_number VARCHAR(100) NOT NULL,
    purchase_order_id UUID NOT NULL,
    status VARCHAR(50) NOT NULL,
    subtotal NUMERIC(18,2) NOT NULL,
    tax_amount NUMERIC(18,2) NOT NULL,
    total_amount NUMERIC(18,2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    CONSTRAINT fk_fee_invoices_po FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders (id),
    CONSTRAINT uq_fi_document_number UNIQUE (document_number),
    CONSTRAINT uq_fi_po UNIQUE (purchase_order_id)
);

-- 8. Table: fee_invoice_items
CREATE TABLE IF NOT EXISTS fee_invoice_items (
    id UUID PRIMARY KEY,
    version BIGINT NOT NULL DEFAULT 0,
    fee_invoice_id UUID NOT NULL,
    description VARCHAR(500) NOT NULL,
    amount NUMERIC(18,2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    CONSTRAINT fk_fee_invoice_items_invoice FOREIGN KEY (fee_invoice_id) REFERENCES fee_invoices (id) ON DELETE CASCADE
);

-- 9. Table: gst_invoices
CREATE TABLE IF NOT EXISTS gst_invoices (
    id UUID PRIMARY KEY,
    version BIGINT NOT NULL DEFAULT 0,
    invoice_number VARCHAR(100) NOT NULL,
    settlement_id UUID NOT NULL,
    seller_id UUID NOT NULL,
    buyer_id UUID NOT NULL,
    subtotal NUMERIC(18,2) NOT NULL,
    total_tax NUMERIC(18,2) NOT NULL,
    total_amount NUMERIC(18,2) NOT NULL,
    status VARCHAR(50) NOT NULL,
    pdf_url VARCHAR(2000),
    generated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    tax_version VARCHAR(50) NOT NULL,
    effective_from TIMESTAMPTZ NOT NULL,
    effective_to TIMESTAMPTZ NOT NULL,
    tax_configuration_id UUID NOT NULL,
    correlation_id VARCHAR(100),
    trace_id VARCHAR(100),
    node_id VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    CONSTRAINT fk_gst_invoices_settlement FOREIGN KEY (settlement_id) REFERENCES settlements (id),
    CONSTRAINT uq_gst_invoice_number UNIQUE (invoice_number),
    CONSTRAINT uq_gst_settlement UNIQUE (settlement_id)
);

-- 10. Table: gst_invoice_items
CREATE TABLE IF NOT EXISTS gst_invoice_items (
    id UUID PRIMARY KEY,
    version BIGINT NOT NULL DEFAULT 0,
    gst_invoice_id UUID NOT NULL,
    description VARCHAR(500) NOT NULL,
    hsn_sac_code VARCHAR(20),
    amount NUMERIC(18,2) NOT NULL,
    tax_rate NUMERIC(18,2) NOT NULL,
    tax_amount NUMERIC(18,2) NOT NULL,
    total_amount NUMERIC(18,2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    CONSTRAINT fk_gst_invoice_items_invoice FOREIGN KEY (gst_invoice_id) REFERENCES gst_invoices (id) ON DELETE CASCADE
);

-- 11. Update Settlements Table
ALTER TABLE settlements ADD COLUMN IF NOT EXISTS platform_fee NUMERIC(18,2) DEFAULT 0;
ALTER TABLE settlements ADD COLUMN IF NOT EXISTS tax_amount NUMERIC(18,2) DEFAULT 0;
ALTER TABLE settlements ADD COLUMN IF NOT EXISTS payout_amount NUMERIC(18,2) DEFAULT 0;

-- 12. Table: document_templates
CREATE TABLE IF NOT EXISTS document_templates (
    id UUID PRIMARY KEY,
    version BIGINT NOT NULL DEFAULT 0,
    name VARCHAR(100) NOT NULL,
    document_type VARCHAR(50) NOT NULL,
    template_version INTEGER NOT NULL DEFAULT 1,
    content TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    description VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_doc_template_type ON document_templates (document_type);
