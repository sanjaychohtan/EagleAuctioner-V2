export const SQL_SCHEMA_CONTENT = `-- ==========================================
-- PostgreSQL 15 Authentication Module Schema
-- ==========================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Standardized trigger to gracefully maintain 'updated_at' audit field on changes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- --- Table: users ---
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    mobile VARCHAR(20),
    user_type VARCHAR(50) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    mobile_verified BOOLEAN NOT NULL DEFAULT FALSE,
    is_locked BOOLEAN NOT NULL DEFAULT FALSE,
    failed_login_attempts INTEGER NOT NULL DEFAULT 0,
    locked_at TIMESTAMPTZ DEFAULT NULL,
    password_expires_at TIMESTAMPTZ DEFAULT NULL,
    last_login_at TIMESTAMPTZ DEFAULT NULL,
    last_password_change_at TIMESTAMPTZ DEFAULT NULL,
    
    -- Audit and Version
    version BIGINT NOT NULL DEFAULT 0,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ DEFAULT NULL
);

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- --- Table: roles ---
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL,
    description VARCHAR(255),
    system_role BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Audit and Version
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ DEFAULT NULL
);

CREATE TRIGGER trg_roles_updated_at BEFORE UPDATE ON roles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- --- Table: permissions ---
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    module VARCHAR(50) NOT NULL,
    description TEXT,
    
    -- Audit and Version
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ DEFAULT NULL
);

CREATE TRIGGER trg_permissions_updated_at BEFORE UPDATE ON permissions FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- --- Table: user_roles (Junction) ---
CREATE TABLE IF NOT EXISTS user_roles (
    user_id UUID NOT NULL,
    role_id UUID NOT NULL,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT pk_user_roles PRIMARY KEY (user_id, role_id),
    CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE CASCADE
);

-- --- Table: role_permissions (Junction) ---
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id UUID NOT NULL,
    permission_id UUID NOT NULL,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT pk_role_permissions PRIMARY KEY (role_id, permission_id),
    CONSTRAINT fk_role_permissions_role FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE CASCADE,
    CONSTRAINT fk_role_permissions_permission FOREIGN KEY (permission_id) REFERENCES permissions (id) ON DELETE CASCADE
);

-- --- Table: refresh_tokens ---
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    token VARCHAR(512) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
    refreshed_from_id UUID DEFAULT NULL,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_refresh_tokens_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_refresh_tokens_parent FOREIGN KEY (refreshed_from_id) REFERENCES refresh_tokens (id) ON DELETE SET NULL
);

-- --- Table: audit_logs ---
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(255),
    old_value JSONB,
    new_value JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 3. INDEXES FOR PERFORMANCE & INTEGRITY
-- ==========================================

CREATE UNIQUE INDEX idx_users_active_email ON users (LOWER(email)) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_status ON users (is_active) WHERE deleted_at IS NULL;

-- Remove unique=true on roles, but keep index for performance
CREATE INDEX idx_roles_name ON roles (name);

-- Remove unique=true on permissions, but keep index for performance
CREATE INDEX idx_permissions_name ON permissions (name);

CREATE INDEX idx_user_roles_role_id ON user_roles (role_id);
CREATE INDEX idx_role_permissions_permission_id ON role_permissions (permission_id);

CREATE UNIQUE INDEX idx_refresh_tokens_lookup ON refresh_tokens (token);
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens (user_id);
CREATE INDEX idx_refresh_tokens_cleanup ON refresh_tokens (expires_at) WHERE is_revoked = FALSE;

CREATE INDEX idx_audit_logs_user_id ON audit_logs (user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs (action);

-- ==========================================
-- 4. BIDDER ONBOARDING MODULE (STRING-2)
-- ==========================================

-- --- Table: bidder_profiles ---
CREATE TABLE IF NOT EXISTS bidder_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    state VARCHAR(50) NOT NULL,
    bidder_type VARCHAR(50) NOT NULL,
    encrypted_pan VARCHAR(255) NOT NULL,
    pan_verification_status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    masked_aadhaar VARCHAR(20),
    aadhaar_hash VARCHAR(64),
    aadhaar_verification_status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    rejection_reason TEXT,
    
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    
    CONSTRAINT fk_bidder_profile_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TRIGGER trg_bidder_profiles_updated_at BEFORE UPDATE ON bidder_profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- --- Table: organizations ---
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bidder_profile_id UUID NOT NULL UNIQUE,
    organization_name VARCHAR(255) NOT NULL,
    registration_number VARCHAR(100) NOT NULL,
    gstin VARCHAR(15),
    registered_address TEXT NOT NULL,
    
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    
    CONSTRAINT fk_organization_bidder_profile FOREIGN KEY (bidder_profile_id) REFERENCES bidder_profiles (id) ON DELETE CASCADE
);

CREATE TRIGGER trg_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- --- Table: bank_accounts ---
CREATE TABLE IF NOT EXISTS bank_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bidder_profile_id UUID NOT NULL UNIQUE,
    account_holder_name VARCHAR(150) NOT NULL,
    encrypted_account_number VARCHAR(255) NOT NULL,
    ifsc_code VARCHAR(11) NOT NULL,
    bank_name VARCHAR(150) NOT NULL,
    branch_name VARCHAR(150) NOT NULL,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    penny_drop_transaction_id VARCHAR(100),
    
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    
    CONSTRAINT fk_bank_account_bidder_profile FOREIGN KEY (bidder_profile_id) REFERENCES bidder_profiles (id) ON DELETE CASCADE
);

CREATE TRIGGER trg_bank_accounts_updated_at BEFORE UPDATE ON bank_accounts FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- --- Table: kyc_documents ---
CREATE TABLE IF NOT EXISTS kyc_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bidder_profile_id UUID NOT NULL,
    document_type VARCHAR(50) NOT NULL,
    storage_path VARCHAR(512) NOT NULL,
    document_hash VARCHAR(64) NOT NULL,
    verification_status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    rejection_reason TEXT,
    
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    
    CONSTRAINT fk_kyc_document_bidder_profile FOREIGN KEY (bidder_profile_id) REFERENCES bidder_profiles (id) ON DELETE CASCADE
);

CREATE TRIGGER trg_kyc_documents_updated_at BEFORE UPDATE ON kyc_documents FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- --- Table: kyc_reviews ---
CREATE TABLE IF NOT EXISTS kyc_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bidder_profile_id UUID NOT NULL,
    reviewer_user_id UUID NOT NULL,
    previous_state VARCHAR(50) NOT NULL,
    new_state VARCHAR(50) NOT NULL,
    decision VARCHAR(50) NOT NULL,
    review_notes TEXT NOT NULL,
    reviewed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    
    CONSTRAINT fk_kyc_review_bidder_profile FOREIGN KEY (bidder_profile_id) REFERENCES bidder_profiles (id) ON DELETE CASCADE,
    CONSTRAINT fk_kyc_review_reviewer FOREIGN KEY (reviewer_user_id) REFERENCES users (id) ON DELETE RESTRICT
);

CREATE TRIGGER trg_kyc_reviews_updated_at BEFORE UPDATE ON kyc_reviews FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- --- Table: bidder_state_history ---
CREATE TABLE IF NOT EXISTS bidder_state_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bidder_profile_id UUID NOT NULL,
    from_state VARCHAR(50) NOT NULL,
    to_state VARCHAR(50) NOT NULL,
    changed_by_user_id UUID NOT NULL,
    transition_reason TEXT,
    transitioned_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    
    CONSTRAINT fk_state_history_bidder_profile FOREIGN KEY (bidder_profile_id) REFERENCES bidder_profiles (id) ON DELETE CASCADE,
    CONSTRAINT fk_state_history_actor FOREIGN KEY (changed_by_user_id) REFERENCES users (id) ON DELETE RESTRICT
);

CREATE TRIGGER trg_bidder_state_history_updated_at BEFORE UPDATE ON bidder_state_history FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- PostgreSQL 15 Partial Indexes for Security and Business Dedup
CREATE UNIQUE INDEX idx_bidder_profile_active_user ON bidder_profiles (user_id) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_bidder_profile_active_aadhaar ON bidder_profiles (aadhaar_hash) WHERE deleted_at IS NULL AND aadhaar_hash IS NOT NULL;
CREATE UNIQUE INDEX idx_kyc_documents_active_hash ON kyc_documents (document_hash) WHERE deleted_at IS NULL;

-- Standard Performance Indexes
CREATE INDEX idx_bidder_profiles_state ON bidder_profiles (state) WHERE deleted_at IS NULL;
CREATE INDEX idx_organizations_profile ON organizations (bidder_profile_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_bank_accounts_profile ON bank_accounts (bidder_profile_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_kyc_documents_profile ON kyc_documents (bidder_profile_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_kyc_reviews_profile ON kyc_reviews (bidder_profile_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_state_history_profile ON bidder_state_history (bidder_profile_id) WHERE deleted_at IS NULL;

-- --- Table: outbox_events ---
CREATE TABLE IF NOT EXISTS outbox_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aggregate_id UUID NOT NULL,
    aggregate_type VARCHAR(100) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    payload TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    processed BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_outbox_unprocessed ON outbox_events(processed) WHERE processed = FALSE;

-- Hardening indexes
CREATE UNIQUE INDEX idx_bidder_pan_hash_active ON bidder_profiles(pan_hash) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_org_gstin_active ON organizations(LOWER(gstin)) WHERE deleted_at IS NULL AND gstin IS NOT NULL;
`;

export interface SchemaColumn {
  name: string;
  type: string;
  isPk: boolean;
  isFk: boolean;
  isNullable: boolean;
  defaultVal?: string;
  references?: string;
  description: string;
}

export interface SchemaIndex {
  name: string;
  definition: string;
  purpose: string;
}

export interface SchemaTable {
  name: string;
  description: string;
  columns: SchemaColumn[];
  indexes: SchemaIndex[];
  triggers: string[];
  designRationale: string;
}

export const SCHEMA_TABLES: SchemaTable[] = [
  {
    name: "users",
    description: "Stores central user credentials, profile records, activation states, and dynamic deletion flags.",
    designRationale: "Uses sub-second indexes, UUID generated via pgcrypto/pg_random_uuid() natively on PG 15. The email field uses a unique low-case partial index to bypass duplicates for active files but clear duplicates on soft delete.",
    columns: [
      { name: "id", type: "UUID", isPk: true, isFk: false, isNullable: false, defaultVal: "gen_random_uuid()", description: "Globally unique user identifier." },
      { name: "email", type: "VARCHAR(255)", isPk: false, isFk: false, isNullable: false, description: "Normalized unique login address." },
      { name: "password_hash", type: "VARCHAR(255)", isPk: false, isFk: false, isNullable: false, description: "Industry-standard salted hashed credential value (e.g., bcrypt, argon2id)." },
      { name: "first_name", type: "VARCHAR(100)", isPk: false, isFk: false, isNullable: true, description: "Optional given name." },
      { name: "last_name", type: "VARCHAR(100)", isPk: false, isFk: false, isNullable: true, description: "Optional family name." },
      { name: "mobile", type: "VARCHAR(20)", isPk: false, isFk: false, isNullable: true, description: "Mobile contact number." },
      { name: "user_type", type: "VARCHAR(50)", isPk: false, isFk: false, isNullable: false, description: "Enum based user type (BIDDER, SELLER, etc)." },
      { name: "is_active", type: "BOOLEAN", isPk: false, isFk: false, isNullable: false, defaultVal: "TRUE", description: "Enables immediate security suspensions." },
      { name: "email_verified", type: "BOOLEAN", isPk: false, isFk: false, isNullable: false, defaultVal: "FALSE", description: "Email verification status." },
      { name: "mobile_verified", type: "BOOLEAN", isPk: false, isFk: false, isNullable: false, defaultVal: "FALSE", description: "Mobile OTP verification status." },
      { name: "is_locked", type: "BOOLEAN", isPk: false, isFk: false, isNullable: false, defaultVal: "FALSE", description: "Account lockout status." },
      { name: "failed_login_attempts", type: "INTEGER", isPk: false, isFk: false, isNullable: false, defaultVal: "0", description: "Counter for failed logins." },
      { name: "locked_at", type: "TIMESTAMPTZ", isPk: false, isFk: false, isNullable: true, defaultVal: "NULL", description: "Timestamp when account was locked." },
      { name: "password_expires_at", type: "TIMESTAMPTZ", isPk: false, isFk: false, isNullable: true, defaultVal: "NULL", description: "Timestamp when password expires." },
      { name: "last_login_at", type: "TIMESTAMPTZ", isPk: false, isFk: false, isNullable: true, defaultVal: "NULL", description: "Timestamp of last successful login." },
      { name: "last_password_change_at", type: "TIMESTAMPTZ", isPk: false, isFk: false, isNullable: true, defaultVal: "NULL", description: "Timestamp of last password change." },
      { name: "version", type: "BIGINT", isPk: false, isFk: false, isNullable: false, defaultVal: "0", description: "Optimistic locking version field." },
      { name: "created_by", type: "VARCHAR(255)", isPk: false, isFk: false, isNullable: true, description: "Audit: Originating actor." },
      { name: "updated_by", type: "VARCHAR(255)", isPk: false, isFk: false, isNullable: true, description: "Audit: Last modifying actor." },
      { name: "created_at", type: "TIMESTAMPTZ", isPk: false, isFk: false, isNullable: false, defaultVal: "CURRENT_TIMESTAMP", description: "Audit: Creation timestamp in UTC." },
      { name: "updated_at", type: "TIMESTAMPTZ", isPk: false, isFk: false, isNullable: false, defaultVal: "CURRENT_TIMESTAMP", description: "Audit: Last modified timestamp in UTC." },
      { name: "deleted_at", type: "TIMESTAMPTZ", isPk: false, isFk: false, isNullable: true, defaultVal: "NULL", description: "Audit: Null active, timestamp on soft-deletion." }
    ],
    indexes: [
      { name: "idx_users_active_email", definition: "CREATE UNIQUE INDEX idx_users_active_email ON users(LOWER(email)) WHERE deleted_at IS NULL;", purpose: "Ensures email uniqueness among current users, but permits reuse post soft-delete." },
      { name: "idx_users_status", definition: "CREATE INDEX idx_users_status ON users(is_active) WHERE deleted_at IS NULL;", purpose: "Optimizes searches for active/active-only users during verification lookups." }
    ],
    triggers: ["trg_users_updated_at"]
  },
  {
    name: "roles",
    description: "Groups users by business capabilities or clearance levels (e.g., 'BIDDER', 'SELLER').",
    designRationale: "Identified by secure UUIDs and uniquely bound to names logic. Supports soft-deletion audit logs. Removed DB unique constraint on name to rely on DB indexing.",
    columns: [
      { name: "id", type: "UUID", isPk: true, isFk: false, isNullable: false, defaultVal: "gen_random_uuid()", description: "Globally unique role identifier." },
      { name: "name", type: "VARCHAR(50)", isPk: false, isFk: false, isNullable: false, description: "Machine-readable identifier." },
      { name: "description", type: "VARCHAR(255)", isPk: false, isFk: false, isNullable: true, description: "Human description of capabilities." },
      { name: "system_role", type: "BOOLEAN", isPk: false, isFk: false, isNullable: false, defaultVal: "FALSE", description: "Flag to protect core roles from deletion." },
      { name: "version", type: "BIGINT", isPk: false, isFk: false, isNullable: false, defaultVal: "0", description: "Optimistic locking version field." },
      { name: "created_at", type: "TIMESTAMPTZ", isPk: false, isFk: false, isNullable: false, defaultVal: "CURRENT_TIMESTAMP", description: "Audit: Creation timestamp in UTC." },
      { name: "updated_at", type: "TIMESTAMPTZ", isPk: false, isFk: false, isNullable: false, defaultVal: "CURRENT_TIMESTAMP", description: "Audit: Last modified timestamp in UTC." },
      { name: "deleted_at", type: "TIMESTAMPTZ", isPk: false, isFk: false, isNullable: true, defaultVal: "NULL", description: "Audit: Soft-deletion indicator." }
    ],
    indexes: [
      { name: "idx_roles_name", definition: "CREATE INDEX idx_roles_name ON roles(name);", purpose: "Validates role names per workspace." }
    ],
    triggers: ["trg_roles_updated_at"]
  },
  {
    name: "permissions",
    description: "Defines low-level granular operations authorized within the application (e.g., 'billing:write', 'user:delete').",
    designRationale: "Structured as fine-grained permissions attached to roles for solid granular security. Standardized soft-delete indicators.",
    columns: [
      { name: "id", type: "UUID", isPk: true, isFk: false, isNullable: false, defaultVal: "gen_random_uuid()", description: "Globally unique permission identifier." },
      { name: "name", type: "VARCHAR(100)", isPk: false, isFk: false, isNullable: false, description: "Machine-readable action identifier (e.g., 'reports:export')." },
      { name: "module", type: "VARCHAR(50)", isPk: false, isFk: false, isNullable: false, description: "Enum based module category." },
      { name: "description", type: "TEXT", isPk: false, isFk: false, isNullable: true, description: "Descriptive scope definition." },
      { name: "version", type: "BIGINT", isPk: false, isFk: false, isNullable: false, defaultVal: "0", description: "Optimistic locking version field." },
      { name: "created_at", type: "TIMESTAMPTZ", isPk: false, isFk: false, isNullable: false, defaultVal: "CURRENT_TIMESTAMP", description: "Audit: Creation timestamp in UTC." },
      { name: "updated_at", type: "TIMESTAMPTZ", isPk: false, isFk: false, isNullable: false, defaultVal: "CURRENT_TIMESTAMP", description: "Audit: Last modified timestamp in UTC." },
      { name: "deleted_at", type: "TIMESTAMPTZ", isPk: false, isFk: false, isNullable: true, defaultVal: "NULL", description: "Audit: Soft-deletion indicator." }
    ],
    indexes: [
      { name: "idx_permissions_name", definition: "CREATE INDEX idx_permissions_name ON permissions(name);", purpose: "Speeds up name lookups." }
    ],
    triggers: ["trg_permissions_updated_at"]
  },
  {
    name: "user_roles",
    description: "Many-to-many junction table mapping physical users to their designated functional roles.",
    designRationale: "Employs clean composite keys and fully indexed reverse foreign lookup paths that speed up standard join checks.",
    columns: [
      { name: "user_id", type: "UUID", isPk: true, isFk: true, isNullable: false, references: "users.id", description: "Pointer to the user entity." },
      { name: "role_id", type: "UUID", isPk: true, isFk: true, isNullable: false, references: "roles.id", description: "Pointer to the mapped role." },
      { name: "created_at", type: "TIMESTAMPTZ", isPk: false, isFk: false, isNullable: false, defaultVal: "CURRENT_TIMESTAMP", description: "Audit: Creation timestamp in UTC." },
      { name: "updated_at", type: "TIMESTAMPTZ", isPk: false, isFk: false, isNullable: false, defaultVal: "CURRENT_TIMESTAMP", description: "Audit: Last modified timestamp in UTC." }
    ],
    indexes: [
      { name: "idx_user_roles_role_id", definition: "CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);", purpose: "Speeds up mapping lookups from role to users, since the primary key starts with user_id." }
    ],
    triggers: []
  },
  {
    name: "role_permissions",
    description: "Many-to-many junction table binding permissions to specific administrative roles.",
    designRationale: "Fully implements declarative cascades meaning deleting permissions or roles automatically updates mappings without orphaned keys.",
    columns: [
      { name: "role_id", type: "UUID", isPk: true, isFk: true, isNullable: false, references: "roles.id", description: "Pointer to the role owner." },
      { name: "permission_id", type: "UUID", isPk: true, isFk: true, isNullable: false, references: "permissions.id", description: "Pointer to the attached capability." },
      { name: "created_at", type: "TIMESTAMPTZ", isPk: false, isFk: false, isNullable: false, defaultVal: "CURRENT_TIMESTAMP", description: "Audit: Creation timestamp in UTC." },
      { name: "updated_at", type: "TIMESTAMPTZ", isPk: false, isFk: false, isNullable: false, defaultVal: "CURRENT_TIMESTAMP", description: "Audit: Last modified timestamp in UTC." }
    ],
    indexes: [
      { name: "idx_role_permissions_permission_id", definition: "CREATE INDEX idx_role_permissions_permission_id ON role_permissions(permission_id);", purpose: "Speeds up searches from specific permissions back to associated roles." }
    ],
    triggers: []
  },
  {
    name: "refresh_tokens",
    description: "Tracks active user login sessions, rotates credentials, and isolates/revokes hijacked Refresh Tokens.",
    designRationale: "Features a recursive foreign key 'refreshed_from_id' pointing back to parent tokens. This lets your authentication module track the token lineage and trigger an immediate revocation of the whole token family if an expired or rotated token is reused (Token Reuse Detection / Attack Mitigation).",
    columns: [
      { name: "id", type: "UUID", isPk: true, isFk: false, isNullable: false, defaultVal: "gen_random_uuid()", description: "Unique token series identifier." },
      { name: "user_id", type: "UUID", isPk: false, isFk: true, isNullable: false, references: "users.id", description: "The token owner." },
      { name: "token", type: "VARCHAR(512)", isPk: false, isFk: false, isNullable: false, description: "Cryptographically randomized token payload string." },
      { name: "expires_at", type: "TIMESTAMPTZ", isPk: false, isFk: false, isNullable: false, description: "UTC timestamp marking standard session expiration." },
      { name: "is_revoked", type: "BOOLEAN", isPk: false, isFk: false, isNullable: false, defaultVal: "FALSE", description: "True if manually revoked or compromised due to token family breach." },
      { name: "refreshed_from_id", type: "UUID", isPk: false, isFk: true, isNullable: true, defaultVal: "NULL", references: "refresh_tokens.id", description: "Points to original token to trace rotated lineages as a protection check." },
      { name: "created_at", type: "TIMESTAMPTZ", isPk: false, isFk: false, isNullable: false, defaultVal: "CURRENT_TIMESTAMP", description: "Audit: Creation timestamp in UTC." },
      { name: "updated_at", type: "TIMESTAMPTZ", isPk: false, isFk: false, isNullable: false, defaultVal: "CURRENT_TIMESTAMP", description: "Audit: Last modified timestamp in UTC." }
    ],
    indexes: [
      { name: "idx_refresh_tokens_lookup", definition: "CREATE UNIQUE INDEX idx_refresh_tokens_lookup ON refresh_tokens(token);", purpose: "Ultra-fast direct token verification queries during API authorization checks." },
      { name: "idx_refresh_tokens_user_id", definition: "CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);", purpose: "Facilitates global logout (revoking all tokens belonging to a user ID)." },
      { name: "idx_refresh_tokens_cleanup", definition: "CREATE INDEX idx_refresh_tokens_cleanup ON refresh_tokens(expires_at) WHERE is_revoked = FALSE;", purpose: "Highly optimized partial index used by cron jobs to prune unrevoked, expired sessions." }
    ],
    triggers: []
  },
  {
    name: "audit_logs",
    description: "Records systemic authentication and role-based changes to meet enterprise audit requirements.",
    designRationale: "Separately structured table that leverages JSONB to store dynamic before/after payloads for fine-grained action tracing without requiring schema migrations on every entity update.",
    columns: [
      { name: "id", type: "UUID", isPk: true, isFk: false, isNullable: false, defaultVal: "gen_random_uuid()", description: "Audit event identifier." },
      { name: "user_id", type: "UUID", isPk: false, isFk: false, isNullable: true, description: "The actor who performed the action." },
      { name: "action", type: "VARCHAR(50)", isPk: false, isFk: false, isNullable: false, description: "Type of operation (LOGIN, LOGOUT, ROLE_CHANGE)." },
      { name: "entity_type", type: "VARCHAR(100)", isPk: false, isFk: false, isNullable: false, description: "Type of entity modified." },
      { name: "entity_id", type: "VARCHAR(255)", isPk: false, isFk: false, isNullable: true, description: "ID of the entity modified." },
      { name: "old_value", type: "JSONB", isPk: false, isFk: false, isNullable: true, description: "State before the action." },
      { name: "new_value", type: "JSONB", isPk: false, isFk: false, isNullable: true, description: "State after the action." },
      { name: "ip_address", type: "VARCHAR(45)", isPk: false, isFk: false, isNullable: true, description: "Network IP." },
      { name: "user_agent", type: "TEXT", isPk: false, isFk: false, isNullable: true, description: "Browser or client metadata." },
      { name: "created_at", type: "TIMESTAMPTZ", isPk: false, isFk: false, isNullable: false, defaultVal: "CURRENT_TIMESTAMP", description: "Audit: Action timestamp." }
    ],
    indexes: [
      { name: "idx_audit_logs_user_id", definition: "CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);", purpose: "Fast lookup of user audit history." },
      { name: "idx_audit_logs_action", definition: "CREATE INDEX idx_audit_logs_action ON audit_logs(action);", purpose: "Filtering by action type." }
    ],
    triggers: []
  },
  {
    name: "bidder_profiles",
    description: "Central record for verified bidder accounts, onboarding states, masked Aadhaar data, and identity hashes.",
    designRationale: "Employs strict state machine transitions, soft delete capabilities, and an optimistic locking version column. Integrates unique partial index to block duplicate active users or identical Aadhaar submissions.",
    columns: [
      { name: "id", type: "UUID", isPk: true, isFk: false, isNullable: false, defaultVal: "gen_random_uuid()", description: "Globally unique bidder profile identifier." },
      { name: "user_id", type: "UUID", isPk: false, isFk: true, isNullable: false, references: "users.id", description: "FK pointing to the base User owner." },
      { name: "state", type: "VARCHAR(50)", isPk: false, isFk: false, isNullable: false, description: "Dynamic state (DRAFT, KYC_PENDING, UNDER_REVIEW, APPROVED, REJECTED)." },
      { name: "bidder_type", type: "VARCHAR(50)", isPk: false, isFk: false, isNullable: false, description: "Profile business classification: INDIVIDUAL or CORPORATE." },
      { name: "encrypted_pan", type: "VARCHAR(255)", isPk: false, isFk: false, isNullable: false, description: "AES-256 GCM encrypted PAN number." },
      { name: "pan_verification_status", type: "VARCHAR(50)", isPk: false, isFk: false, isNullable: false, defaultVal: "'PENDING'", description: "Verification check state of PAN card details." },
      { name: "masked_aadhaar", type: "VARCHAR(20)", isPk: false, isFk: false, isNullable: true, description: "Aadhaar compliance mask: XXXX-XXXX-1234." },
      { name: "aadhaar_hash", type: "VARCHAR(64)", isPk: false, isFk: false, isNullable: true, description: "Cryptographically safe SHA-256 verification hash to prevent multiple accounts using same Aadhaar." },
      { name: "aadhaar_verification_status", type: "VARCHAR(50)", isPk: false, isFk: false, isNullable: false, defaultVal: "'PENDING'", description: "Aadhaar card validity check state." },
      { name: "rejection_reason", type: "TEXT", isPk: false, isFk: false, isNullable: true, description: "Description notes detailing why an admin rejected this profile." },
      { name: "version", type: "BIGINT", isPk: false, isFk: false, isNullable: false, defaultVal: "0", description: "Optimistic locking field." },
      { name: "created_at", type: "TIMESTAMPTZ", isPk: false, isFk: false, isNullable: false, defaultVal: "CURRENT_TIMESTAMP", description: "Creation timestamp in UTC." },
      { name: "updated_at", type: "TIMESTAMPTZ", isPk: false, isFk: false, isNullable: false, defaultVal: "CURRENT_TIMESTAMP", description: "Modification timestamp in UTC." },
      { name: "deleted_at", type: "TIMESTAMPTZ", isPk: false, isFk: false, isNullable: true, defaultVal: "NULL", description: "Soft deletion indicator." }
    ],
    indexes: [
      { name: "idx_bidder_profile_active_user", definition: "CREATE UNIQUE INDEX idx_bidder_profile_active_user ON bidder_profiles(user_id) WHERE deleted_at IS NULL;", purpose: "Prevents a single user from running multiple parallel active profiles." },
      { name: "idx_bidder_profile_active_aadhaar", definition: "CREATE UNIQUE INDEX idx_bidder_profile_active_aadhaar ON bidder_profiles(aadhaar_hash) WHERE deleted_at IS NULL AND aadhaar_hash IS NOT NULL;", purpose: "Blocks duplicate registrations using identical Aadhaar credentials." }
    ],
    triggers: ["trg_bidder_profiles_updated_at"]
  },
  {
    name: "organizations",
    description: "Corporate organizational registration details linked only to corporate-type bidder profiles.",
    designRationale: "Enforces soft-delete isolation and cascades parent bidder profile deletions cleanly. Separated out to keep individual bidder records light.",
    columns: [
      { name: "id", type: "UUID", isPk: true, isFk: false, isNullable: false, defaultVal: "gen_random_uuid()", description: "Unique organization details row identifier." },
      { name: "bidder_profile_id", type: "UUID", isPk: false, isFk: true, isNullable: false, references: "bidder_profiles.id", description: "Owner corporate bidder profile reference." },
      { name: "organization_name", type: "VARCHAR(255)", isPk: false, isFk: false, isNullable: false, description: "Officially registered corporate entity name." },
      { name: "registration_number", type: "VARCHAR(100)", isPk: false, isFk: false, isNullable: false, description: "Incorporation certificate registration index." },
      { name: "gstin", type: "VARCHAR(15)", isPk: false, isFk: false, isNullable: true, description: "Goods & Services Tax Identification Number." },
      { name: "registered_address", type: "TEXT", isPk: false, isFk: false, isNullable: false, description: "Official corporate address details." },
      { name: "version", type: "BIGINT", isPk: false, isFk: false, isNullable: false, defaultVal: "0", description: "Optimistic locking field." }
    ],
    indexes: [
      { name: "idx_organizations_profile", definition: "CREATE INDEX idx_organizations_profile ON organizations(bidder_profile_id) WHERE deleted_at IS NULL;", purpose: "Optimizes queries loading corporate profile details." }
    ],
    triggers: ["trg_organizations_updated_at"]
  },
  {
    name: "bank_accounts",
    description: "Houses encrypted banking details, IFSC specifications, and transaction check flags.",
    designRationale: "Encrypts bank account details using native AES-256 GCM prior to disk storage. Records unique Penny Drop verification transaction IDs.",
    columns: [
      { name: "id", type: "UUID", isPk: true, isFk: false, isNullable: false, defaultVal: "gen_random_uuid()", description: "Unique bank record row identifier." },
      { name: "bidder_profile_id", type: "UUID", isPk: false, isFk: true, isNullable: false, references: "bidder_profiles.id", description: "Associated bidder profile owner reference." },
      { name: "account_holder_name", type: "VARCHAR(150)", isPk: false, isFk: false, isNullable: false, description: "Official banking name recorded on passbook." },
      { name: "encrypted_account_number", type: "VARCHAR(255)", isPk: false, isFk: false, isNullable: false, description: "AES-256 GCM encrypted bank account digits." },
      { name: "ifsc_code", type: "VARCHAR(11)", isPk: false, isFk: false, isNullable: false, description: "11-digit bank branch system identification code." },
      { name: "bank_name", type: "VARCHAR(150)", isPk: false, isFk: false, isNullable: false, description: "Bank institution designation." },
      { name: "branch_name", type: "VARCHAR(150)", isPk: false, isFk: false, isNullable: false, description: "Branch office name." },
      { name: "is_verified", type: "BOOLEAN", isPk: false, isFk: false, isNullable: false, defaultVal: "FALSE", description: "Verified indicator via Penny Drop bank API." },
      { name: "penny_drop_transaction_id", type: "VARCHAR(100)", isPk: false, isFk: false, isNullable: true, description: "Transaction verification reference from payment clearing provider." }
    ],
    indexes: [
      { name: "idx_bank_accounts_profile", definition: "CREATE INDEX idx_bank_accounts_profile ON bank_accounts(bidder_profile_id) WHERE deleted_at IS NULL;", purpose: "Supports fast retrieval of linked banking records." }
    ],
    triggers: ["trg_bank_accounts_updated_at"]
  },
  {
    name: "kyc_documents",
    description: "Tracks physical document file assets uploaded by bidders.",
    designRationale: "Stores safe GCS/S3 reference paths, document hashes for content de-duplication, and current review status.",
    columns: [
      { name: "id", type: "UUID", isPk: true, isFk: false, isNullable: false, defaultVal: "gen_random_uuid()", description: "Unique document record identifier." },
      { name: "bidder_profile_id", type: "UUID", isPk: false, isFk: true, isNullable: false, references: "bidder_profiles.id", description: "Target profile owner reference." },
      { name: "document_type", type: "VARCHAR(50)", isPk: false, isFk: false, isNullable: false, description: "Category index (PAN_CARD, AADHAAR_FRONT, AADHAAR_BACK, etc)." },
      { name: "storage_path", type: "VARCHAR(512)", isPk: false, isFk: false, isNullable: false, description: "GCS/S3 secure object storage reference." },
      { name: "document_hash", type: "VARCHAR(64)", isPk: false, isFk: false, isNullable: false, description: "Secure SHA-256 digest file checksum." },
      { name: "verification_status", type: "VARCHAR(50)", isPk: false, isFk: false, isNullable: false, defaultVal: "'PENDING'", description: "Document status (PENDING, APPROVED, REJECTED)." },
      { name: "rejection_reason", type: "TEXT", isPk: false, isFk: false, isNullable: true, description: "Rejection explanation." }
    ],
    indexes: [
      { name: "idx_kyc_documents_profile", definition: "CREATE INDEX idx_kyc_documents_profile ON kyc_documents(bidder_profile_id) WHERE deleted_at IS NULL;", purpose: "Accelerates retrieval of profile documents." },
      { name: "idx_kyc_documents_active_hash", definition: "CREATE UNIQUE INDEX idx_kyc_documents_active_hash ON kyc_documents(document_hash) WHERE deleted_at IS NULL;", purpose: "Prevents uploading identical physical files." }
    ],
    triggers: ["trg_kyc_documents_updated_at"]
  },
  {
    name: "kyc_reviews",
    description: "Tracks physical review logs completed by administrators during kyc application vetting.",
    designRationale: "Detailed audit history storing full transition states, reviewer user details, and descriptive reviewer notes.",
    columns: [
      { name: "id", type: "UUID", isPk: true, isFk: false, isNullable: false, defaultVal: "gen_random_uuid()", description: "Unique review log identifier." },
      { name: "bidder_profile_id", type: "UUID", isPk: false, isFk: true, isNullable: false, references: "bidder_profiles.id", description: "Owner bidder profile reference." },
      { name: "reviewer_user_id", type: "UUID", isPk: false, isFk: true, isNullable: false, references: "users.id", description: "The administrative reviewer user." },
      { name: "previous_state", type: "VARCHAR(50)", isPk: false, isFk: false, isNullable: false, description: "Pre-review profile state." },
      { name: "new_state", type: "VARCHAR(50)", isPk: false, isFk: false, isNullable: false, description: "Post-review profile state." },
      { name: "decision", type: "VARCHAR(50)", isPk: false, isFk: false, isNullable: false, description: "Review decision (APPROVED, REJECTED)." },
      { name: "review_notes", type: "TEXT", isPk: false, isFk: false, isNullable: false, description: "Detailed audit review notes." },
      { name: "reviewed_at", type: "TIMESTAMPTZ", isPk: false, isFk: false, isNullable: false, defaultVal: "CURRENT_TIMESTAMP", description: "Action timestamp." }
    ],
    indexes: [
      { name: "idx_kyc_reviews_profile", definition: "CREATE INDEX idx_kyc_reviews_profile ON kyc_reviews(bidder_profile_id) WHERE deleted_at IS NULL;", purpose: "Accelerates retrieval of historical review actions." }
    ],
    triggers: ["trg_kyc_reviews_updated_at"]
  },
  {
    name: "bidder_state_history",
    description: "Records of every single state transition that occurred on the bidder's profile during onboarding.",
    designRationale: "Detailed historical trail tracking actors, state transitions, reasons, and timestamps to fulfill stringent regulatory audit requirements.",
    columns: [
      { name: "id", type: "UUID", isPk: true, isFk: false, isNullable: false, defaultVal: "gen_random_uuid()", description: "Transition record row identifier." },
      { name: "bidder_profile_id", type: "UUID", isPk: false, isFk: true, isNullable: false, references: "bidder_profiles.id", description: "Owner bidder profile reference." },
      { name: "from_state", type: "VARCHAR(50)", isPk: false, isFk: false, isNullable: false, description: "Origin state." },
      { name: "to_state", type: "VARCHAR(50)", isPk: false, isFk: false, isNullable: false, description: "Destination target state." },
      { name: "changed_by_user_id", type: "UUID", isPk: false, isFk: true, isNullable: false, references: "users.id", description: "The user actor driving the transition." },
      { name: "transition_reason", type: "TEXT", isPk: false, isFk: false, isNullable: true, description: "Reason explaining the change." },
      { name: "transitioned_at", type: "TIMESTAMPTZ", isPk: false, isFk: false, isNullable: false, defaultVal: "CURRENT_TIMESTAMP", description: "Transition timestamp." }
    ],
    indexes: [
      { name: "idx_state_history_profile", definition: "CREATE INDEX idx_state_history_profile ON bidder_state_history(bidder_profile_id) WHERE deleted_at IS NULL;", purpose: "Optimizes retrieval of profile state history." }
    ],
    triggers: ["trg_bidder_state_history_updated_at"]
  }
];

export const COMMON_SQL_QUERIES = [
  {
    title: "Retrieve User Roles and All Permissions",
    description: "Joins users to roles and permissions to quickly build a user security context upon successful login.",
    sql: `-- Fetch all unique action permission keys assigned to a physical User ID
SELECT DISTINCT p.name AS permission_name
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE u.id = 'YOUR-USER-UUID-HERE'
  AND u.is_active = TRUE
  AND u.deleted_at IS NULL
  AND r.deleted_at IS NULL
  AND p.deleted_at IS NULL;`
  },
  {
    title: "Safe Login with Email Case-Insensitivity",
    description: "Ensures lookup uniqueness in PostgreSQL 15 while handling potential leading/trailing trailing whitespaces or varying casing.",
    sql: `-- Secure validation filter for logins
SELECT id, email, password_hash, is_active
FROM users
WHERE LOWER(TRIM(email)) = LOWER(TRIM('User.Name@Domain.Com'))
  AND deleted_at IS NULL;`
  },
  {
    title: "Register New User (Preventing Inactive Duplicates)",
    description: "Inserts a new user safely, utilizing lowercase triggers. Since our UNIQUE INDEX handles LOWER(email) WHERE deleted_at IS NULL, PostgreSQL automatically blocks duplicates only if the existing owner is active.",
    sql: `-- Create user safely
INSERT INTO users (email, password_hash, first_name, last_name, user_type)
VALUES ('new.member@service.com', '$2b$12$SomeLongCryptographicPasswordHashValue', 'Jane', 'Doe', 'BIDDER')
RETURNING id, email, created_at;`
  },
  {
    title: "Rotate Refresh Token & Detect Replays",
    description: "An advanced, high-security transaction which rotates tokens, and records lineage to prevent cookie reuse.",
    sql: `-- 1. Revoke the old token after verification (or trigger family revocation if already revoked!)
UPDATE refresh_tokens
SET is_revoked = TRUE, updated_at = CURRENT_TIMESTAMP
WHERE id = 'OLD-TOKEN-ID'
  AND is_revoked = FALSE;

-- 2. Insert new token pointing back to parent (refreshed_from_id)
INSERT INTO refresh_tokens (user_id, token, expires_at, refreshed_from_id)
VALUES ('USER-UUID', 'NEW_RANDOM_SECURE_TOKEN_HASH', CURRENT_TIMESTAMP + INTERVAL '14 days', 'OLD-TOKEN-ID');`
  },
  {
    title: "Soft Delete a User Account",
    description: "Marks a user as deleted without purging their relational database data, preserving integrity for audit trails.",
    sql: `-- Set soft-delete timestamp
UPDATE users
SET deleted_at = CURRENT_TIMESTAMP, is_active = FALSE, updated_at = CURRENT_TIMESTAMP
WHERE id = 'TARGET-USER-UUID' 
  AND deleted_at IS NULL;`
  }
];
