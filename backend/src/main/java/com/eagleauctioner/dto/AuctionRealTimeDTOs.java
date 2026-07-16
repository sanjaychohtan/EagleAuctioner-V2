package com.eagleauctioner.dto;

import lombok.*;

import java.time.Instant;
import java.util.UUID;

/**
 * Standard data transfer objects for real-time auction status, event logs, and timers.
 */
public class AuctionRealTimeDTOs {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AuctionEventResponse {
        private UUID eventId;
        private UUID auctionId;
        private UUID lotId;
        private String eventType;
        private String payload;
        private Instant timestamp;
        private String triggeredBy;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class LiveBidResponse {
        private UUID lotId;
        private Long bidAmount;
        private String anonymousBidderCode;
        private Instant bidTime;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AuctionTimerResponse {
        private UUID auctionId;
        private String state;
        private Instant auctionStart;
        private Instant auctionEnd;
        private long remainingSeconds;
        private boolean autoExtensionEnabled;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AuctionWinnerResponse {
        private UUID lotId;
        private String lotNumber;
        private String title;
        private String anonymousWinnerCode;
        private Long winningAmount;
        private boolean reserveMet;
    }
}
