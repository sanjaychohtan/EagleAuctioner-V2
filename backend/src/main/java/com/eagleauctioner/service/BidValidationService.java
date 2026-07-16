package com.eagleauctioner.service;

import com.eagleauctioner.entity.AuctionLot;
import com.eagleauctioner.entity.BidderProfile;
import java.util.UUID;

/**
 * Service dedicated to strictly validating bidding rules before execution.
 */
public interface BidValidationService {
    
    /**
     * Validates whether a bid attempt satisfies all lot-level business rules.
     */
    void validateBid(AuctionLot lot, BidderProfile bidder, Long bidAmount);
    
    /**
     * Verifies if a bidder has the required authorization for a specific auction.
     */
    void validateBidderAuthorization(UUID auctionId, UUID bidderProfileId);
}
