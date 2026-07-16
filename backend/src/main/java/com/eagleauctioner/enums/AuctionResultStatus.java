package com.eagleauctioner.enums;

/**
 * Represents the final state of an individual lot bidding process.
 */
public enum AuctionResultStatus {
    COMPLETED,
    PENDING_APPROVAL,
    RESERVE_NOT_MET,
    NO_BIDS,
    CANCELLED
}
