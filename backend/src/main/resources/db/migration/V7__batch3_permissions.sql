-- =============================================================================
-- EAGLE AUCTIONER BACKEND - BATCH 3 ENTERPRISE AUTHORIZATION PERMISSIONS (V7)
-- =============================================================================

INSERT INTO permissions (id, name, action_key, module, description, version) VALUES
(gen_random_uuid(), 'Create Support Ticket', 'support.ticket.create', 'SUPPORT', 'Ability to create support tickets', 0),
(gen_random_uuid(), 'View Support Ticket', 'support.ticket.view', 'SUPPORT', 'Ability to view support tickets and history', 0),
(gen_random_uuid(), 'Update Support Ticket', 'support.ticket.update', 'SUPPORT', 'Ability to assign, update, and escalate support tickets', 0),
(gen_random_uuid(), 'Close Support Ticket', 'support.ticket.close', 'SUPPORT', 'Ability to close, resolve, or reopen support tickets', 0),
(gen_random_uuid(), 'Resolve Dispute', 'support.dispute.resolve', 'SUPPORT', 'Ability to resolve customer disputes and claims', 0),
(gen_random_uuid(), 'View Notifications', 'notification.view', 'NOTIFICATION', 'Ability to view personal and system notifications', 0),
(gen_random_uuid(), 'Manage Notifications', 'notification.manage', 'NOTIFICATION', 'Ability to manage notification preferences and templates', 0),
(gen_random_uuid(), 'Broadcast Notifications', 'notification.broadcast', 'NOTIFICATION', 'Ability to trigger broadcast notifications and manage retry jobs', 0)
ON CONFLICT DO NOTHING;
