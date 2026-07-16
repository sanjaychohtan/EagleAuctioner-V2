package com.eagleauctioner.controller;

import com.eagleauctioner.dto.ApiResponse;
import com.eagleauctioner.dto.AuctionRealTimeDTOs.*;
import com.eagleauctioner.entity.Auction;
import com.eagleauctioner.entity.AuctionEvent;
import com.eagleauctioner.entity.Bid;
import com.eagleauctioner.repository.AuctionEventRepository;
import com.eagleauctioner.repository.AuctionRepository;
import com.eagleauctioner.service.BidService;
import com.eagleauctioner.service.RedisService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Controller exposing real-time session stats, active feeds, and lock-isolated status.
 */
@RestController
@RequestMapping("/api/v1/realtime")
@RequiredArgsConstructor
public class AuctionRealTimeController {

    private final AuctionRepository auctionRepository;
    private final AuctionEventRepository auctionEventRepository;
    private final BidService bidService;
    private final RedisService redisService;

    @GetMapping("/auction/{auctionId}/status")
    @PreAuthorize("hasAnyRole('BIDDER', 'SELLER', 'ADMIN')")
    public ResponseEntity<ApiResponse<AuctionTimerResponse>> getAuctionStatus(@PathVariable UUID auctionId) {
        Auction auction = auctionRepository.findById(auctionId)
                .orElseThrow(() -> new IllegalArgumentException("Auction not found"));

        // Use Redis cache for remaining time
        Long remainingSeconds = redisService.getRemainingTime(auctionId);
        if (remainingSeconds == null) {
            remainingSeconds = Math.max(0, Duration.between(Instant.now(), auction.getAuctionEnd()).toSeconds());
            redisService.cacheRemainingTime(auctionId, remainingSeconds);
        }

        AuctionTimerResponse response = AuctionTimerResponse.builder()
                .auctionId(auctionId)
                .state(auction.getState().name())
                .auctionStart(auction.getAuctionStart())
                .auctionEnd(auction.getAuctionEnd())
                .remainingSeconds(remainingSeconds)
                .autoExtensionEnabled(auction.isAutoExtensionEnabled())
                .build();

        return ResponseEntity.ok(ApiResponse.success("Auction status retrieved successfully", response));
    }

    @GetMapping("/lot/{lotId}/highest-bid")
    @PreAuthorize("hasAnyRole('BIDDER', 'SELLER', 'ADMIN')")
    public ResponseEntity<ApiResponse<LiveBidResponse>> getHighestBid(@PathVariable UUID lotId) {
        // Try live bid cache in Redis first
        LiveBidResponse liveBid = redisService.getHighestBid(lotId);
        
        if (liveBid == null) {
            Bid bid = bidService.findHighestBid(lotId).orElse(null);
            if (bid != null) {
                // In Java, money fields are Long
                Long bidAmount = bid.getBidAmount();
                
                liveBid = LiveBidResponse.builder()
                        .lotId(lotId)
                        .bidAmount(bidAmount)
                        .anonymousBidderCode(bid.getAnonymousBidderCode())
                        .bidTime(bid.getBidTime())
                        .build();
                redisService.cacheHighestBid(lotId, liveBid);
            }
        }

        if (liveBid == null) {
            return ResponseEntity.ok(ApiResponse.success("No bids placed on this lot yet", null));
        }

        return ResponseEntity.ok(ApiResponse.success("Highest bid retrieved successfully", liveBid));
    }

    @GetMapping("/auction/{auctionId}/events")
    @PreAuthorize("hasAnyRole('BIDDER', 'SELLER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<AuctionEventResponse>>> getLiveEventFeed(@PathVariable UUID auctionId) {
        List<AuctionEvent> events = auctionEventRepository.findByAuctionIdOrderByTimestampAsc(auctionId);
        
        List<AuctionEventResponse> responses = events.stream()
                .map(event -> AuctionEventResponse.builder()
                        .eventId(event.getId())
                        .auctionId(event.getAuctionId())
                        .lotId(event.getLotId())
                        .eventType(event.getEventType().name())
                        .payload(event.getPayload())
                        .timestamp(event.getTimestamp())
                        .triggeredBy(event.getTriggeredBy())
                        .build())
                .toList();

        return ResponseEntity.ok(ApiResponse.success("Event feed retrieved successfully", responses));
    }
}
