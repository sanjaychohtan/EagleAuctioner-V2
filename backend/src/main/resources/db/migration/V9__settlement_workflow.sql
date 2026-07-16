-- ==============================================================
-- Flyway Migration: V9__settlement_workflow.sql
-- Module: Settlement Workflow and History (Phase 7 - Part 2)
-- Target: PostgreSQL 15
-- ==============================================================

-- 1. Alter settlements table to add workflow completion and cancellation metadata
ALTER TABLE settlements ADD COLUMN IF NOT EXISTS completed_by VARCHAR(255) NULL;
ALTER TABLE settlements ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE NULL;
ALTER TABLE settlements ADD COLUMN IF NOT EXISTS completion_remarks TEXT NULL;

ALTER TABLE settlements ADD COLUMN IF NOT EXISTS cancelled_by VARCHAR(255) NULL;
ALTER TABLE settlements ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE NULL;
ALTER TABLE settlements ADD COLUMN IF NOT EXISTS cancellation_reason TEXT NULL;

-- 2. Alter settlements_aud table to match the new auditing fields
ALTER TABLE settlements_aud ADD COLUMN IF NOT EXISTS completed_by VARCHAR(255) NULL;
ALTER TABLE settlements_aud ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE NULL;
ALTER TABLE settlements_aud ADD COLUMN IF NOT EXISTS completion_remarks TEXT NULL;

ALTER TABLE settlements_aud ADD COLUMN IF NOT EXISTS cancelled_by VARCHAR(255) NULL;
ALTER TABLE settlements_aud ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE NULL;
ALTER TABLE settlements_aud ADD COLUMN IF NOT EXISTS cancellation_reason TEXT NULL;

-- 3. Table: settlement_histories (immutable workflow event log)
CREATE TABLE IF NOT EXISTS settlement_histories (
    id UUID PRIMARY KEY,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    settlement_id UUID NOT NULL,
    actor VARCHAR(255) NOT NULL,
    action_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    previous_status VARCHAR(50) NULL,
    current_status VARCHAR(50) NOT NULL,
    reason VARCHAR(1000) NULL,
    remarks TEXT NULL,
    correlation_id VARCHAR(255) NULL,
    request_source VARCHAR(255) NULL,
    ip_address VARCHAR(50) NULL,
    CONSTRAINT fk_settlement_histories_settlement FOREIGN KEY (settlement_id) REFERENCES settlements(id) ON DELETE CASCADE
);

-- 4. Indexes for optimized chronological workflow timeline querying
CREATE INDEX IF NOT EXISTS idx_settlement_histories_settlement ON settlement_histories(settlement_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_settlement_histories_timestamp ON settlement_histories(action_timestamp);

-- 5. Envers Auditing Table for settlement_histories
CREATE TABLE IF NOT EXISTS settlement_histories_aud (
    id UUID NOT NULL,
    rev INTEGER NOT NULL,
    revtype SMALLINT,
    settlement_id UUID,
    actor VARCHAR(255),
    action_timestamp TIMESTAMP WITH TIME ZONE,
    previous_status VARCHAR(50),
    current_status VARCHAR(50),
    reason VARCHAR(1000),
    remarks TEXT,
    correlation_id VARCHAR(255),
    request_source VARCHAR(255),
    ip_address VARCHAR(50),
    PRIMARY KEY (id, rev),
    CONSTRAINT fk_settlement_histories_aud_revinfo FOREIGN KEY (rev) REFERENCES revinfo (rev)
);

CREATE INDEX IF NOT EXISTS idx_settlement_histories_aud_rev ON settlement_histories_aud (rev);
