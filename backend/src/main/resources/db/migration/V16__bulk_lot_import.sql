-- ==============================================================
-- Flyway Migration: V16__bulk_lot_import.sql
-- Target: PostgreSQL 15
-- ==============================================================
CREATE TABLE IF NOT EXISTS bulk_import_jobs (
    id UUID PRIMARY KEY,
    file_hash VARCHAR(64) UNIQUE NOT NULL,
    status VARCHAR(50) NOT NULL,
    total_records INTEGER,
    processed_records INTEGER,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_bulk_import_file_hash ON bulk_import_jobs (file_hash);
