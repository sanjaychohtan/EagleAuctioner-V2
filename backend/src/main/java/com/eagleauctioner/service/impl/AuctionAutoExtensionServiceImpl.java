package com.eagleauctioner.service.impl;

import com.eagleauctioner.entity.Auction;
import com.eagleauctioner.entity.AuctionEvent;
import com.eagleauctioner.entity.OutboxEvent;
import com.eagleauctioner.enums.AuctionEventType;
import com.eagleauctioner.repository.AuctionEventRepository;
import com.eagleauctioner.repository.AuctionRepository;
import com.eagleauctioner.repository.OutboxEventRepository;
import com.eagleauctioner.service.AuctionAutoExtensionService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.redisson.api.RLock;
import org.redisson.api.RedissonClient;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
@Slf4j
@RequiredArgsConstructor
public class AuctionAutoExtensionServiceImpl implements AuctionAutoExtensionService {

    private final AuctionRepository auctionRepository;
    private final AuctionEventRepository auctionEventRepository;
    private final OutboxEventRepository outboxEventRepository;
    private final RedissonClient redissonClient;
    private final ObjectMapper objectMapper;
    private final ApplicationEventPublisher eventPublisher;
    @org.springframework.context.annotation.Lazy
    @org.springframework.beans.factory.annotation.Autowired
    private AuctionAutoExtensionServiceImpl self;

    @Override
    public boolean checkAndExtend(UUID auctionId, UUID lotId, Instant bidTime, String bidderCode) {
        String lockKey = "auction:" + auctionId;
        RLock lock = redissonClient.getLock(lockKey);
        try {
            if (lock.tryLock(5, 10, TimeUnit.SECONDS)) {
                try {
                    return self.executeCheckAndExtend(auctionId, lotId, bidTime, bidderCode);
                } finally {
                    lock.unlock();
                }
            }
        } catch (Exception e) {
            log.error("Error during auto extension check for auction {}", auctionId, e);
        }
        return false;
    }

    @Transactional
    public boolean executeCheckAndExtend(UUID auctionId, UUID lotId, Instant bidTime, String bidderCode) {
        try {
            Auction auction = auctionRepository.findById(auctionId)
                    .orElseThrow(() -> new IllegalArgumentException("Auction not found"));

            if (!auction.isAutoExtensionEnabled()) {
                return false;
            }

            Integer maxExtensions = auction.getSettings() != null ? auction.getSettings().getMaxExtensions() : null;
            if (maxExtensions != null && auction.getExtensionCount() != null && auction.getExtensionCount() >= maxExtensions) {
                return false;
            }

            Instant auctionEnd = auction.getAuctionEnd();
            Integer extensionMinutes = auction.getExtensionMinutes();
            if (extensionMinutes == null || extensionMinutes <= 0) {
                extensionMinutes = 5;
            }

            Instant windowStart = auctionEnd.minus(Duration.ofMinutes(extensionMinutes));
            if (bidTime.isAfter(windowStart) && bidTime.isBefore(auctionEnd)) {
                Instant newAuctionEnd = auctionEnd.plus(Duration.ofMinutes(extensionMinutes));
                auction.setAuctionEnd(newAuctionEnd);
                auction.setExtensionCount((auction.getExtensionCount() == null ? 0 : auction.getExtensionCount()) + 1);
                auctionRepository.save(auction);

                String payload = objectMapper.writeValueAsString(Map.of(
                        "oldEndTime", auctionEnd.toString(),
                        "newEndTime", newAuctionEnd.toString(),
                        "extensionMinutes", extensionMinutes,
                        "bidderCode", bidderCode
                ));

                AuctionEvent event = AuctionEvent.builder()
                        .auctionId(auctionId)
                        .lotId(lotId)
                        .eventType(AuctionEventType.AUTO_EXTENSION_TRIGGERED)
                        .payload(payload)
                        .timestamp(Instant.now())
                        .triggeredBy(bidderCode)
                        .build();
                auctionEventRepository.save(event);

                OutboxEvent outbox = OutboxEvent.builder()
                        .aggregateId(auctionId)
                        .aggregateType("Auction")
                        .eventType("AutoExtended")
                        .payload(payload)
                        .createdAt(Instant.now())
                        .processed(false)
                        .build();
                outboxEventRepository.save(outbox);

                eventPublisher.publishEvent(event);
                return true;
            }
        } catch (Exception e) {
            log.error("Error executing auto extension for auction {}", auctionId, e);
            throw new RuntimeException(e); // rollback
        }
        return false;
    }
}
