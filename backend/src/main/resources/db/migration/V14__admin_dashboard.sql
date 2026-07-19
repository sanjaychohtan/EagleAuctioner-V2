-- ==========================================
-- V14__admin_dashboard.sql
-- Admin, Dashboard & Reporting Schema
-- ==========================================

-- Feature Flags table
CREATE TABLE IF NOT EXISTS feature_flags (
    id UUID PRIMARY KEY,
    flag_key VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(500),
    is_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    version BIGINT DEFAULT 0
);

-- Support Tickets table
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'OPEN',
    priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    assigned_to UUID,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    version BIGINT DEFAULT 0
);

-- Disputes table
CREATE TABLE IF NOT EXISTS disputes (
    id UUID PRIMARY KEY,
    settlement_id UUID NOT NULL,
    contract_id UUID,
    disputed_amount DECIMAL(19, 2),
    status VARCHAR(30) NOT NULL DEFAULT 'OPEN',
    reason TEXT NOT NULL,
    resolution_notes TEXT,
    resolved_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    version BIGINT DEFAULT 0
);

-- Report Schedules table
CREATE TABLE IF NOT EXISTS report_schedules (
    id UUID PRIMARY KEY,
    report_type VARCHAR(50) NOT NULL,
    report_format VARCHAR(20) NOT NULL,
    cron_expression VARCHAR(100) NOT NULL,
    recipient_email VARCHAR(255) NOT NULL,
    filters_json TEXT,
    tenant_id UUID,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    version BIGINT DEFAULT 0
);

-- specialized reporting views
CREATE OR REPLACE VIEW vw_revenue_gst_ledger_reconciliation AS
SELECT 
    cl.id AS contract_id,
    cl.document_number AS contract_number,
    b.id AS bidder_profile_id,
    u.id AS user_id,
    u.email AS user_email,
    l.id AS ledger_entry_id,
    l.account_type,
    l.entry_type,
    l.amount,
    g.id AS gst_invoice_id,
    g.total_tax,
    cl.created_at AS transaction_time
FROM contracts cl
LEFT JOIN auction_winners aw ON cl.winner_id = aw.id
LEFT JOIN bidder_profiles b ON aw.bidder_id = b.id
LEFT JOIN users u ON b.user_id = u.id
LEFT JOIN settlements s ON s.contract_id = cl.id
LEFT JOIN ledger_transactions lt ON lt.settlement_id = s.id
LEFT JOIN ledger_entries l ON l.ledger_transaction_id = lt.id
LEFT JOIN gst_invoices g ON g.settlement_id = s.id;

-- Materialized views for high-performance sub-second Analytics Dashboard KPIs
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_tenant_performance_kpis AS
SELECT
    COALESCE(u.id, '00000000-0000-0000-0000-000000000000'::uuid) AS tenant_id,
    COUNT(DISTINCT a.id) AS total_auctions,
    COUNT(DISTINCT CASE WHEN a.state IN ('ENDED', 'SETTLED') THEN a.id END) AS completed_auctions,
    COUNT(DISTINCT CASE WHEN a.state = 'LIVE' THEN a.id END) AS active_auctions,
    COALESCE(SUM(aw.winning_amount), 0) AS total_gmv,
    COUNT(DISTINCT b.id) AS total_bids
FROM users u
LEFT JOIN seller_profiles sp ON sp.user_id = u.id
LEFT JOIN auctions a ON a.seller_profile_id = sp.id
LEFT JOIN auction_lots al ON al.auction_id = a.id
LEFT JOIN auction_winners aw ON aw.auction_lot_id = al.id
LEFT JOIN bids b ON b.auction_lot_id = al.id
GROUP BY u.id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_tenant_kpis_tenant ON mv_tenant_performance_kpis(tenant_id);

-- Composite Indexes for analytical performance optimization
CREATE INDEX IF NOT EXISTS idx_ledger_entries_recon_lookup ON ledger_entries (account_type, entry_type, amount);
CREATE INDEX IF NOT EXISTS idx_gst_invoice_recon_lookup ON gst_invoices (settlement_id, total_tax);
CREATE INDEX IF NOT EXISTS idx_contracts_winning_bidder ON contracts (winner_id, status);

-- Fast Refresh Function for Cron Scheduled execution
CREATE OR REPLACE FUNCTION refresh_performance_kpis_materialized_view()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_tenant_performance_kpis;
END;
$$ LANGUAGE plpgsql;
