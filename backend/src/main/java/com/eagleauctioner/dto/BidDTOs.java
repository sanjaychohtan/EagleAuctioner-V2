package com.eagleauctioner.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;


import java.time.Instant;
import java.util.UUID;

public class BidDTOs {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PlaceBidRequest {
        @NotNull(message = "Bid amount is required")
        @Min(value = 1, message = "Bid amount must be greater than zero")
        private Long bidAmount;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PlaceSealedBidRequest {
        @NotNull(message = "Bid amount is required")
        @Min(value = 1, message = "Bid amount must be greater than zero")
        private Long bidAmount;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BidResponse {
        private UUID id;
        private UUID lotId;
        private Long bidAmount;
        private Instant bidTime;
        private String bidStatus;
        private Boolean isAutoBid;
        private String anonymousCode;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BidHistoryResponse {
        private UUID id;
        private UUID bidId;
        private UUID lotId;
        private Long amount;
        private Instant timestamp;
        private String anonymousCode;
        private Boolean isAutoBid;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RankStatusResponse {
        private UUID lotId;
        private Integer rank;
        private Integer totalBidders;
        private Long highestBid;
        private Boolean isWinning;
        private Instant updatedAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SealedBidOpeningResponse {
        private UUID lotId;
        private Integer bidsOpened;
        private Long highestBid;
        private String winningAnonymousCode;
        private Instant openedAt;
    }
}
