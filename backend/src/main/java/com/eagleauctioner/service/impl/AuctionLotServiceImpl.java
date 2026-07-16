package com.eagleauctioner.service.impl;

import com.eagleauctioner.dto.AuctionDTOs.*;
import com.eagleauctioner.entity.Auction;
import com.eagleauctioner.entity.AuctionLot;
import com.eagleauctioner.enums.AuctionLotStatus;
import com.eagleauctioner.enums.AuctionState;
import com.eagleauctioner.repository.AuctionLotRepository;
import com.eagleauctioner.repository.AuctionRepository;
import com.eagleauctioner.service.AuctionLotService;
import com.eagleauctioner.service.AuctionValidationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuctionLotServiceImpl implements AuctionLotService {

    private final AuctionLotRepository auctionLotRepository;
    private final AuctionRepository auctionRepository;
    private final AuctionValidationService auctionValidationService;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public AuctionLotResponse createLot(UUID auctionId, CreateLotRequest request, UUID sellerProfileId, UUID userId) {
        log.info("Creating lot for auction: {}", auctionId);

        Auction auction = auctionRepository.findById(auctionId)
                .orElseThrow(() -> new IllegalArgumentException("Auction not found"));

        auctionValidationService.validateSellerOwnership(auction, sellerProfileId, userId);

        if (auction.getState() != AuctionState.DRAFT && auction.getState() != AuctionState.REJECTED) {
            throw new IllegalStateException("Lots can only be added to DRAFT or REJECTED auctions");
        }

        if (auctionLotRepository.existsByAuctionIdAndLotNumber(auctionId, request.getLotNumber())) {
            throw new IllegalArgumentException("Lot number already exists in this auction: " + request.getLotNumber());
        }

        AuctionLot lot = AuctionLot.builder()
                .auction(auction)
                .lotNumber(request.getLotNumber())
                .title(request.getTitle())
                .description(request.getDescription())
                .materialCategory(request.getMaterialCategory())
                .quantity(request.getQuantity() != null ? java.math.BigDecimal.valueOf(request.getQuantity()) : null)
                .unitOfMeasure(request.getUnitOfMeasure())
                .startingPrice(request.getStartingPrice())
                .reservePrice(request.getReservePrice())
                .minimumIncrement(request.getMinimumIncrement())
                .currency(request.getCurrency())
                .lotStatus(AuctionLotStatus.DRAFT)
                .displayOrder(request.getDisplayOrder() != null ? request.getDisplayOrder() : 0)
                .build();

        lot.validateLotBusinessRules();
        AuctionLot saved = auctionLotRepository.save(lot);

        return mapToResponse(saved);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public AuctionLotResponse updateLot(UUID lotId, UpdateLotRequest request, UUID sellerProfileId, UUID userId) {
        log.info("Updating lot ID: {}", lotId);

        AuctionLot lot = auctionLotRepository.findById(lotId)
                .orElseThrow(() -> new IllegalArgumentException("Lot not found"));

        auctionValidationService.validateSellerOwnership(lot.getAuction(), sellerProfileId, userId);

        if (lot.getLotStatus() != AuctionLotStatus.DRAFT) {
            throw new IllegalStateException("Only draft lots can be updated");
        }

        lot.setLotNumber(request.getLotNumber());
        lot.setTitle(request.getTitle());
        lot.setDescription(request.getDescription());
        lot.setMaterialCategory(request.getMaterialCategory());
        lot.setQuantity(request.getQuantity() != null ? java.math.BigDecimal.valueOf(request.getQuantity()) : null);
        lot.setUnitOfMeasure(request.getUnitOfMeasure());
        lot.setStartingPrice(request.getStartingPrice());
        lot.setReservePrice(request.getReservePrice());
        lot.setMinimumIncrement(request.getMinimumIncrement());
        lot.setCurrency(request.getCurrency());
        lot.setDisplayOrder(request.getDisplayOrder() != null ? request.getDisplayOrder() : lot.getDisplayOrder());

        lot.validateLotBusinessRules();
        AuctionLot updated = auctionLotRepository.save(lot);

        return mapToResponse(updated);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteDraftLot(UUID lotId, UUID sellerProfileId, UUID userId) {
        log.info("Deleting draft lot ID: {}", lotId);

        AuctionLot lot = auctionLotRepository.findById(lotId)
                .orElseThrow(() -> new IllegalArgumentException("Lot not found"));

        auctionValidationService.validateSellerOwnership(lot.getAuction(), sellerProfileId, userId);

        if (lot.getLotStatus() != AuctionLotStatus.DRAFT) {
            throw new IllegalStateException("Only draft lots can be deleted");
        }

        auctionLotRepository.delete(lot);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public AuctionLotResponse publishLot(UUID lotId, UUID sellerProfileId, UUID userId) {
        log.info("Publishing lot ID: {}", lotId);

        AuctionLot lot = auctionLotRepository.findById(lotId)
                .orElseThrow(() -> new IllegalArgumentException("Lot not found"));

        auctionValidationService.validateSellerOwnership(lot.getAuction(), sellerProfileId, userId);

        if (lot.getLotStatus() != AuctionLotStatus.DRAFT) {
            throw new IllegalStateException("Only draft lots can be published");
        }

        lot.validateLotBusinessRules();
        lot.setLotStatus(AuctionLotStatus.READY);
        AuctionLot saved = auctionLotRepository.save(lot);

        return mapToResponse(saved);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void sortLots(UUID auctionId, LotSortRequest request, UUID sellerProfileId, UUID userId) {
        log.info("Sorting lots for auction: {}", auctionId);

        Auction auction = auctionRepository.findById(auctionId)
                .orElseThrow(() -> new IllegalArgumentException("Auction not found"));

        auctionValidationService.validateSellerOwnership(auction, sellerProfileId, userId);

        int order = 0;
        for (UUID lotId : request.getSortedLotIds()) {
            AuctionLot lot = auctionLotRepository.findById(lotId)
                    .orElseThrow(() -> new IllegalArgumentException("Lot not found with ID: " + lotId));
            if (!lot.getAuction().getId().equals(auctionId)) {
                throw new IllegalArgumentException("Lot " + lotId + " does not belong to auction " + auctionId);
            }
            lot.setDisplayOrder(order++);
            auctionLotRepository.save(lot);
        }
    }

    private AuctionLotResponse mapToResponse(AuctionLot lot) {
        return AuctionLotResponse.builder()
                .id(lot.getId())
                .auctionId(lot.getAuction().getId())
                .lotNumber(lot.getLotNumber())
                .title(lot.getTitle())
                .description(lot.getDescription())
                .materialCategory(lot.getMaterialCategory())
                .quantity(lot.getQuantity() != null ? lot.getQuantity().longValue() : null)
                .unitOfMeasure(lot.getUnitOfMeasure())
                .startingPrice(lot.getStartingPrice())
                .reservePrice(lot.getReservePrice())
                .currentHighestBid(lot.getCurrentHighestBid())
                .minimumIncrement(lot.getMinimumIncrement())
                .currency(lot.getCurrency())
                .lotStatus(lot.getLotStatus())
                .winnerBidderId(lot.getWinnerBidder() != null ? lot.getWinnerBidder().getId() : null)
                .displayOrder(lot.getDisplayOrder())
                .build();
    }
}
