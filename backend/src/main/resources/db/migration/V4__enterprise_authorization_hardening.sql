-- =============================================================================
-- EAGLE AUCTIONER BACKEND - ENTERPRISE AUTHORIZATION HARDENING (V4)
-- =============================================================================

-- 1. Database-Driven Navigation & Menu Model
CREATE TABLE IF NOT EXISTS menus (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    label VARCHAR(100) NOT NULL,
    icon VARCHAR(50),
    path VARCHAR(100) NOT NULL,
    permission_key VARCHAR(100) NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    parent_id UUID REFERENCES menus(id) ON DELETE SET NULL,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ DEFAULT NULL
);

-- Seed Navigation Menus
INSERT INTO menus (id, code, label, icon, path, permission_key, display_order) VALUES
(gen_random_uuid(), 'MONITORING', 'Monitoring Telemetry', 'LayoutDashboard', '/monitoring', 'AUTH', 1),
(gen_random_uuid(), 'SCHEMA', 'PostgreSQL Schema', 'Database', '/schema', 'AUTH', 2),
(gen_random_uuid(), 'ROLE_STUDIO', 'Role & Access Studio', 'Shield', '/admin/roles', 'role.manage', 3),
(gen_random_uuid(), 'KYC_ONBOARDING', 'KYC Onboarding', 'UserCheck', '/onboarding', 'AUTH', 4),
(gen_random_uuid(), 'ADMIN_KYC', 'Admin KYC Queue', 'Layers', '/admin/kyc', 'kyc.review', 5),
(gen_random_uuid(), 'AUCTIONS', 'Live Auctions', 'TrendingUp', '/auctions', 'AUTH', 6),
(gen_random_uuid(), 'FINANCE_HUB', 'Finance Hub', 'FileSpreadsheet', '/finance', 'finance.wallet.view', 7)
ON CONFLICT (code) DO NOTHING;

-- 2. Approval Limits & Authority Matrix
CREATE TABLE IF NOT EXISTS approval_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    module VARCHAR(50) NOT NULL,
    max_approval_amount NUMERIC(19, 2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ DEFAULT NULL
);

-- 3. Delegated Approvals
CREATE TABLE IF NOT EXISTS delegated_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    delegator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    delegatee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    module VARCHAR(50),
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    reason VARCHAR(255),
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ DEFAULT NULL
);

-- 4. Attribute-Based Access Control (ABAC) Policy Engine Rules
CREATE TABLE IF NOT EXISTS policy_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_name VARCHAR(100) NOT NULL UNIQUE,
    action_key VARCHAR(100) NOT NULL,
    expression VARCHAR(500) NOT NULL,
    description VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ DEFAULT NULL
);

-- Seed Baseline Policy Rules
INSERT INTO policy_rules (id, rule_name, action_key, expression, description, is_active) VALUES
(gen_random_uuid(), 'WORKING_HOURS_CHECK', 'finance.wallet.approve', 'T(java.time.LocalTime).now().getHour() >= 8 && T(java.time.LocalTime).now().getHour() <= 22', 'Enforce business hours approval window', TRUE)
ON CONFLICT (rule_name) DO NOTHING;

-- 5. Enhanced Audit Log state capture
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS before_state TEXT;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS after_state TEXT;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS reason VARCHAR(500);
