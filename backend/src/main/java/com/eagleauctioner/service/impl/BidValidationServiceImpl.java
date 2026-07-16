package com.eagleauctioner.service.impl;

import com.eagleauctioner.entity.AuctionLot;
import com.eagleauctioner.entity.BidderProfile;
import com.eagleauctioner.entity.BidderAuthorization;
import com.eagleauctioner.enums.AuctionLotStatus;
import com.eagleauctioner.enums.AuctionState;
import com.eagleauctioner.enums.BidderState;
import com.eagleauctioner.repository.BidderAuthorizationRepository;
import com.eagleauctioner.service.BidValidationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BidValidationServiceImpl implements BidValidationService {

    private final BidderAuthorizationRepository bidderAuthorizationRepository;

    @Override
    public void validateBid(AuctionLot lot, BidderProfile bidder, Long bidAmount) {
        if (lot == null) {
            throw new IllegalArgumentException("Auction lot is required for validation");
        }
        if (bidder == null) {
            throw new IllegalArgumentException("Bidder profile is required for validation");
        }
        if (bidAmount == null) {
            throw new IllegalArgumentException("Bid amount is required");
        }
        
        // Overflow & Negative value defense
        if (bidAmount <= 0) {
            throw new IllegalArgumentException("Bid amount must be strictly positive");
        }
        if (bidAmount > 9999999999999999L) {
            throw new IllegalArgumentException("Bid amount exceeds maximum allowed threshold or scale");
        }

        // 1. Auction LIVE
        if (lot.getAuction() == null || lot.getAuction().getState() != AuctionState.LIVE) {
            throw new IllegalStateException("Auction is not in LIVE state");
        }
        
        // 2. Auction lot LIVE
        if (lot.getLotStatus() != AuctionLotStatus.LIVE) {
            throw new IllegalStateException("Auction lot is not in LIVE state");
        }
        
        // 3. Bidder APPROVED
        if (bidder.getState() != BidderState.APPROVED) {
            throw new IllegalStateException("Bidder is not in APPROVED state");
        }

        // 4. Bid amount validation against starting price and increment (General checks)
        // Specific logic for different auction types is handled in BidEngineService
    }

    @Override
    public void validateBidderAuthorization(UUID auctionId, UUID bidderProfileId) {
        bidderAuthorizationRepository.findByAuctionIdAndBidderProfileId(auctionId, bidderProfileId)
                .filter(BidderAuthorization::getIsAuthorized)
                .orElseThrow(() -> new IllegalArgumentException("Bidder is not authorized to participate in this auction"));
    }
}
