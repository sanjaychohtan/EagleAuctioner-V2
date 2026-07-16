-- ==============================================================
-- Flyway Migration: V4__auction_core.sql
-- Module: Auction Core (Auctions, Settings, Lots & Events)
-- Target: PostgreSQL 15
-- ==============================================================

-- 1. Table: auctions
CREATE TABLE IF NOT EXISTS auctions (
    id UUID PRIMARY KEY,
    version BIGINT NOT NULL DEFAULT 0,
    auction_number VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description VARCHAR(2000),
    seller_profile_id UUID NOT NULL,
    state VARCHAR(50) NOT NULL,
    auction_type VARCHAR(50) NOT NULL,
    visibility VARCHAR(50) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    timezone VARCHAR(100) NOT NULL,
    registration_start TIMESTAMPTZ NOT NULL,
    registration_end TIMESTAMPTZ NOT NULL,
    inspection_start TIMESTAMPTZ,
    inspection_end TIMESTAMPTZ,
    auction_start TIMESTAMPTZ NOT NULL,
    auction_end TIMESTAMPTZ NOT NULL,
    reserve_price_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    auto_extension_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    extension_minutes INTEGER,
    
    -- Audit fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    
    CONSTRAINT fk_auctions_seller_profile FOREIGN KEY (seller_profile_id) REFERENCES seller_profiles (id) ON DELETE RESTRICT
);

-- Unique index to prevent duplicate auction numbers (soft delete compatible)
CREATE UNIQUE INDEX idx_auction_number_active 
ON auctions (LOWER(auction_number)) 
WHERE deleted_at IS NULL;

-- Query performance indexes
CREATE INDEX idx_auctions_seller_profile ON auctions (seller_profile_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_auctions_state ON auctions (state) WHERE deleted_at IS NULL;
CREATE INDEX idx_auctions_dates ON auctions (auction_start, auction_end) WHERE deleted_at IS NULL;
CREATE INDEX idx_auctions_registration_dates ON auctions (registration_start, registration_end) WHERE deleted_at IS NULL;

-- 2. Table: auction_settings
CREATE TABLE IF NOT EXISTS auction_settings (
    id UUID PRIMARY KEY,
    version BIGINT NOT NULL DEFAULT 0,
    auction_id UUID NOT NULL UNIQUE,
    anonymous_bidding BOOLEAN NOT NULL DEFAULT FALSE,
    allow_auto_extension BOOLEAN NOT NULL DEFAULT FALSE,
    extension_minutes INTEGER,
    max_extensions INTEGER,
    bid_increment_type VARCHAR(50),
    minimum_increment NUMERIC(18,2),
    reserve_price_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    allow_proxy_bid BOOLEAN NOT NULL DEFAULT FALSE,
    allow_manual_winner BOOLEAN NOT NULL DEFAULT FALSE,
    allow_seller_approval BOOLEAN NOT NULL DEFAULT FALSE,
    allow_bid_withdrawal BOOLEAN NOT NULL DEFAULT FALSE,
    allow_rank_display BOOLEAN NOT NULL DEFAULT FALSE,
    show_bidder_names BOOLEAN NOT NULL DEFAULT FALSE,
    registration_required BOOLEAN NOT NULL DEFAULT FALSE,
    emd_required BOOLEAN NOT NULL DEFAULT FALSE,
    timezone VARCHAR(100) NOT NULL,
    
    -- Audit fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    
    CONSTRAINT fk_auction_settings_auction FOREIGN KEY (auction_id) REFERENCES auctions (id) ON DELETE CASCADE
);

-- Index for settings lookup
CREATE INDEX idx_auction_settings_auction_id ON auction_settings (auction_id) WHERE deleted_at IS NULL;

-- 3. Table: auction_lots
CREATE TABLE IF NOT EXISTS auction_lots (
    id UUID PRIMARY KEY,
    version BIGINT NOT NULL DEFAULT 0,
    auction_id UUID NOT NULL,
    lot_number VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description VARCHAR(2000),
    material_category VARCHAR(100) NOT NULL,
    quantity NUMERIC(18,4) NOT NULL,
    unit_of_measure VARCHAR(20) NOT NULL,
    starting_price NUMERIC(18,2) NOT NULL,
    reserve_price NUMERIC(18,2),
    current_highest_bid NUMERIC(18,2),
    minimum_increment NUMERIC(18,2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    lot_status VARCHAR(50) NOT NULL,
    winner_bidder_id UUID,
    display_order INTEGER NOT NULL DEFAULT 0,
    
    -- Audit fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    
    CONSTRAINT fk_auction_lots_auction FOREIGN KEY (auction_id) REFERENCES auctions (id) ON DELETE CASCADE,
    CONSTRAINT fk_auction_lots_winner FOREIGN KEY (winner_bidder_id) REFERENCES bidder_profiles (id) ON DELETE SET NULL
);

-- Partial Unique Index to ensure unique lot numbers per auction (soft delete compatible)
CREATE UNIQUE INDEX idx_auction_lots_number_active 
ON auction_lots (auction_id, LOWER(lot_number)) 
WHERE deleted_at IS NULL;

-- Performance and retrieval indexes
CREATE INDEX idx_auction_lots_auction_id ON auction_lots (auction_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_auction_lots_status ON auction_lots (lot_status) WHERE deleted_at IS NULL;
CREATE INDEX idx_auction_lots_winner ON auction_lots (winner_bidder_id);

-- 4. Table: auction_events
CREATE TABLE IF NOT EXISTS auction_events (
    id UUID PRIMARY KEY,
    version BIGINT NOT NULL DEFAULT 0,
    auction_id UUID,
    lot_id UUID,
    event_type VARCHAR(50) NOT NULL,
    payload TEXT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    triggered_by VARCHAR(255),
    
    -- Audit fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ DEFAULT NULL
);

-- Indexes for event fetching
CREATE INDEX idx_auction_events_auction_id ON auction_events (auction_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_auction_events_lot_id ON auction_events (lot_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_auction_events_timestamp ON auction_events (timestamp ASC) WHERE deleted_at IS NULL;

-- 5. Table: auction_state_history
CREATE TABLE IF NOT EXISTS auction_state_history (
    id UUID PRIMARY KEY,
    version BIGINT NOT NULL DEFAULT 0,
    auction_id UUID NOT NULL,
    from_state VARCHAR(50) NOT NULL,
    to_state VARCHAR(50) NOT NULL,
    reason VARCHAR(1000),
    changed_by VARCHAR(255),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Audit fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    
    CONSTRAINT fk_state_history_auction FOREIGN KEY (auction_id) REFERENCES auctions (id) ON DELETE CASCADE
);

-- Indexes for state history
CREATE INDEX idx_state_history_auction_id ON auction_state_history (auction_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_state_history_timestamp ON auction_state_history (timestamp DESC) WHERE deleted_at IS NULL;

-- 6. Envers Audit Tables
CREATE TABLE IF NOT EXISTS auctions_aud (
    id UUID NOT NULL,
    rev INTEGER NOT NULL,
    revtype SMALLINT,
    auction_number VARCHAR(50),
    title VARCHAR(255),
    description VARCHAR(2000),
    seller_profile_id UUID,
    state VARCHAR(50),
    auction_type VARCHAR(50),
    visibility VARCHAR(50),
    currency VARCHAR(3),
    timezone VARCHAR(100),
    registration_start TIMESTAMPTZ,
    registration_end TIMESTAMPTZ,
    inspection_start TIMESTAMPTZ,
    inspection_end TIMESTAMPTZ,
    auction_start TIMESTAMPTZ,
    auction_end TIMESTAMPTZ,
    reserve_price_enabled BOOLEAN,
    auto_extension_enabled BOOLEAN,
    extension_minutes INTEGER,
    
    PRIMARY KEY (id, rev),
    CONSTRAINT fk_auctions_aud_revinfo FOREIGN KEY (rev) REFERENCES revinfo (rev)
);

CREATE TABLE IF NOT EXISTS auction_settings_aud (
    id UUID NOT NULL,
    rev INTEGER NOT NULL,
    revtype SMALLINT,
    auction_id UUID,
    anonymous_bidding BOOLEAN,
    allow_auto_extension BOOLEAN,
    extension_minutes INTEGER,
    max_extensions INTEGER,
    bid_increment_type VARCHAR(50),
    minimum_increment NUMERIC(18,2),
    reserve_price_enabled BOOLEAN,
    allow_proxy_bid BOOLEAN,
    allow_manual_winner BOOLEAN,
    allow_seller_approval BOOLEAN,
    allow_bid_withdrawal BOOLEAN,
    allow_rank_display BOOLEAN,
    show_bidder_names BOOLEAN,
    registration_required BOOLEAN,
    emd_required BOOLEAN,
    timezone VARCHAR(100),

    PRIMARY KEY (id, rev),
    CONSTRAINT fk_auction_settings_aud_revinfo FOREIGN KEY (rev) REFERENCES revinfo (rev)
);

CREATE TABLE IF NOT EXISTS auction_lots_aud (
    id UUID NOT NULL,
    rev INTEGER NOT NULL,
    revtype SMALLINT,
    auction_id UUID,
    lot_number VARCHAR(50),
    title VARCHAR(255),
    description VARCHAR(2000),
    material_category VARCHAR(100),
    quantity NUMERIC(18,4),
    unit_of_measure VARCHAR(20),
    starting_price NUMERIC(18,2),
    reserve_price NUMERIC(18,2),
    current_highest_bid NUMERIC(18,2),
    minimum_increment NUMERIC(18,2),
    currency VARCHAR(3),
    lot_status VARCHAR(50),
    winner_bidder_id UUID,
    display_order INTEGER,

    PRIMARY KEY (id, rev),
    CONSTRAINT fk_auction_lots_aud_revinfo FOREIGN KEY (rev) REFERENCES revinfo (rev)
);

CREATE TABLE IF NOT EXISTS auction_events_aud (
    id UUID NOT NULL,
    rev INTEGER NOT NULL,
    revtype SMALLINT,
    auction_id UUID,
    lot_id UUID,
    event_type VARCHAR(50),
    payload TEXT,
    timestamp TIMESTAMPTZ,
    triggered_by VARCHAR(255),

    PRIMARY KEY (id, rev),
    CONSTRAINT fk_auction_events_aud_revinfo FOREIGN KEY (rev) REFERENCES revinfo (rev)
);
