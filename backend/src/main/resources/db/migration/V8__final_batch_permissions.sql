-- =============================================================================
-- EAGLE AUCTIONER BACKEND - FINAL BATCH ENTERPRISE AUTHORIZATION PERMISSIONS (V8)
-- =============================================================================

INSERT INTO permissions (id, name, action_key, module, description, version) VALUES
(gen_random_uuid(), 'View Dashboard', 'dashboard.view', 'REPORTING', 'Ability to view executive, operations, and departmental dashboards', 0),
(gen_random_uuid(), 'Admin Dashboard', 'dashboard.admin', 'REPORTING', 'Ability to view admin metrics and invalidate analytics cache', 0),
(gen_random_uuid(), 'Override Winner', 'winner.override', 'AUCTION', 'Ability to perform manual winner overrides on auction lots', 0),
(gen_random_uuid(), 'Manage Feature Flags', 'system.feature_flags.manage', 'SYSTEM', 'Ability to update feature flags and runtime toggles', 0),
(gen_random_uuid(), 'Manage System Config', 'system.config.manage', 'SYSTEM', 'Ability to manage system financial configurations and global settings', 0),
(gen_random_uuid(), 'View Audit Logs', 'audit.view', 'SYSTEM', 'Ability to view user and entity audit trails and system health logs', 0),
(gen_random_uuid(), 'Admin Access', 'admin.access', 'SYSTEM', 'Ability to access admin console and executive management tools', 0)
ON CONFLICT DO NOTHING;
