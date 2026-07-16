package com.eagleauctioner.enums;

/**
 * Reasons for bid rejection during the validation phase.
 */
public enum BidRejectReason {
    BELOW_STARTING_PRICE,
    BELOW_MINIMUM_INCREMENT,
    INACTIVE_LOT,
    UNAPPROVED_BIDDER,
    EXPIRED,
    NOT_STARTED,
    OWN_LOT_BIDDING,
    DUPLICATE_BID,
    INSUFFICIENT_FUNDS
}
