package com.eagleauctioner.service;

import com.eagleauctioner.entity.*;
import com.eagleauctioner.enums.*;
import com.eagleauctioner.repository.AuctionEventRepository;
import com.eagleauctioner.repository.AuctionRepository;
import com.eagleauctioner.repository.OutboxEventRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.redisson.api.RLock;
import org.redisson.api.RedissonClient;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
@Slf4j
@RequiredArgsConstructor
public class AuctionTimerService {
    private AuctionTimerService self;
    @org.springframework.beans.factory.annotation.Autowired
    public void setSelf(org.springframework.context.ApplicationContext context) { this.self = context.getBean(AuctionTimerService.class); }


    private final AuctionRepository auctionRepository;
    private final AuctionEventRepository auctionEventRepository;
    private final OutboxEventRepository outboxEventRepository;
    private final RedissonClient redissonClient;
    private final ApplicationEventPublisher eventPublisher;
    private final ObjectMapper objectMapper;
    private final io.micrometer.core.instrument.MeterRegistry meterRegistry;

    @Scheduled(fixedRate = 10, timeUnit = TimeUnit.SECONDS)
    public void processAuctionLifecycleTransitions() {
        io.micrometer.core.instrument.Timer.Sample sample = io.micrometer.core.instrument.Timer.start(meterRegistry);
        Instant now = Instant.now();
        
        // 1. Detect and process Auction Starts (PUBLISHED -> LIVE)
        List<Auction> pendingStarts = auctionRepository.findByStateAndAuctionStartLessThanEqual(AuctionState.PUBLISHED, now);
        for (Auction auction : pendingStarts) {
            transitionToLiveWithLock(auction.getId());
        }

        // 2. Detect and process Auction Ends (LIVE -> ENDED)
        List<Auction> pendingEnds = auctionRepository.findByStateAndAuctionEndLessThanEqual(AuctionState.LIVE, now);
        for (Auction auction : pendingEnds) {
            transitionToEndedWithLock(auction.getId());
        }
        
        sample.stop(meterRegistry.timer("scheduler.auction.lifecycle.duration"));
    }

    private void transitionToLiveWithLock(UUID auctionId) {
        RLock lock = redissonClient.getLock("auction:transition:" + auctionId);
        long start = System.currentTimeMillis();
        try {
            if (lock.tryLock(5, 10, TimeUnit.SECONDS)) {
                meterRegistry.timer("redis.lock.wait").record(System.currentTimeMillis() - start, TimeUnit.MILLISECONDS);
                try {
                    self.executeTransitionToLive(auctionId);
                } finally {
                    lock.unlock();
                }
            } else {
                meterRegistry.counter("redis.lock.failure").increment();
            }
        } catch (Exception e) {
            meterRegistry.counter("redis.lock.failure").increment();
            log.error("Failed to execute LIVE transition lock for auction {}", auctionId, e);
        }
    }

    private void transitionToEndedWithLock(UUID auctionId) {
        RLock lock = redissonClient.getLock("auction:transition:" + auctionId);
        long start = System.currentTimeMillis();
        try {
            if (lock.tryLock(5, 10, TimeUnit.SECONDS)) {
                meterRegistry.timer("redis.lock.wait").record(System.currentTimeMillis() - start, TimeUnit.MILLISECONDS);
                try {
                    self.executeTransitionToEnded(auctionId);
                } finally {
                    lock.unlock();
                }
            } else {
                meterRegistry.counter("redis.lock.failure").increment();
            }
        } catch (Exception e) {
            meterRegistry.counter("redis.lock.failure").increment();
            log.error("Failed to execute ENDED transition lock for auction {}", auctionId, e);
        }
    }

    @Transactional
    public void executeTransitionToLive(UUID auctionId) {
        Auction auction = auctionRepository.findWithLotsById(auctionId).orElse(null);
        if (auction == null || auction.getState() != AuctionState.PUBLISHED) {
            return;
        }

        auction.setState(AuctionState.LIVE);
        for (AuctionLot lot : auction.getLots()) {
            if (lot.getLotStatus() == AuctionLotStatus.READY) {
                lot.setLotStatus(AuctionLotStatus.LIVE);
            }
        }
        auctionRepository.save(auction);
        log.info("Auction {} and its ready lots are now LIVE.", auctionId);

        // Record events
        try {
            String payload = objectMapper.writeValueAsString(Map.of("auctionId", auctionId.toString()));
            
            AuctionEvent event = AuctionEvent.builder()
                    .auctionId(auctionId)
                    .eventType(AuctionEventType.AUCTION_LIVE)
                    .payload(payload)
                    .timestamp(Instant.now())
                    .triggeredBy("SYSTEM_SCHEDULER")
                    .build();
            auctionEventRepository.save(event);

            OutboxEvent outbox = OutboxEvent.builder()
                    .aggregateId(auctionId)
                    .aggregateType("Auction")
                    .eventType("AuctionStarted")
                    .payload(payload)
                    .createdAt(Instant.now())
                    .processed(false)
                    .build();
            outboxEventRepository.save(outbox);
            eventPublisher.publishEvent(event);
        } catch (Exception e) {
            log.error("Error creating start events for auction {}", auctionId, e);
        }
    }

    @Transactional
    public void executeTransitionToEnded(UUID auctionId) {
        Auction auction = auctionRepository.findWithLotsById(auctionId).orElse(null);
        if (auction == null || auction.getState() != AuctionState.LIVE) {
            return;
        }

        auction.setState(AuctionState.ENDED);
        
        // Process each lot's final status
        for (AuctionLot lot : auction.getLots()) {
            if (lot.getLotStatus() == AuctionLotStatus.LIVE) {
                Long highestBidAmount = lot.getCurrentHighestBid();
                Long reservePrice = lot.getReservePrice();

                boolean reserveMet = reservePrice == null || (highestBidAmount != null && highestBidAmount.compareTo(reservePrice) >= 0);

                if (highestBidAmount != null && reserveMet) {
                    lot.setLotStatus(AuctionLotStatus.SOLD);
                } else {
                    lot.setLotStatus(AuctionLotStatus.UNSOLD);
                }

                // Create lot close events
                try {
                    String lotPayload = objectMapper.writeValueAsString(Map.of(
                            "lotId", lot.getId().toString(),
                            "status", lot.getLotStatus().name(),
                            "highestBid", highestBidAmount != null ? highestBidAmount.toString() : "0.00",
                            "reserveMet", reserveMet
                    ));

                    AuctionEvent lotEvent = AuctionEvent.builder()
                            .auctionId(auctionId)
                            .lotId(lot.getId())
                            .eventType(AuctionEventType.LOT_ENDED)
                            .payload(lotPayload)
                            .timestamp(Instant.now())
                            .triggeredBy("SYSTEM_SCHEDULER")
                            .build();
                    auctionEventRepository.save(lotEvent);

                    OutboxEvent lotOutbox = OutboxEvent.builder()
                            .aggregateId(lot.getId())
                            .aggregateType("AuctionLot")
                            .eventType("LotClosed")
                            .payload(lotPayload)
                            .createdAt(Instant.now())
                            .processed(false)
                            .build();
                    outboxEventRepository.save(lotOutbox);
                    eventPublisher.publishEvent(lotEvent);
                } catch (Exception e) {
                    log.error("Error creating end events for lot {}", lot.getId(), e);
                }
            }
        }
        
        auctionRepository.save(auction);
        log.info("Auction {} has ended.", auctionId);

        // Record auction ended events
        try {
            String payload = objectMapper.writeValueAsString(Map.of("auctionId", auctionId.toString()));
            
            AuctionEvent event = AuctionEvent.builder()
                    .auctionId(auctionId)
                    .eventType(AuctionEventType.AUCTION_ENDED)
                    .payload(payload)
                    .timestamp(Instant.now())
                    .triggeredBy("SYSTEM_SCHEDULER")
                    .build();
            auctionEventRepository.save(event);

            OutboxEvent outbox = OutboxEvent.builder()
                    .aggregateId(auctionId)
                    .aggregateType("Auction")
                    .eventType("AuctionEnded")
                    .payload(payload)
                    .createdAt(Instant.now())
                    .processed(false)
                    .build();
            outboxEventRepository.save(outbox);
            eventPublisher.publishEvent(event);
        } catch (Exception e) {
            log.error("Error creating end events for auction {}", auctionId, e);
        }
    }
}
