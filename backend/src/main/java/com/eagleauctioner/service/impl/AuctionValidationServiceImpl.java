package com.eagleauctioner.service.impl;

import com.eagleauctioner.entity.Auction;
import com.eagleauctioner.entity.AuctionLot;
import com.eagleauctioner.enums.AuctionLotStatus;
import com.eagleauctioner.enums.AuctionState;
import com.eagleauctioner.service.AuctionValidationService;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class AuctionValidationServiceImpl implements AuctionValidationService {

    @Override
    public void validateForReview(Auction auction) {
        if (auction.getLots() == null || auction.getLots().isEmpty()) {
            throw new IllegalStateException("Auction cannot be submitted for review without any lots");
        }

        if (auction.getSettings() == null) {
            throw new IllegalStateException("Auction cannot be submitted for review without settings configured");
        }
    }

    @Override
    public void validateForPublish(Auction auction) {
        if (auction.getLots() == null || auction.getLots().isEmpty()) {
            throw new IllegalStateException("Auction cannot be published without any lots");
        }

        for (AuctionLot lot : auction.getLots()) {
            if (lot.getLotStatus() == AuctionLotStatus.DRAFT) {
                if (lot.getQuantity() == null || lot.getCurrency() == null || lot.getStartingPrice() == null || lot.getReservePrice() == null) {
                    throw new IllegalStateException("Cannot publish auction: All lots must have Quantity, Currency, Starting Price, and Reserve Price.");
                }
                lot.validateLotBusinessRules();
            }
        }
    }

    @Override
    public void validateStateTransition(AuctionState current, AuctionState target) {
        if (!current.canTransitionTo(target)) {
            throw new IllegalStateException("Invalid state transition from " + current + " to " + target);
        }
    }

    @Override
    public void validateSellerOwnership(Auction auction, UUID sellerProfileId, UUID userId) {
        if (auction.getSellerProfile() == null || !auction.getSellerProfile().getId().equals(sellerProfileId)) {
            throw new IllegalArgumentException("Seller profile does not own this auction");
        }

        if (auction.getSellerProfile().getUser() != null && !auction.getSellerProfile().getUser().getId().equals(userId)) {
            throw new org.springframework.security.access.AccessDeniedException("Ownership verification failed: User does not own the specified seller profile");
        }
    }
}
