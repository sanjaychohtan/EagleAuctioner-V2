-- ==============================================================
-- Flyway Migration: V3__seller_onboarding.sql
-- Module: Seller Onboarding Schema & Index Definitions
-- Target: PostgreSQL 15
-- ==============================================================

-- 1. Table: seller_profiles
CREATE TABLE IF NOT EXISTS seller_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    state VARCHAR(50) NOT NULL,
    seller_type VARCHAR(50) NOT NULL,
    encrypted_pan VARCHAR(255),
    pan_hash VARCHAR(64),
    pan_verification_status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    pan_verified_at TIMESTAMPTZ,
    rejection_reason TEXT,
    suspension_reason TEXT,
    blacklist_reason TEXT,
    onboarded_at TIMESTAMPTZ,
    
    -- Optimistic Locking & Audit
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    
    CONSTRAINT fk_seller_profile_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TRIGGER trg_seller_profiles_updated_at 
BEFORE UPDATE ON seller_profiles 
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 2. Table: seller_companies
CREATE TABLE IF NOT EXISTS seller_companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_profile_id UUID NOT NULL UNIQUE,
    company_name VARCHAR(255) NOT NULL,
    registration_number VARCHAR(100) NOT NULL,
    gstin VARCHAR(15),
    gst_verification_status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    gst_verified_at TIMESTAMPTZ,
    registered_address TEXT NOT NULL,
    
    -- Optimistic Locking & Audit
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    
    CONSTRAINT fk_seller_company_profile FOREIGN KEY (seller_profile_id) REFERENCES seller_profiles (id) ON DELETE CASCADE
);

CREATE TRIGGER trg_seller_companies_updated_at 
BEFORE UPDATE ON seller_companies 
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 3. Table: seller_warehouses
CREATE TABLE IF NOT EXISTS seller_warehouses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_profile_id UUID NOT NULL,
    warehouse_name VARCHAR(150) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    contact_person VARCHAR(150) NOT NULL,
    contact_number VARCHAR(20) NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    verification_status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    verified_at TIMESTAMPTZ,
    
    -- Optimistic Locking & Audit
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    
    CONSTRAINT fk_seller_warehouse_profile FOREIGN KEY (seller_profile_id) REFERENCES seller_profiles (id) ON DELETE CASCADE
);

CREATE TRIGGER trg_seller_warehouses_updated_at 
BEFORE UPDATE ON seller_warehouses 
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 4. Table: seller_documents
CREATE TABLE IF NOT EXISTS seller_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_profile_id UUID NOT NULL,
    document_type VARCHAR(50) NOT NULL,
    storage_path VARCHAR(512) NOT NULL,
    document_hash VARCHAR(64) NOT NULL,
    verification_status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    rejection_reason TEXT,
    mime_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    verified_at TIMESTAMPTZ,
    
    -- Optimistic Locking & Audit
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    
    CONSTRAINT fk_seller_document_profile FOREIGN KEY (seller_profile_id) REFERENCES seller_profiles (id) ON DELETE CASCADE
);

CREATE TRIGGER trg_seller_documents_updated_at 
BEFORE UPDATE ON seller_documents 
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 5. Table: seller_reviews
CREATE TABLE IF NOT EXISTS seller_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_profile_id UUID NOT NULL,
    reviewer_user_id UUID NOT NULL,
    previous_state VARCHAR(50) NOT NULL,
    new_state VARCHAR(50) NOT NULL,
    decision VARCHAR(50) NOT NULL,
    review_notes TEXT NOT NULL,
    reviewed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Optimistic Locking & Audit
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    
    CONSTRAINT fk_seller_review_profile FOREIGN KEY (seller_profile_id) REFERENCES seller_profiles (id) ON DELETE CASCADE,
    CONSTRAINT fk_seller_review_reviewer FOREIGN KEY (reviewer_user_id) REFERENCES users (id) ON DELETE RESTRICT
);

CREATE TRIGGER trg_seller_reviews_updated_at 
BEFORE UPDATE ON seller_reviews 
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 6. Table: seller_state_history
CREATE TABLE IF NOT EXISTS seller_state_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_profile_id UUID NOT NULL,
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
    
    CONSTRAINT fk_state_history_seller_profile FOREIGN KEY (seller_profile_id) REFERENCES seller_profiles (id) ON DELETE CASCADE,
    CONSTRAINT fk_state_history_seller_actor FOREIGN KEY (changed_by_user_id) REFERENCES users (id) ON DELETE RESTRICT
);

CREATE TRIGGER trg_seller_state_history_updated_at 
BEFORE UPDATE ON seller_state_history 
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();


-- ==============================================================
-- 7. PERFORMANCE & DE-DUPLICATION INDEXES
-- ==============================================================

-- Unique index to prevent duplicate active onboarding profiles for a User
CREATE UNIQUE INDEX idx_seller_profile_active_user 
ON seller_profiles (user_id) 
WHERE deleted_at IS NULL;

-- Unique index to prevent duplicate PAN registrations on active seller profiles
CREATE UNIQUE INDEX idx_seller_profile_active_pan_hash 
ON seller_profiles (pan_hash) 
WHERE deleted_at IS NULL AND pan_hash IS NOT NULL;

-- Unique index to prevent duplicate GSTIN registrations on active companies
CREATE UNIQUE INDEX idx_seller_companies_active_gstin 
ON seller_companies (LOWER(gstin)) 
WHERE deleted_at IS NULL AND gstin IS NOT NULL;

-- Unique index to prevent duplicate file uploads of seller documents
CREATE UNIQUE INDEX idx_seller_documents_profile_hash 
ON seller_documents (seller_profile_id, document_hash) 
WHERE deleted_at IS NULL;

-- Query performance indexes
CREATE INDEX idx_seller_profiles_state ON seller_profiles (state) WHERE deleted_at IS NULL;
CREATE INDEX idx_seller_companies_profile ON seller_companies (seller_profile_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_seller_warehouses_profile ON seller_warehouses (seller_profile_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_seller_documents_profile ON seller_documents (seller_profile_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_seller_reviews_profile ON seller_reviews (seller_profile_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_seller_state_history_profile ON seller_state_history (seller_profile_id) WHERE deleted_at IS NULL;
