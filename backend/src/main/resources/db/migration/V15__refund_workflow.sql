-- ==============================================================
-- Flyway Migration: V15__refund_workflow.sql
-- Target: PostgreSQL 15
-- ==============================================================
CREATE TABLE IF NOT EXISTS refunds (
    id UUID PRIMARY KEY,
    amount BIGINT NOT NULL,
    initiator_id UUID NOT NULL,
    first_approver_id UUID,
    second_approver_id UUID,
    status VARCHAR(50) NOT NULL,
    rejection_reason VARCHAR(255),
    audit_log TEXT,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ
);
