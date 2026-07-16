-- ==============================================================
-- Flyway Migration: V2__bidder_onboarding.sql
-- Module: Bidder Onboarding Schema, Outbox & Index Definitions
-- Target: PostgreSQL 15
-- ==============================================================

-- 1. Table: bidder_profiles
CREATE TABLE IF NOT EXISTS bidder_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    state VARCHAR(50) NOT NULL,
    bidder_type VARCHAR(50) NOT NULL, -- INDIVIDUAL or CORPORATE
    encrypted_pan VARCHAR(255) NOT NULL,
    pan_hash VARCHAR(64) NOT NULL,
    pan_verification_status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    pan_verified_at TIMESTAMPTZ,
    masked_aadhaar VARCHAR(20),
    aadhaar_hash VARCHAR(64),
    aadhaar_verification_status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    aadhaar_verified_at TIMESTAMPTZ,
    rejection_reason TEXT,
    
    -- Optimistic Locking & Audit
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    
    CONSTRAINT fk_bidder_profile_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TRIGGER trg_bidder_profiles_updated_at 
BEFORE UPDATE ON bidder_profiles 
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 2. Table: organizations
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bidder_profile_id UUID NOT NULL UNIQUE,
    organization_name VARCHAR(255) NOT NULL,
    organization_type VARCHAR(50) NOT NULL,
    registration_number VARCHAR(100) NOT NULL,
    cin VARCHAR(21),
    gstin VARCHAR(15),
    gst_verification_status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    gst_verified_at TIMESTAMPTZ,
    registration_authority VARCHAR(150),
    registered_address TEXT NOT NULL,
    
    -- Optimistic Locking & Audit
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    
    CONSTRAINT fk_organization_bidder_profile FOREIGN KEY (bidder_profile_id) REFERENCES bidder_profiles (id) ON DELETE CASCADE
);

CREATE TRIGGER trg_organizations_updated_at 
BEFORE UPDATE ON organizations 
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 3. Table: bank_accounts
CREATE TABLE IF NOT EXISTS bank_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bidder_profile_id UUID NOT NULL,
    account_holder_name VARCHAR(150) NOT NULL,
    encrypted_account_number VARCHAR(255) NOT NULL,
    account_hash VARCHAR(64) NOT NULL,
    ifsc_code VARCHAR(11) NOT NULL,
    bank_name VARCHAR(150) NOT NULL,
    branch_name VARCHAR(150) NOT NULL,
    verification_status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    bank_account_type VARCHAR(50) NOT NULL DEFAULT 'SAVINGS',
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    verified_at TIMESTAMPTZ,
    verification_provider VARCHAR(100),
    penny_drop_status VARCHAR(50),
    penny_drop_reference VARCHAR(100),
    penny_drop_transaction_id VARCHAR(100),
    
    -- Optimistic Locking & Audit
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    
    CONSTRAINT fk_bank_account_bidder_profile FOREIGN KEY (bidder_profile_id) REFERENCES bidder_profiles (id) ON DELETE CASCADE
);

CREATE TRIGGER trg_bank_accounts_updated_at 
BEFORE UPDATE ON bank_accounts 
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 4. Table: kyc_documents
CREATE TABLE IF NOT EXISTS kyc_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bidder_profile_id UUID NOT NULL,
    organization_id UUID,
    document_type VARCHAR(50) NOT NULL,
    storage_path VARCHAR(512) NOT NULL,
    document_hash VARCHAR(64) NOT NULL,
    verification_status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    rejection_reason TEXT,
    mime_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    malware_scanned BOOLEAN NOT NULL DEFAULT FALSE,
    malware_detected BOOLEAN NOT NULL DEFAULT FALSE,
    ocr_confidence DOUBLE PRECISION,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    uploaded_by_user_id UUID,
    verified_at TIMESTAMPTZ,
    
    -- Optimistic Locking & Audit
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    
    CONSTRAINT fk_kyc_document_bidder_profile FOREIGN KEY (bidder_profile_id) REFERENCES bidder_profiles (id) ON DELETE CASCADE,
    CONSTRAINT fk_kyc_document_org FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE CASCADE,
    CONSTRAINT fk_kyc_document_uploader FOREIGN KEY (uploaded_by_user_id) REFERENCES users (id) ON DELETE SET NULL
);

CREATE TRIGGER trg_kyc_documents_updated_at 
BEFORE UPDATE ON kyc_documents 
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 5. Table: kyc_reviews
CREATE TABLE IF NOT EXISTS kyc_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bidder_profile_id UUID NOT NULL,
    reviewer_user_id UUID NOT NULL,
    previous_state VARCHAR(50) NOT NULL,
    new_state VARCHAR(50) NOT NULL,
    decision VARCHAR(50) NOT NULL,
    review_notes TEXT NOT NULL,
    rejection_code VARCHAR(50),
    reviewer_ip VARCHAR(45),
    review_duration_ms BIGINT,
    reviewed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Optimistic Locking & Audit
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    
    CONSTRAINT fk_kyc_review_bidder_profile FOREIGN KEY (bidder_profile_id) REFERENCES bidder_profiles (id) ON DELETE CASCADE,
    CONSTRAINT fk_kyc_review_reviewer FOREIGN KEY (reviewer_user_id) REFERENCES users (id) ON DELETE RESTRICT
);

CREATE TRIGGER trg_kyc_reviews_updated_at 
BEFORE UPDATE ON kyc_reviews 
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 6. Table: bidder_state_history
CREATE TABLE IF NOT EXISTS bidder_state_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bidder_profile_id UUID NOT NULL,
    from_state VARCHAR(50) NOT NULL,
    to_state VARCHAR(50) NOT NULL,
    changed_by_user_id UUID NOT NULL,
    transition_reason TEXT,
    transitioned_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Optimistic Locking & Audit
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    
    CONSTRAINT fk_state_history_bidder_profile FOREIGN KEY (bidder_profile_id) REFERENCES bidder_profiles (id) ON DELETE CASCADE,
    CONSTRAINT fk_state_history_actor FOREIGN KEY (changed_by_user_id) REFERENCES users (id) ON DELETE RESTRICT
);

CREATE TRIGGER trg_bidder_state_history_updated_at 
BEFORE UPDATE ON bidder_state_history 
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 7. Table: outbox_events
CREATE TABLE IF NOT EXISTS outbox_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aggregate_id UUID NOT NULL,
    aggregate_type VARCHAR(100) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    payload TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    processed BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    retry_count INTEGER NOT NULL DEFAULT 0,
    error_message TEXT,
    last_attempt_time TIMESTAMPTZ,
    next_retry_time TIMESTAMPTZ,
    last_failure_reason TEXT,
    exception_class VARCHAR(255),
    stack_trace_summary TEXT,
    processing_node VARCHAR(255),
    dead_letter_timestamp TIMESTAMPTZ,
    processed_at TIMESTAMPTZ,
    event_version VARCHAR(50) NOT NULL DEFAULT '1.0',
    schema_version VARCHAR(50) NOT NULL DEFAULT '1.0',
    aggregate_version BIGINT NOT NULL DEFAULT 1,
    correlation_id VARCHAR(100),
    trace_id VARCHAR(100),
    node_id VARCHAR(100),
    version BIGINT NOT NULL DEFAULT 0
);

-- ==============================================================
-- 8. PERFORMANCE & DE-DUPLICATION INDEXES
-- ==============================================================

-- Unique index to prevent duplicate active onboarding profiles for a User
CREATE UNIQUE INDEX idx_bidder_profile_active_user 
ON bidder_profiles (user_id) 
WHERE deleted_at IS NULL;

-- Unique index to prevent duplicate active Aadhaar registrations
CREATE UNIQUE INDEX idx_bidder_profile_active_aadhaar 
ON bidder_profiles (aadhaar_hash) 
WHERE deleted_at IS NULL AND aadhaar_hash IS NOT NULL;

-- Unique index to prevent duplicate active PAN registrations
CREATE UNIQUE INDEX idx_bidder_pan_hash_active
ON bidder_profiles(pan_hash)
WHERE deleted_at IS NULL;

-- Unique index to prevent duplicate GSTIN registrations on active organizations
CREATE UNIQUE INDEX idx_org_gstin_active
ON organizations(LOWER(gstin))
WHERE deleted_at IS NULL
AND gstin IS NOT NULL;

-- Unique index to prevent upload of duplicate physical KYC document files
CREATE UNIQUE INDEX idx_kyc_documents_active_hash 
ON kyc_documents (document_hash) 
WHERE deleted_at IS NULL;

-- Query performance indexes
CREATE INDEX idx_bidder_profiles_state ON bidder_profiles (state) WHERE deleted_at IS NULL;
CREATE INDEX idx_organizations_profile ON organizations (bidder_profile_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_bank_accounts_profile ON bank_accounts (bidder_profile_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_kyc_documents_profile ON kyc_documents (bidder_profile_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_kyc_reviews_profile ON kyc_reviews (bidder_profile_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_state_history_profile ON bidder_state_history (bidder_profile_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_outbox_unprocessed ON outbox_events(processed) WHERE processed = FALSE;
