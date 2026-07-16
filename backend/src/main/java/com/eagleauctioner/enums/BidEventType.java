package com.eagleauctioner.enums;

/**
 * Event types for the bidding history and audit log.
 */
public enum BidEventType {
    BID_PLACED,
    BID_OUTBID,
    BID_WINNING,
    BID_WITHDRAWN,
    BID_CANCELLED,
    BID_REJECTED,
    AUTO_EXTENSION_TRIGGERED
}
