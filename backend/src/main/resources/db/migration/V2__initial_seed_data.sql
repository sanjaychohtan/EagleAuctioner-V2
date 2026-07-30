-- =============================================================================
-- EAGLE AUCTIONER BACKEND - SEED DATA BASELINE (V2)
-- =============================================================================

INSERT INTO roles (id, name, description, system_role) VALUES
('11111111-1111-1111-1111-111111111111', 'ROLE_SUPER_ADMIN', 'Super Administrator with full system control', TRUE),
('22222222-2222-2222-2222-222222222222', 'ROLE_ADMIN', 'Administrator with management access', TRUE),
('33333333-3333-3333-3333-333333333333', 'ROLE_SELLER', 'Registered Seller capable of publishing auctions', TRUE),
('44444444-4444-4444-4444-444444444444', 'ROLE_BIDDER', 'Registered Bidder capable of participating in auctions', TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO document_sequences (tenant_id, branch_code, year, region_code, document_type, next_value, version) VALUES 
('DEFAULT', 'MAIN', 2026, 'GLOBAL', 'SALE_CONFIRMATION', 1, 0),
('DEFAULT', 'MAIN', 2026, 'GLOBAL', 'PURCHASE_ORDER', 1, 0),
('DEFAULT', 'MAIN', 2026, 'GLOBAL', 'FEE_INVOICE', 1, 0),
('DEFAULT', 'MAIN', 2026, 'GLOBAL', 'GST_INVOICE', 1, 0),
('DEFAULT', 'MAIN', 2026, 'GLOBAL', 'CONTRACT', 1, 0)
ON CONFLICT DO NOTHING;
