package com.eagleauctioner.enums;

/**
 * Classification of real-time events triggered within an auction session.
 */
public enum AuctionEventType {
    AUCTION_CREATED,
    AUCTION_PUBLISHED,
    AUCTION_LIVE,
    AUCTION_PAUSED,
    AUCTION_RESUMED,
    AUCTION_CANCELLED,
    AUCTION_ENDED,
    BID_PLACED,
    BID_WITHDRAWN,
    LOT_STARTED,
    LOT_ENDED,
    WINNER_DECLARED,
    RESERVE_MET,
    AUTO_EXTENSION_TRIGGERED
}
