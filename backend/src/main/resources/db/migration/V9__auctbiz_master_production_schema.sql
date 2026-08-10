-- AUCTBIZ Master Production Schema Enhancements
-- Adds fields for Temporary/Permanent Customer IDs, Bidder IDs, Seller Codes, Account Types, Payment tracking, and structured Document Metadata

ALTER TABLE bidder_profiles
    ADD COLUMN IF NOT EXISTS temp_customer_id VARCHAR(50) UNIQUE,
    ADD COLUMN IF NOT EXISTS permanent_customer_id VARCHAR(50) UNIQUE,
    ADD COLUMN IF NOT EXISTS bidder_id VARCHAR(50) UNIQUE,
    ADD COLUMN IF NOT EXISTS account_type VARCHAR(50),
    ADD COLUMN IF NOT EXISTS state_name VARCHAR(100),
    ADD COLUMN IF NOT EXISTS city_name VARCHAR(100),
    ADD COLUMN IF NOT EXISTS plan_type VARCHAR(50) DEFAULT 'FREE',
    ADD COLUMN IF NOT EXISTS payment_amount DECIMAL(15,2),
    ADD COLUMN IF NOT EXISTS payment_date TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(100),
    ADD COLUMN IF NOT EXISTS payment_mode VARCHAR(50),
    ADD COLUMN IF NOT EXISTS payment_proof_url TEXT,
    ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'NOT_REQUIRED';

ALTER TABLE seller_profiles
    ADD COLUMN IF NOT EXISTS seller_code VARCHAR(50) UNIQUE,
    ADD COLUMN IF NOT EXISTS temp_seller_id VARCHAR(50) UNIQUE;

ALTER TABLE kyc_documents
    ADD COLUMN IF NOT EXISTS document_number VARCHAR(100),
    ADD COLUMN IF NOT EXISTS uploaded_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS verified_by UUID,
    ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS action_required_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_bidder_temp_cust_id ON bidder_profiles(temp_customer_id);
CREATE INDEX IF NOT EXISTS idx_bidder_perm_cust_id ON bidder_profiles(permanent_customer_id);
CREATE INDEX IF NOT EXISTS idx_bidder_bidder_id ON bidder_profiles(bidder_id);
CREATE INDEX IF NOT EXISTS idx_seller_code ON seller_profiles(seller_code);
CREATE INDEX IF NOT EXISTS idx_auctions_seller_profile_id ON auctions(seller_profile_id);
