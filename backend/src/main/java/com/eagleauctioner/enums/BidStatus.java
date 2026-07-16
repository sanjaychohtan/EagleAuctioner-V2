package com.eagleauctioner.enums;

/**
 * Represents the lifecycle status of a specific bid.
 */
public enum BidStatus {
    PLACED,     // Bid received but not necessarily the leader
    OUTBID,     // A higher bid has been placed
    WINNING,    // Currently the leading bid for the lot
    WITHDRAWN,  // Bid removed by bidder (if allowed)
    CANCELLED,  // Bid invalidated by admin
    REJECTED    // Bid failed validation rules
}
