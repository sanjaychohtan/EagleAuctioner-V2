package com.eagleauctioner.service.impl;

import com.eagleauctioner.dto.AuctionDTOs.AuctionResponse;
import com.eagleauctioner.entity.Auction;
import com.eagleauctioner.entity.AuctionLot;
import com.eagleauctioner.enums.AuctionLotStatus;
import com.eagleauctioner.enums.AuctionState;
import com.eagleauctioner.repository.AuctionRepository;
import com.eagleauctioner.service.AuctionPublishService;
import com.eagleauctioner.service.AuctionService;
import com.eagleauctioner.service.AuctionValidationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuctionPublishServiceImpl implements AuctionPublishService {

    private final AuctionRepository auctionRepository;
    private final AuctionValidationService auctionValidationService;
    private final AuctionService auctionService;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public AuctionResponse publish(UUID auctionId, String publisherId) {
        log.info("Publishing auction ID: {} by {}", auctionId, publisherId);

        Auction auction = auctionRepository.findById(auctionId)
                .orElseThrow(() -> new IllegalArgumentException("Auction not found"));

        auctionValidationService.validateStateTransition(auction.getState(), AuctionState.PUBLISHED);
        auctionValidationService.validateForPublish(auction);

        for (AuctionLot lot : auction.getLots()) {
            if (lot.getLotStatus() == AuctionLotStatus.DRAFT) {
                lot.setLotStatus(AuctionLotStatus.READY);
            }
        }

        auction.setState(AuctionState.PUBLISHED);
        Auction saved = auctionRepository.save(auction);
        
        // This is a bit circular, but we need to map to response. 
        // Better to have the mapper in a separate component.
        // For now, I'll use the one in AuctionService if it was public, 
        // but I'll just use the existing logic.
        return auctionService.getAuctionDetails(saved.getId());
    }
}
