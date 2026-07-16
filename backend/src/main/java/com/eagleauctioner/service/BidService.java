package com.eagleauctioner.service;

import com.eagleauctioner.entity.Bid;
import com.eagleauctioner.entity.BidHistory;
import com.eagleauctioner.dto.BidDTOs.*;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Primary interface for the bidding engine, coordinating validation, 
 * execution, and post-bid activities.
 */
public interface BidService {
    
    /**
     * Entry point for placing a bid on an auction lot.
     */
    Bid placeBid(UUID lotId, UUID bidderId, Long bidAmount, String ipAddress, String userAgent);
    
    /**
     * Retrieves the current leading bid for a lot.
     */
    Optional<Bid> findWinningBid(UUID lotId);
    
    /**
     * Retrieves the highest bid, considering privacy rules for sealed auctions.
     */
    Optional<Bid> findHighestBid(UUID lotId);
    
    /**
     * Returns the full bid history for a specific lot.
     */
    List<BidHistory> getBidHistory(UUID lotId);
    
    /**
     * Calculates the rank and status of a specific bidder on a lot.
     */
    RankStatusResponse getMyRank(UUID lotId, UUID bidderId);
    
    /**
     * Admin/Seller action to open and resolve winners for a sealed bid lot.
     */
    SealedBidOpeningResponse openSealedBids(UUID lotId, String actor);
}
