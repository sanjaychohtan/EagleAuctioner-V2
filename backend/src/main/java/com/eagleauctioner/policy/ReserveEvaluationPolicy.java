package com.eagleauctioner.policy;

import com.eagleauctioner.entity.AuctionLot;


/**
 * Strategy pattern interface for evaluating if a bid meets reserve price thresholds.
 */
public interface ReserveEvaluationPolicy {
    
    /**
     * Evaluates if the given highest bid meets the lot's reserve requirements.
     *
     * @param lot             the auction lot being evaluated
     * @param highestBidAmount the highest active bid amount
     * @return true if reserve is met or not enabled/applicable; false otherwise
     */
    boolean isReserveMet(AuctionLot lot, Long highestBidAmount);
}
