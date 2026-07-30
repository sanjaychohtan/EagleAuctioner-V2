-- =============================================================================
-- EAGLE AUCTIONER BACKEND - BATCH 2 ENTERPRISE AUTHORIZATION PERMISSIONS (V6)
-- =============================================================================

INSERT INTO permissions (id, name, action_key, module, description, version) VALUES
(gen_random_uuid(), 'Manage Ledger', 'finance.ledger.manage', 'FINANCE', 'Ability to add manual ledger entries', 0),
(gen_random_uuid(), 'View Ledger', 'finance.ledger.view', 'FINANCE', 'Ability to view ledger entries', 0),
(gen_random_uuid(), 'View Payment', 'payment.view', 'FINANCE', 'Ability to view payment receipts and allocation records', 0),
(gen_random_uuid(), 'Record Payment', 'payment.create', 'FINANCE', 'Ability to record payments against settlements', 0),
(gen_random_uuid(), 'View Settlement', 'settlement.view', 'SETTLEMENT', 'Ability to view settlements and contract settlement status', 0),
(gen_random_uuid(), 'Create Settlement', 'settlement.create', 'SETTLEMENT', 'Ability to generate settlements for accepted contracts', 0),
(gen_random_uuid(), 'Approve Settlement', 'settlement.approve', 'SETTLEMENT', 'Ability to approve, complete, and transition settlements', 0),
(gen_random_uuid(), 'Cancel Settlement', 'settlement.cancel', 'SETTLEMENT', 'Ability to reject or cancel settlements', 0),
(gen_random_uuid(), 'Initiate Refund', 'refund.create', 'FINANCE', 'Ability to initiate refund requests', 0),
(gen_random_uuid(), 'Approve Refund', 'refund.approve', 'FINANCE', 'Ability to approve or reject refund requests', 0),
(gen_random_uuid(), 'Perform Reconciliation', 'reconciliation.perform', 'FINANCE', 'Ability to perform bank and settlement reconciliations', 0),
(gen_random_uuid(), 'Manage Financial Closing', 'financial.closing.manage', 'FINANCE', 'Ability to initiate and close accounting periods', 0),
(gen_random_uuid(), 'View Invoice', 'invoice.view', 'FINANCE', 'Ability to view fee and GST invoices', 0),
(gen_random_uuid(), 'Pay Invoice', 'invoice.pay', 'FINANCE', 'Ability to pay platform fee invoices', 0),
(gen_random_uuid(), 'Generate GST Invoice', 'invoice.create', 'FINANCE', 'Ability to generate GST tax invoices', 0)
ON CONFLICT DO NOTHING;
