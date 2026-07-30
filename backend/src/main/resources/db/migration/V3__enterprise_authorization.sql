-- =============================================================================
-- EAGLE AUCTIONER BACKEND - ENTERPRISE AUTHORIZATION SCHEMA (V3)
-- =============================================================================

-- 1. Create departments table
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    parent_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ DEFAULT NULL
);

-- Index for parent lookup
CREATE INDEX IF NOT EXISTS idx_departments_parent_id ON departments(parent_id);

-- 2. Alter permissions table to support action keys
ALTER TABLE permissions ADD COLUMN IF NOT EXISTS action_key VARCHAR(100);

-- Update existing permission action_keys if null
UPDATE permissions SET action_key = LOWER(name) WHERE action_key IS NULL;

-- 3. Create data_scopes table for hierarchical authorization
CREATE TABLE IF NOT EXISTS data_scopes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scope_type VARCHAR(50) NOT NULL,
    scope_value_id UUID,
    name VARCHAR(100) NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_data_scopes_user_id ON data_scopes(user_id);
CREATE INDEX IF NOT EXISTS idx_data_scopes_role_id ON data_scopes(role_id);
CREATE INDEX IF NOT EXISTS idx_data_scopes_type ON data_scopes(scope_type);

-- 4. Alter users table to support department link
ALTER TABLE users ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id) ON DELETE SET NULL;

-- 5. Seed Enterprise Action Permissions
INSERT INTO permissions (id, name, action_key, module, description, version) VALUES
(gen_random_uuid(), 'Create Auction', 'auction.create', 'AUCTION', 'Ability to create new auctions', 0),
(gen_random_uuid(), 'Edit Auction', 'auction.edit', 'AUCTION', 'Ability to edit existing auctions', 0),
(gen_random_uuid(), 'Publish Auction', 'auction.publish', 'AUCTION', 'Ability to publish draft auctions', 0),
(gen_random_uuid(), 'Cancel Auction', 'auction.cancel', 'AUCTION', 'Ability to cancel active auctions', 0),
(gen_random_uuid(), 'View Wallet', 'finance.wallet.view', 'FINANCE', 'Ability to view financial wallet balances', 0),
(gen_random_uuid(), 'Approve Wallet Transaction', 'finance.wallet.approve', 'FINANCE', 'Ability to approve wallet transactions', 0),
(gen_random_uuid(), 'Export Reports', 'reports.export', 'REPORTING', 'Ability to export analytics and operational reports', 0),
(gen_random_uuid(), 'Disable User', 'user.disable', 'USER_MANAGEMENT', 'Ability to lock or disable user accounts', 0),
(gen_random_uuid(), 'Manage Roles', 'role.manage', 'ROLE_MANAGEMENT', 'Ability to create, update, and assign roles', 0),
(gen_random_uuid(), 'Review KYC', 'kyc.review', 'KYC', 'Ability to approve or reject KYC onboarding applications', 0)
ON CONFLICT DO NOTHING;

-- 6. Seed Enterprise Default Roles
INSERT INTO roles (id, name, description, system_role, version) VALUES
('55555555-5555-5555-5555-555555555555', 'ROLE_OPS_HEAD', 'Head of Operations overseeing all auction lifecycles', TRUE, 0),
('66666666-6666-6666-6666-666666666666', 'ROLE_FINANCE', 'Finance Lead managing ledgers and settlements', TRUE, 0),
('77777777-7777-7777-7777-777777777777', 'ROLE_KYC', 'KYC Verification Officer', TRUE, 0),
('88888888-8888-8888-8888-888888888888', 'ROLE_MARKETING', 'Marketing Specialist managing campaigns', TRUE, 0),
('99999999-9999-9999-9999-999999999999', 'ROLE_SUPPORT', 'Customer Support Representative', TRUE, 0),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'ROLE_AUCTION', 'Auction Operator', TRUE, 0),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'ROLE_REPORTS', 'Reports & Business Intelligence Analyst', TRUE, 0),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'ROLE_COMPLIANCE', 'Compliance & Risk Officer', TRUE, 0),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'ROLE_LEGAL', 'Legal & Contracts Officer', TRUE, 0),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'ROLE_IT', 'IT Systems Administrator', TRUE, 0)
ON CONFLICT (id) DO NOTHING;
