package com.eagleauctioner.service;

import com.eagleauctioner.entity.Bid;
import com.eagleauctioner.entity.AuctionLot;
import com.eagleauctioner.entity.BidderProfile;

/**
 * Core engine service handling specialized bidding logic for different auction types.
 */
public interface BidEngineService {
    
    /**
     * Processes a standard English (Forward) bid with proxy support.
     */
    Bid processForwardBid(AuctionLot lot, BidderProfile bidder, Long bidAmount, String ipAddress, String userAgent);
    
    /**
     * Processes a Reverse auction bid.
     */
    Bid processReverseBid(AuctionLot lot, BidderProfile bidder, Long bidAmount, String ipAddress, String userAgent);
    
    /**
     * Processes a Sealed bid submission.
     */
    Bid processSealedBid(AuctionLot lot, BidderProfile bidder, Long bidAmount, String ipAddress, String userAgent);
}
