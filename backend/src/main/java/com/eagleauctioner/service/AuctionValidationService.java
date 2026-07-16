package com.eagleauctioner.service;

import com.eagleauctioner.entity.Auction;
import com.eagleauctioner.enums.AuctionState;
import java.util.UUID;

/**
 * Service for handling complex domain validations for Auctions.
 */
public interface AuctionValidationService {
    void validateForReview(Auction auction);
    void validateForPublish(Auction auction);
    void validateStateTransition(AuctionState current, AuctionState target);
    void validateSellerOwnership(Auction auction, UUID sellerProfileId, UUID userId);
}
