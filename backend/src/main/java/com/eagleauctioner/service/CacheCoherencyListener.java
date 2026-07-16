package com.eagleauctioner.service;

import com.eagleauctioner.event.CacheCoherencyEvents.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.stereotype.Component;

@Component
@Slf4j
@RequiredArgsConstructor
public class CacheCoherencyListener {

    private final RedisService redisService;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @CacheEvict(value = "highestBid", key = "#event.lotId")
    public void handleBidUpdate(BidUpdatedEvent event) {
        log.info("Transactional Event: Evicting highest bid cache for lot: {}", event.getLotId());
        redisService.evictHighestBid(event.getLotId());
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @CacheEvict(value = "remainingTime", key = "#event.auctionId")
    public void handleAuctionUpdate(AuctionUpdatedEvent event) {
        log.info("Transactional Event: Evicting remaining time cache for auction: {}", event.getAuctionId());
        redisService.evictRemainingTime(event.getAuctionId());
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @CacheEvict(value = "lot", key = "#event.lotId")
    public void handleLotUpdate(LotUpdatedEvent event) {
        log.info("Transactional Event: Evicting lot cache for lot: {}", event.getLotId());
        redisService.evictHighestBid(event.getLotId());
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @CacheEvict(value = "winner", key = "#event.winnerId")
    public void handleWinnerUpdate(WinnerUpdatedEvent event) {
        log.info("Transactional Event: Evicting winner cache: {}", event.getWinnerId());
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @CacheEvict(value = "settlement", key = "#event.settlementId")
    public void handleSettlementUpdate(SettlementUpdatedEvent event) {
        log.info("Transactional Event: Evicting settlement cache: {}", event.getSettlementId());
    }
}
