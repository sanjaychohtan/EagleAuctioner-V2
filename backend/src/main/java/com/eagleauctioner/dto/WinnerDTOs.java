package com.eagleauctioner.dto;

import com.eagleauctioner.enums.WinnerStatus;
import com.eagleauctioner.enums.WinnerSelectionType;
import com.eagleauctioner.enums.AuctionResultStatus;
import jakarta.validation.constraints.*;
import lombok.*;


import java.time.Instant;
import java.util.UUID;

/**
 * Data Transfer Objects for the Winner Selection & Post-Auction Decision Engine.
 */
public class WinnerDTOs {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class WinnerRequest {
        
        @NotNull(message = "Auction lot ID is required")
        private UUID auctionLotId;

        @NotNull(message = "Bidder profile ID is required")
        private UUID bidderProfileId;

        private UUID bidId;

        @NotBlank(message = "Remarks are required for audits")
        @Size(max = 1000, message = "Remarks must not exceed 1000 characters")
        private String remarks;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class WinnerResponse {
        private UUID id;
        private UUID auctionLotId;
        private UUID bidderProfileId;
        private UUID bidId;
        private WinnerStatus status;
        private WinnerSelectionType selectionType;
        private Long winningAmount;
        private Instant sellerDecisionAt;
        private String notes;

        // --- IMMUTABLE SNAPSHOT VALUE OBJECT FIELDS ---
        private String winnerCompanyName;
        private String winnerDisplayName;
        private String winnerAnonymousCode;
        private Long winnerBidAmountSnapshot;
        private Instant winnerBidTimeSnapshot;
        private String sellerCompanySnapshot;
        private Long reservePriceSnapshot;
        private String currencySnapshot;
        private String taxProfileSnapshot;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AuctionResultResponse {
        private UUID id;
        private UUID auctionLotId;
        private AuctionResultStatus status;
        private Long highestBidAmount;
        private Long reservePrice;
        private Boolean reserveMet;
        private WinnerResponse winner;
    }
}
