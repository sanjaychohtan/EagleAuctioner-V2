package com.eagleauctioner.policy;

import com.eagleauctioner.entity.AuctionLot;
import org.springframework.stereotype.Component;


/**
 * Standard implementation of the ReserveEvaluationPolicy.
 * Enforces reserve requirements when reservePriceEnabled is true on the parent auction.
 */
@Component
public class StandardReserveEvaluationPolicy implements ReserveEvaluationPolicy {

    @Override
    public boolean isReserveMet(AuctionLot lot, Long highestBidAmount) {
        if (lot == null) {
            throw new IllegalArgumentException("Lot cannot be null during reserve evaluation");
        }
        
        boolean reservePriceEnabled = lot.getAuction() != null && lot.getAuction().isReservePriceEnabled();

        if (!reservePriceEnabled) {
            return true;
        }

        Long reservePrice = lot.getReservePrice();
        if (reservePrice == null) {
            return true; // No reserve price specified, so it is met
        }

        return highestBidAmount != null && highestBidAmount.compareTo(reservePrice) >= 0;
    }
}
