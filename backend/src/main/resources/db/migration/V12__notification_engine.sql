-- ==============================================================
-- Flyway Migration: V12__notification_engine.sql
-- Module: Notification & Document Engine
-- Target: PostgreSQL 15
-- ==============================================================

CREATE TABLE IF NOT EXISTS notification_templates (
    id UUID PRIMARY KEY,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    name VARCHAR(100) NOT NULL,
    template_version INTEGER NOT NULL DEFAULT 1,
    effective_from TIMESTAMP WITH TIME ZONE,
    effective_to TIMESTAMP WITH TIME ZONE,
    notification_type VARCHAR(50) NOT NULL,
    channel VARCHAR(50) NOT NULL,
    subject_template VARCHAR(255),
    body_template TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    UNIQUE (name, template_version)
);

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    user_id UUID NOT NULL,
    channel VARCHAR(50) NOT NULL,
    priority VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    notification_type VARCHAR(50) NOT NULL,
    template_version INTEGER,
    title VARCHAR(200),
    body TEXT NOT NULL,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    archived_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    user_id UUID NOT NULL,
    channel VARCHAR(50) NOT NULL,
    notification_type VARCHAR(50) NOT NULL,
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    UNIQUE (user_id, channel, notification_type)
);

CREATE TABLE IF NOT EXISTS notification_deliveries (
    id UUID PRIMARY KEY,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    notification_id UUID NOT NULL,
    channel VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    provider_name VARCHAR(100),
    tracking_id VARCHAR(255),
    error_code VARCHAR(100),
    error_message TEXT,
    retry_count INTEGER NOT NULL DEFAULT 0,
    next_retry_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT fk_notification_delivery_notif FOREIGN KEY (notification_id) REFERENCES notifications(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_notif_pref_user ON notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_notif_delivery_notif ON notification_deliveries(notification_id);

-- Envers Auditing Tables
CREATE TABLE IF NOT EXISTS notification_templates_aud (
    id UUID NOT NULL,
    rev INTEGER NOT NULL,
    revtype SMALLINT,
    name VARCHAR(100),
    template_version INTEGER,
    effective_from TIMESTAMP WITH TIME ZONE,
    effective_to TIMESTAMP WITH TIME ZONE,
    notification_type VARCHAR(50),
    channel VARCHAR(50),
    subject_template VARCHAR(255),
    body_template TEXT,
    is_active BOOLEAN,
    PRIMARY KEY (id, rev),
    CONSTRAINT fk_notif_templates_aud_revinfo FOREIGN KEY (rev) REFERENCES revinfo (rev)
);

CREATE TABLE IF NOT EXISTS notifications_aud (
    id UUID NOT NULL,
    rev INTEGER NOT NULL,
    revtype SMALLINT,
    user_id UUID,
    channel VARCHAR(50),
    priority VARCHAR(50),
    status VARCHAR(50),
    notification_type VARCHAR(50),
    template_version INTEGER,
    title VARCHAR(200),
    body TEXT,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    archived_at TIMESTAMP WITH TIME ZONE,
    PRIMARY KEY (id, rev),
    CONSTRAINT fk_notifications_aud_revinfo FOREIGN KEY (rev) REFERENCES revinfo (rev)
);

CREATE TABLE IF NOT EXISTS notification_preferences_aud (
    id UUID NOT NULL,
    rev INTEGER NOT NULL,
    revtype SMALLINT,
    user_id UUID,
    channel VARCHAR(50),
    notification_type VARCHAR(50),
    is_enabled BOOLEAN,
    PRIMARY KEY (id, rev),
    CONSTRAINT fk_notif_preferences_aud_revinfo FOREIGN KEY (rev) REFERENCES revinfo (rev)
);

CREATE TABLE IF NOT EXISTS notification_deliveries_aud (
    id UUID NOT NULL,
    rev INTEGER NOT NULL,
    revtype SMALLINT,
    notification_id UUID,
    channel VARCHAR(50),
    status VARCHAR(50),
    provider_name VARCHAR(100),
    tracking_id VARCHAR(255),
    error_code VARCHAR(100),
    error_message TEXT,
    retry_count INTEGER,
    next_retry_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    PRIMARY KEY (id, rev),
    CONSTRAINT fk_notif_deliveries_aud_revinfo FOREIGN KEY (rev) REFERENCES revinfo (rev)
);
