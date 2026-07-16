-- ==============================================================
-- Flyway Migration: V5__bidding_engine.sql
-- Module: Bidding Engine (Bids & Histories) Table & Index Definitions
-- Target: PostgreSQL 15
-- ==============================================================

-- 1. Table: bids
CREATE TABLE IF NOT EXISTS bids (
    id UUID PRIMARY KEY,
    version BIGINT NOT NULL DEFAULT 0,
    auction_lot_id UUID NOT NULL,
    bidder_id UUID NOT NULL,
    bid_amount NUMERIC(18,2) NOT NULL,
    bid_time TIMESTAMPTZ NOT NULL,
    bid_status VARCHAR(50) NOT NULL,
    anonymous_bidder_code VARCHAR(50),
    ip_address VARCHAR(45),
    user_agent VARCHAR(255),
    is_auto_bid BOOLEAN NOT NULL DEFAULT FALSE,
    auto_bid_limit NUMERIC(18,2),
    
    -- Audit fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    
    CONSTRAINT fk_bids_lot FOREIGN KEY (auction_lot_id) REFERENCES auction_lots (id) ON DELETE CASCADE,
    CONSTRAINT fk_bids_bidder FOREIGN KEY (bidder_id) REFERENCES bidder_profiles (id) ON DELETE RESTRICT
);

-- 1.5 Table: auction_bidder_authorizations
CREATE TABLE IF NOT EXISTS auction_bidder_authorizations (
    id UUID PRIMARY KEY,
    version BIGINT NOT NULL DEFAULT 0,
    auction_id UUID NOT NULL,
    bidder_id UUID NOT NULL,
    is_authorized BOOLEAN NOT NULL,
    authorization_reason VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    CONSTRAINT fk_auth_auction FOREIGN KEY (auction_id) REFERENCES auctions(id) ON DELETE CASCADE,
    CONSTRAINT fk_auth_bidder FOREIGN KEY (bidder_id) REFERENCES bidder_profiles(id) ON DELETE CASCADE,
    CONSTRAINT uq_auction_bidder UNIQUE (auction_id, bidder_id)
);

-- 2. Table: bid_histories
CREATE TABLE IF NOT EXISTS bid_histories (
    id UUID PRIMARY KEY,
    version BIGINT NOT NULL DEFAULT 0,
    auction_lot_id UUID NOT NULL,
    old_highest_bid NUMERIC(18,2),
    new_highest_bid NUMERIC(18,2) NOT NULL,
    winner_before_id UUID,
    winner_after_id UUID,
    timestamp TIMESTAMPTZ NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    
    -- Audit fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    
    CONSTRAINT fk_bid_histories_lot FOREIGN KEY (auction_lot_id) REFERENCES auction_lots (id) ON DELETE CASCADE,
    CONSTRAINT fk_bid_histories_winner_before FOREIGN KEY (winner_before_id) REFERENCES bidder_profiles (id) ON DELETE SET NULL,
    CONSTRAINT fk_bid_histories_winner_after FOREIGN KEY (winner_after_id) REFERENCES bidder_profiles (id) ON DELETE SET NULL
);

-- Soft delete compatible performance indexes
CREATE INDEX idx_bids_auction_lot_id ON bids (auction_lot_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_bids_bidder_id ON bids (bidder_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_bids_bid_time ON bids (bid_time DESC) WHERE deleted_at IS NULL;

-- Highest / Winning bid lookup performance indexes
CREATE UNIQUE INDEX idx_bids_winning_unique_per_lot 
ON bids (auction_lot_id) 
WHERE bid_status = 'WINNING' AND deleted_at IS NULL;

-- History indexes
CREATE INDEX idx_bid_histories_lot_id_timestamp ON bid_histories (auction_lot_id, timestamp DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_auth_bidder ON auction_bidder_authorizations (bidder_id);
CREATE INDEX IF NOT EXISTS idx_bid_histories_winner_before ON bid_histories (winner_before_id);
CREATE INDEX IF NOT EXISTS idx_bid_histories_winner_after ON bid_histories (winner_after_id);
