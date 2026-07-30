-- =============================================================================
-- EAGLE AUCTIONER BACKEND - COMPLETE CONSOLIDATED INITIAL SCHEMA BASELINE (V1)
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS auctions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    auction_number VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description VARCHAR(2000),
    seller_profile_id UUID NOT NULL,
    state VARCHAR(50) NOT NULL,
    auction_type VARCHAR(50) NOT NULL,
    visibility VARCHAR(50) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    timezone VARCHAR(100) NOT NULL,
    registration_start TIMESTAMPTZ NOT NULL,
    registration_end TIMESTAMPTZ NOT NULL,
    inspection_start TIMESTAMPTZ,
    inspection_end TIMESTAMPTZ,
    auction_start TIMESTAMPTZ NOT NULL,
    auction_end TIMESTAMPTZ NOT NULL,
    reserve_price_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    auto_extension_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    extension_minutes INT,
    extension_count INT,
    settings UUID,
    lots VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS auction_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    auction_id UUID,
    lot_id UUID,
    event_type VARCHAR(50) NOT NULL,
    payload TEXT,
    timestamp TIMESTAMPTZ NOT NULL,
    triggered_by VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS auction_lots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    auction_id UUID NOT NULL,
    lot_number VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description VARCHAR(2000),
    material_category VARCHAR(100) NOT NULL,
    quantity BIGINT NOT NULL,
    unit_of_measure VARCHAR(20) NOT NULL,
    starting_price BIGINT NOT NULL,
    reserve_price BIGINT,
    current_highest_bid BIGINT,
    minimum_increment BIGINT NOT NULL,
    currency VARCHAR(3) NOT NULL,
    lot_status VARCHAR(50) NOT NULL,
    winner_bidder_id UUID,
    display_order INT NOT NULL
);

CREATE TABLE IF NOT EXISTS auction_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    auction_lot_id UUID NOT NULL UNIQUE,
    status VARCHAR(50) NOT NULL,
    highest_bid_amount BIGINT,
    reserve_price BIGINT,
    reserve_met BOOLEAN NOT NULL DEFAULT FALSE,
    winner_id UUID
);

CREATE TABLE IF NOT EXISTS auction_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    auction_id UUID NOT NULL UNIQUE,
    anonymous_bidding BOOLEAN NOT NULL DEFAULT FALSE,
    allow_auto_extension BOOLEAN NOT NULL DEFAULT FALSE,
    extension_minutes INT,
    max_extensions INT,
    bid_increment_type VARCHAR(50),
    minimum_increment BIGINT,
    reserve_price_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    allow_proxy_bid BOOLEAN NOT NULL DEFAULT FALSE,
    allow_manual_winner BOOLEAN NOT NULL DEFAULT FALSE,
    allow_seller_approval BOOLEAN NOT NULL DEFAULT FALSE,
    allow_bid_withdrawal BOOLEAN NOT NULL DEFAULT FALSE,
    allow_rank_display BOOLEAN NOT NULL DEFAULT FALSE,
    show_bidder_names BOOLEAN NOT NULL DEFAULT FALSE,
    registration_required BOOLEAN NOT NULL DEFAULT FALSE,
    emd_required BOOLEAN NOT NULL DEFAULT FALSE,
    timezone VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS auction_state_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    auction_id UUID NOT NULL,
    from_state VARCHAR(50) NOT NULL,
    to_state VARCHAR(50) NOT NULL,
    reason VARCHAR(1000),
    changed_by VARCHAR(255),
    timestamp TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS auction_winners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    auction_lot_id UUID NOT NULL UNIQUE,
    bidder_id UUID NOT NULL,
    bid_id UUID,
    status VARCHAR(50) NOT NULL,
    selection_type VARCHAR(50) NOT NULL,
    winning_amount BIGINT NOT NULL,
    seller_decision_at TIMESTAMPTZ,
    notes VARCHAR(1000),
    winner_company_name VARCHAR(255),
    winner_display_name VARCHAR(255),
    winner_anonymous_code VARCHAR(100),
    winner_bid_amount_snapshot BIGINT,
    winner_bid_time_snapshot TIMESTAMPTZ,
    seller_company_snapshot VARCHAR(255),
    reserve_price_snapshot BIGINT,
    currency_snapshot VARCHAR(10),
    tax_profile_snapshot VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    action VARCHAR(255) NOT NULL,
    entity_type VARCHAR(255) NOT NULL,
    entity_id VARCHAR(255),
    old_value JSONB,
    new_value JSONB,
    ip_address VARCHAR(255),
    user_agent VARCHAR(255),
    created_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS bank_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    bidder_profile_id UUID NOT NULL,
    account_holder_name VARCHAR(150) NOT NULL,
    encrypted_account_number VARCHAR(255) NOT NULL,
    account_hash VARCHAR(64) NOT NULL,
    ifsc_code VARCHAR(11) NOT NULL,
    bank_name VARCHAR(150) NOT NULL,
    branch_name VARCHAR(150) NOT NULL,
    verification_status VARCHAR(50) NOT NULL,
    bank_account_type VARCHAR(50) NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    verified_at TIMESTAMPTZ,
    verification_provider VARCHAR(100),
    penny_drop_status VARCHAR(50),
    penny_drop_reference VARCHAR(100),
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    penny_drop_transaction_id VARCHAR(100),
    service VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS bank_reconciliations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    payment_id UUID NOT NULL,
    bank_transaction_id VARCHAR(100) NOT NULL,
    expected_amount BIGINT NOT NULL,
    actual_amount BIGINT NOT NULL,
    status VARCHAR(50) NOT NULL,
    reconciled_at TIMESTAMPTZ,
    notes TEXT,
    correlation_id VARCHAR(100),
    trace_id VARCHAR(100),
    node_id VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS bids (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    auction_lot_id UUID NOT NULL,
    bidder_id UUID NOT NULL,
    bid_amount BIGINT NOT NULL,
    bid_time TIMESTAMPTZ NOT NULL,
    bid_status VARCHAR(50) NOT NULL,
    anonymous_bidder_code VARCHAR(50),
    ip_address VARCHAR(45),
    user_agent VARCHAR(255),
    is_auto_bid BOOLEAN NOT NULL DEFAULT FALSE,
    auto_bid_limit BIGINT
);

CREATE TABLE IF NOT EXISTS auction_bidder_authorizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    auction_id UUID NOT NULL,
    bidder_id UUID NOT NULL,
    is_authorized BOOLEAN NOT NULL DEFAULT FALSE,
    authorization_reason VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS bidder_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    user_id UUID NOT NULL UNIQUE,
    state VARCHAR(50) NOT NULL,
    bidder_type VARCHAR(50) NOT NULL,
    encrypted_pan VARCHAR(255) NOT NULL,
    pan_hash VARCHAR(64) NOT NULL,
    pan_verification_status VARCHAR(50) NOT NULL,
    pan_verified_at TIMESTAMPTZ,
    masked_aadhaar VARCHAR(20),
    aadhaar_hash VARCHAR(64),
    aadhaar_verification_status VARCHAR(50) NOT NULL,
    aadhaar_verified_at TIMESTAMPTZ,
    organization UUID,
    bank_accounts VARCHAR(255),
    kyc_documents VARCHAR(255),
    kyc_reviews VARCHAR(255),
    rejection_reason TEXT,
    service VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS bidder_state_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    bidder_profile_id UUID NOT NULL,
    from_state VARCHAR(50) NOT NULL,
    to_state VARCHAR(50) NOT NULL,
    changed_by_user_id UUID NOT NULL,
    transition_reason TEXT,
    transitioned_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS bid_histories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    auction_lot_id UUID NOT NULL,
    old_highest_bid BIGINT,
    new_highest_bid BIGINT NOT NULL,
    winner_before_id UUID,
    winner_after_id UUID,
    timestamp TIMESTAMPTZ NOT NULL,
    event_type VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS bulk_import_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_hash VARCHAR(64) NOT NULL UNIQUE,
    status VARCHAR(50) NOT NULL,
    total_records INT,
    processed_records INT,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL,
    message_text VARCHAR(1000) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS closing_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    period_name VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    period_year INT NOT NULL,
    period_month INT NOT NULL,
    status VARCHAR(50) NOT NULL,
    closed_at TIMESTAMPTZ,
    closed_by UUID,
    created_by UUID,
    approved_by UUID,
    approved_at TIMESTAMPTZ,
    reopened_by UUID,
    reopened_at TIMESTAMPTZ,
    correlation_id VARCHAR(100),
    trace_id VARCHAR(100),
    node_id VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    document_number VARCHAR(100) NOT NULL UNIQUE,
    winner_id UUID NOT NULL,
    sale_confirmation_id UUID,
    status VARCHAR(50) NOT NULL,
    total_amount BIGINT NOT NULL,
    terms_and_conditions VARCHAR(2000),
    versions VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS contract_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    contract_id UUID NOT NULL,
    version_number INT NOT NULL,
    status VARCHAR(50) NOT NULL,
    total_amount BIGINT NOT NULL,
    terms_and_conditions VARCHAR(2000),
    changed_by VARCHAR(255) NOT NULL,
    change_reason VARCHAR(1000)
);

CREATE TABLE IF NOT EXISTS disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    settlement_id UUID NOT NULL,
    contract_id UUID,
    disputed_amount BIGINT,
    status VARCHAR(30) NOT NULL,
    reason TEXT NOT NULL,
    resolution_notes TEXT,
    resolved_by UUID
);

CREATE TABLE IF NOT EXISTS document_sequences (
    tenant_id VARCHAR(50),
    branch_code VARCHAR(50),
    year INT,
    region_code VARCHAR(50),
    document_type VARCHAR(50),
    next_value BIGINT NOT NULL,
    version BIGINT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ,
    PRIMARY KEY (tenant_id, branch_code, year, region_code, document_type)
);

CREATE TABLE IF NOT EXISTS document_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    name VARCHAR(100) NOT NULL,
    document_type VARCHAR(50) NOT NULL,
    template_version INT NOT NULL,
    content TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    description VARCHAR(500)
);

CREATE TABLE IF NOT EXISTS feature_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    flag_key VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(500),
    is_enabled BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS fee_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    document_number VARCHAR(100) NOT NULL UNIQUE,
    purchase_order_id UUID NOT NULL,
    status VARCHAR(50) NOT NULL,
    subtotal BIGINT NOT NULL,
    tax_amount BIGINT NOT NULL,
    total_amount BIGINT NOT NULL,
    items VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS fee_invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    fee_invoice_id UUID NOT NULL,
    description VARCHAR(500) NOT NULL,
    amount BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS financial_configurations (
    config_key VARCHAR(100) PRIMARY KEY,
    config_value VARCHAR(255) NOT NULL,
    description VARCHAR(500),
    tolerance_value BIGINT,
    effective_from TIMESTAMPTZ,
    effective_to TIMESTAMPTZ,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS gst_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    settlement_id UUID NOT NULL,
    seller_id UUID NOT NULL,
    buyer_id UUID NOT NULL,
    subtotal BIGINT NOT NULL,
    total_tax BIGINT NOT NULL,
    total_amount BIGINT NOT NULL,
    status VARCHAR(50) NOT NULL,
    pdf_url VARCHAR(500),
    generated_at TIMESTAMPTZ NOT NULL,
    tax_version VARCHAR(50) NOT NULL,
    effective_from TIMESTAMPTZ NOT NULL,
    effective_to TIMESTAMPTZ NOT NULL,
    tax_configuration_id UUID NOT NULL,
    items VARCHAR(255),
    correlation_id VARCHAR(100),
    trace_id VARCHAR(100),
    node_id VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS gst_invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    invoice_id UUID NOT NULL,
    description VARCHAR(255) NOT NULL,
    hsn_sac_code VARCHAR(20),
    amount BIGINT NOT NULL,
    tax_rate BIGINT NOT NULL,
    tax_amount BIGINT NOT NULL,
    total_amount BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS idempotency_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    idempotency_key VARCHAR(100) NOT NULL,
    request_hash VARCHAR(64) NOT NULL,
    response_status INT NOT NULL,
    response_body TEXT,
    response_headers TEXT,
    created_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS kyc_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    bidder_profile_id UUID NOT NULL,
    organization_id UUID,
    document_type VARCHAR(50) NOT NULL,
    storage_path VARCHAR(512) NOT NULL,
    document_hash VARCHAR(64) NOT NULL,
    verification_status VARCHAR(50) NOT NULL,
    rejection_reason TEXT,
    mime_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    verified_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS kyc_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    bidder_profile_id UUID NOT NULL,
    reviewer_user_id UUID NOT NULL,
    previous_state VARCHAR(50) NOT NULL,
    new_state VARCHAR(50) NOT NULL,
    decision VARCHAR(50) NOT NULL,
    review_notes TEXT NOT NULL,
    rejection_code VARCHAR(50),
    reviewer_ip VARCHAR(45),
    review_duration_ms BIGINT,
    reviewed_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS ledger_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    ledger_transaction_id UUID NOT NULL,
    account_type VARCHAR(255) NOT NULL,
    entry_type VARCHAR(255) NOT NULL,
    amount BIGINT NOT NULL,
    currency VARCHAR(10) NOT NULL
);

CREATE TABLE IF NOT EXISTS ledger_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    transaction_reference VARCHAR(255) NOT NULL UNIQUE,
    description VARCHAR(255) NOT NULL,
    status VARCHAR(255) NOT NULL,
    settlement_id UUID,
    payment_id UUID,
    posted_at TIMESTAMPTZ NOT NULL,
    posted_by VARCHAR(255) NOT NULL,
    entries VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    user_id UUID NOT NULL,
    channel VARCHAR(255) NOT NULL,
    priority VARCHAR(255) NOT NULL,
    status VARCHAR(255) NOT NULL,
    notification_type VARCHAR(255) NOT NULL,
    template_version INT,
    title VARCHAR(200),
    body TEXT NOT NULL,
    scheduled_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    archived_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS notification_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    notification_id UUID NOT NULL,
    channel VARCHAR(255) NOT NULL,
    status VARCHAR(255) NOT NULL,
    provider_name VARCHAR(100),
    tracking_id VARCHAR(255),
    error_code VARCHAR(100),
    error_message TEXT,
    retry_count INT NOT NULL,
    next_retry_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    user_id UUID NOT NULL,
    channel VARCHAR(255) NOT NULL,
    notification_type VARCHAR(255) NOT NULL,
    is_enabled BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    name VARCHAR(100) NOT NULL,
    template_version INT NOT NULL,
    effective_from TIMESTAMPTZ,
    effective_to TIMESTAMPTZ,
    notification_type VARCHAR(255) NOT NULL,
    channel VARCHAR(255) NOT NULL,
    subject_template VARCHAR(255),
    body_template TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    bidder_profile_id UUID NOT NULL UNIQUE,
    organization_name VARCHAR(255) NOT NULL,
    organization_type VARCHAR(50) NOT NULL,
    registration_number VARCHAR(100) NOT NULL,
    cin VARCHAR(21),
    gstin VARCHAR(15),
    gst_verification_status VARCHAR(50) NOT NULL,
    gst_verified_at TIMESTAMPTZ,
    registration_authority VARCHAR(150),
    registered_address TEXT NOT NULL,
    organization_documents VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS outbox_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aggregate_id UUID NOT NULL,
    aggregate_type VARCHAR(100) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    payload TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    processed BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(50) NOT NULL,
    retry_count INT NOT NULL,
    error_message TEXT,
    last_attempt_time TIMESTAMPTZ,
    next_retry_time TIMESTAMPTZ,
    last_failure_reason TEXT,
    exception_class VARCHAR(255),
    stack_trace_summary TEXT,
    processing_node VARCHAR(255),
    dead_letter_timestamp TIMESTAMPTZ,
    processed_at TIMESTAMPTZ,
    event_version VARCHAR(50) NOT NULL,
    schema_version VARCHAR(50) NOT NULL,
    aggregate_version BIGINT NOT NULL,
    correlation_id VARCHAR(100),
    trace_id VARCHAR(100),
    node_id VARCHAR(100),
    version BIGINT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    payment_number VARCHAR(100) NOT NULL UNIQUE,
    settlement_id UUID NOT NULL,
    status VARCHAR(50) NOT NULL,
    total_amount BIGINT NOT NULL,
    reference_number VARCHAR(255) UNIQUE,
    payment_method VARCHAR(100),
    payment_date TIMESTAMPTZ,
    allocations VARCHAR(255),
    transactions VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS payment_advices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    advice_number VARCHAR(100) NOT NULL UNIQUE,
    settlement_id UUID NOT NULL,
    amount_due BIGINT NOT NULL,
    due_date TIMESTAMPTZ NOT NULL,
    status VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS payment_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    payment_id UUID NOT NULL,
    settlement_id UUID NOT NULL,
    allocated_amount BIGINT NOT NULL,
    allocation_type VARCHAR(100) NOT NULL,
    allocated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    payment_id UUID NOT NULL,
    gateway_reference VARCHAR(255),
    amount BIGINT NOT NULL,
    status VARCHAR(50) NOT NULL,
    error_message VARCHAR(1000),
    completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    module VARCHAR(50) NOT NULL,
    description TEXT,
    version BIGINT DEFAULT 0,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    document_number VARCHAR(100) NOT NULL UNIQUE,
    sale_confirmation_id UUID NOT NULL,
    status VARCHAR(50) NOT NULL,
    total_amount BIGINT NOT NULL,
    items VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS purchase_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    purchase_order_id UUID NOT NULL,
    item_description VARCHAR(500) NOT NULL,
    quantity INT NOT NULL,
    unit_price BIGINT NOT NULL,
    line_total BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    user_id UUID NOT NULL,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    token_family_id VARCHAR(255) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    replaced_by_token_hash VARCHAR(255),
    ip_address VARCHAR(45),
    user_agent TEXT
);

CREATE TABLE IF NOT EXISTS refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    amount BIGINT NOT NULL,
    initiator_id UUID NOT NULL,
    first_approver_id UUID,
    second_approver_id UUID,
    status VARCHAR(50) NOT NULL,
    rejection_reason VARCHAR(255),
    audit_log TEXT,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS report_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    report_type VARCHAR(255) NOT NULL,
    report_format VARCHAR(255) NOT NULL,
    cron_expression VARCHAR(255) NOT NULL,
    recipient_email VARCHAR(255) NOT NULL,
    filters_json TEXT,
    tenant_id UUID,
    is_active BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL,
    description VARCHAR(255),
    system_role BOOLEAN NOT NULL DEFAULT FALSE,
    permissions VARCHAR(255),
    version BIGINT DEFAULT 0,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS sale_confirmations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    document_number VARCHAR(100) NOT NULL UNIQUE,
    winner_id UUID NOT NULL,
    status VARCHAR(50) NOT NULL,
    sale_amount BIGINT NOT NULL,
    terms_and_conditions VARCHAR(2000),
    versions VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS sale_confirmation_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    sale_confirmation_id UUID NOT NULL,
    version_number INT NOT NULL,
    status VARCHAR(50) NOT NULL,
    sale_amount BIGINT NOT NULL,
    terms_and_conditions VARCHAR(2000),
    changed_by VARCHAR(255) NOT NULL,
    change_reason VARCHAR(1000)
);

CREATE TABLE IF NOT EXISTS seller_companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    seller_profile_id UUID NOT NULL UNIQUE,
    company_name VARCHAR(255) NOT NULL,
    registration_number VARCHAR(100) NOT NULL,
    gstin VARCHAR(15),
    gst_verification_status VARCHAR(50) NOT NULL,
    gst_verified_at TIMESTAMPTZ,
    registered_address TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS seller_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    seller_profile_id UUID NOT NULL,
    document_type VARCHAR(50) NOT NULL,
    storage_path VARCHAR(512) NOT NULL,
    document_hash VARCHAR(64) NOT NULL,
    verification_status VARCHAR(50) NOT NULL,
    rejection_reason TEXT,
    mime_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    verified_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS seller_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    user_id UUID NOT NULL UNIQUE,
    state VARCHAR(50) NOT NULL,
    seller_type VARCHAR(50) NOT NULL,
    encrypted_pan VARCHAR(255),
    pan_hash VARCHAR(64),
    pan_verification_status VARCHAR(50) NOT NULL,
    pan_verified_at TIMESTAMPTZ,
    company UUID,
    warehouses VARCHAR(255),
    documents VARCHAR(255),
    reviews VARCHAR(255),
    state_histories VARCHAR(255),
    rejection_reason TEXT,
    suspension_reason TEXT,
    blacklist_reason TEXT,
    onboarded_at TIMESTAMPTZ,
    service VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS seller_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    seller_profile_id UUID NOT NULL,
    reviewer_user_id UUID NOT NULL,
    previous_state VARCHAR(50) NOT NULL,
    new_state VARCHAR(50) NOT NULL,
    decision VARCHAR(50) NOT NULL,
    review_notes TEXT NOT NULL,
    reviewed_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS seller_state_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    seller_profile_id UUID NOT NULL,
    from_state VARCHAR(50) NOT NULL,
    to_state VARCHAR(50) NOT NULL,
    changed_by_user_id UUID NOT NULL,
    transition_reason TEXT,
    transitioned_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS seller_warehouses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    seller_profile_id UUID NOT NULL,
    warehouse_name VARCHAR(150) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    contact_person VARCHAR(150) NOT NULL,
    contact_number VARCHAR(20) NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    verification_status VARCHAR(50) NOT NULL,
    verified_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS settlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    contract_id UUID NOT NULL UNIQUE,
    status VARCHAR(50) NOT NULL,
    contract_number VARCHAR(100) NOT NULL,
    winner_id UUID NOT NULL,
    buyer_snapshot TEXT NOT NULL,
    seller_snapshot TEXT NOT NULL,
    auction_snapshot TEXT NOT NULL,
    lot_snapshot TEXT NOT NULL,
    winning_amount BIGINT NOT NULL,
    platform_fee BIGINT NOT NULL,
    tax_amount BIGINT NOT NULL,
    payout_amount BIGINT NOT NULL,
    currency VARCHAR(10) NOT NULL,
    tax_snapshot TEXT NOT NULL,
    generated_timestamp TIMESTAMPTZ NOT NULL,
    completed_by VARCHAR(255),
    completed_at TIMESTAMPTZ,
    completion_remarks TEXT,
    cancelled_by VARCHAR(255),
    cancelled_at TIMESTAMPTZ,
    cancellation_reason TEXT
);

CREATE TABLE IF NOT EXISTS settlement_histories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    settlement_id UUID NOT NULL,
    actor VARCHAR(255) NOT NULL,
    action_timestamp TIMESTAMPTZ NOT NULL,
    previous_status VARCHAR(50),
    current_status VARCHAR(50) NOT NULL,
    reason VARCHAR(1000),
    remarks TEXT,
    correlation_id VARCHAR(255),
    request_source VARCHAR(255),
    ip_address VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS settlement_reconciliations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    settlement_id UUID NOT NULL,
    payment_id UUID,
    ledger_batch_id UUID,
    gst_invoice_id UUID,
    status VARCHAR(50) NOT NULL,
    notes TEXT,
    reconciled_at TIMESTAMPTZ,
    correlation_id VARCHAR(100),
    trace_id VARCHAR(100),
    node_id VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    status VARCHAR(30) NOT NULL,
    priority VARCHAR(20) NOT NULL,
    assigned_to UUID,
    user_id UUID NOT NULL
);

CREATE TABLE IF NOT EXISTS tax_breakups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    settlement_id UUID NOT NULL,
    tax_name VARCHAR(100) NOT NULL,
    tax_rate BIGINT NOT NULL,
    taxable_basis BIGINT NOT NULL,
    calculated_tax BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS tax_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    region_code VARCHAR(50) NOT NULL,
    tax_name VARCHAR(100) NOT NULL,
    rate BIGINT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    mobile VARCHAR(15),
    user_type VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    is_locked BOOLEAN NOT NULL DEFAULT FALSE,
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    mobile_verified BOOLEAN NOT NULL DEFAULT FALSE,
    failed_login_attempts INT,
    locked_at TIMESTAMPTZ,
    password_expires_at TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,
    last_password_change_at TIMESTAMPTZ,
    roles VARCHAR(255),
    version BIGINT DEFAULT 0,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    user_id UUID NOT NULL UNIQUE,
    available_balance BIGINT NOT NULL,
    locked_balance BIGINT NOT NULL,
    currency VARCHAR(10) NOT NULL,
    last_updated TIMESTAMPTZ NOT NULL,
    permanent_emd BIGINT,
    refund_pending BIGINT,
    settlement_pending BIGINT
);

CREATE TABLE IF NOT EXISTS winner_histories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    winner_id UUID NOT NULL,
    previous_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    action_by VARCHAR(100) NOT NULL,
    action_at TIMESTAMPTZ NOT NULL,
    remarks VARCHAR(1000),
    actor_id UUID,
    actor_type VARCHAR(50),
    reason VARCHAR(255),
    comments VARCHAR(1000),
    correlation_id VARCHAR(100),
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    action_timestamp TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS user_roles (
    user_id UUID NOT NULL,
    role_id UUID NOT NULL,
    PRIMARY KEY (user_id, role_id)
);

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id UUID NOT NULL,
    permission_id UUID NOT NULL,
    PRIMARY KEY (role_id, permission_id)
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_hash ON refresh_tokens (token_hash);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_family ON refresh_tokens (token_family_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_outbox_aggregate ON outbox_events(aggregate_type, aggregate_id);
CREATE INDEX IF NOT EXISTS idx_idempotency_key ON idempotency_records(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_bids_lot_amount ON bids(auction_lot_id, bid_amount DESC);

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
