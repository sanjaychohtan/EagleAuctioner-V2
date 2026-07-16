package com.eagleauctioner.enums;

/**
 * Statuses of the Settlement Core Engine.
 */
public enum SettlementStatus {
    DRAFT,
    PENDING_APPROVAL,
    APPROVED,
    PAYMENT_PENDING,
    PAYMENT_RECEIVED,
    COMPLETED,
    REJECTED,
    CANCELLED
}
