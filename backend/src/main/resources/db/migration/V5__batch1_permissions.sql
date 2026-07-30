-- =============================================================================
-- EAGLE AUCTIONER BACKEND - BATCH 1 ENTERPRISE AUTHORIZATION PERMISSIONS (V5)
-- =============================================================================

INSERT INTO permissions (id, name, action_key, module, description, version) VALUES
(gen_random_uuid(), 'Create Seller', 'seller.create', 'SELLER', 'Ability to register as a seller', 0),
(gen_random_uuid(), 'View Seller', 'seller.view', 'SELLER', 'Ability to search and view seller profiles', 0),
(gen_random_uuid(), 'Review Seller', 'seller.review', 'SELLER', 'Ability to review and approve seller onboarding requests', 0),
(gen_random_uuid(), 'Create Bidder', 'bidder.create', 'BUYER', 'Ability to register as a buyer/bidder', 0),
(gen_random_uuid(), 'View Bidder', 'bidder.view', 'BUYER', 'Ability to search and view buyer/bidder profiles', 0),
(gen_random_uuid(), 'Submit KYC', 'kyc.submit', 'KYC', 'Ability to submit KYC documents', 0)
ON CONFLICT DO NOTHING;
