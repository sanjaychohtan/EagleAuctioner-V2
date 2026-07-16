package com.eagleauctioner.dto;

import com.eagleauctioner.enums.AuctionLotStatus;
import com.eagleauctioner.enums.AuctionState;
import com.eagleauctioner.enums.AuctionType;
import com.eagleauctioner.enums.AuctionVisibility;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;


import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Container for Auction related DTOs.
 */
public class AuctionDTOs {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateAuctionRequest {
        @NotBlank(message = "Title is required")
        private String title;
        private String description;
        private UUID sellerProfileId;
        @NotNull(message = "Auction type is required")
        private AuctionType auctionType;
        @NotNull(message = "Visibility is required")
        private AuctionVisibility visibility;
        @NotBlank(message = "Currency is required")
        private String currency;
        @NotBlank(message = "Timezone is required")
        private String timezone;
        @NotNull(message = "Registration start time is required")
        private Instant registrationStart;
        @NotNull(message = "Registration end time is required")
        private Instant registrationEnd;
        private Instant inspectionStart;
        private Instant inspectionEnd;
        @NotNull(message = "Auction start time is required")
        private Instant auctionStart;
        @NotNull(message = "Auction end time is required")
        private Instant auctionEnd;
        private Boolean reservePriceEnabled;
        private Boolean autoExtensionEnabled;
        private Integer extensionMinutes;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateAuctionRequest {
        @NotBlank(message = "Title is required")
        private String title;
        private String description;
        @NotNull(message = "Auction type is required")
        private AuctionType auctionType;
        @NotNull(message = "Visibility is required")
        private AuctionVisibility visibility;
        @NotBlank(message = "Currency is required")
        private String currency;
        @NotBlank(message = "Timezone is required")
        private String timezone;
        @NotNull(message = "Registration start time is required")
        private Instant registrationStart;
        @NotNull(message = "Registration end time is required")
        private Instant registrationEnd;
        private Instant inspectionStart;
        private Instant inspectionEnd;
        @NotNull(message = "Auction start time is required")
        private Instant auctionStart;
        @NotNull(message = "Auction end time is required")
        private Instant auctionEnd;
        private Boolean reservePriceEnabled;
        private Boolean autoExtensionEnabled;
        private Integer extensionMinutes;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateSettingsRequest {
        private Boolean anonymousBidding;
        private Boolean allowAutoExtension;
        private Integer extensionMinutes;
        private Integer maxExtensions;
        private String bidIncrementType;
        private Long minimumIncrement;
        private Boolean reservePriceEnabled;
        private Boolean allowProxyBid;
        private Boolean allowManualWinner;
        private Boolean allowSellerApproval;
        private Boolean allowBidWithdrawal;
        private Boolean allowRankDisplay;
        private Boolean showBidderNames;
        private Boolean registrationRequired;
        private Boolean emdRequired;
        private String timezone;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateLotRequest {
        @NotBlank(message = "Lot number is required")
        private String lotNumber;
        @NotBlank(message = "Title is required")
        private String title;
        private String description;
        @NotBlank(message = "Material category is required")
        private String materialCategory;
        @NotNull(message = "Quantity is required")
        private Long quantity;
        @NotBlank(message = "Unit of measure is required")
        private String unitOfMeasure;
        @NotNull(message = "Starting price is required")
        private Long startingPrice;
        private Long reservePrice;
        @NotNull(message = "Minimum increment is required")
        private Long minimumIncrement;
        @NotBlank(message = "Currency is required")
        private String currency;
        private Integer displayOrder;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateLotRequest {
        @NotBlank(message = "Lot number is required")
        private String lotNumber;
        @NotBlank(message = "Title is required")
        private String title;
        private String description;
        @NotBlank(message = "Material category is required")
        private String materialCategory;
        @NotNull(message = "Quantity is required")
        private Long quantity;
        @NotBlank(message = "Unit of measure is required")
        private String unitOfMeasure;
        @NotNull(message = "Starting price is required")
        private Long startingPrice;
        private Long reservePrice;
        @NotNull(message = "Minimum increment is required")
        private Long minimumIncrement;
        @NotBlank(message = "Currency is required")
        private String currency;
        private Integer displayOrder;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AuctionSettingsResponse {
        private UUID id;
        private boolean anonymousBidding;
        private boolean allowAutoExtension;
        private int extensionMinutes;
        private int maxExtensions;
        private String bidIncrementType;
        private Long minimumIncrement;
        private boolean reservePriceEnabled;
        private boolean allowProxyBid;
        private boolean allowManualWinner;
        private boolean allowSellerApproval;
        private boolean allowBidWithdrawal;
        private boolean allowRankDisplay;
        private boolean showBidderNames;
        private boolean registrationRequired;
        private boolean emdRequired;
        private String timezone;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AuctionLotResponse {
        private UUID id;
        private UUID auctionId;
        private String lotNumber;
        private String title;
        private String description;
        private String materialCategory;
        private Long quantity;
        private String unitOfMeasure;
        private Long startingPrice;
        private Long reservePrice;
        private Long currentHighestBid;
        private Long minimumIncrement;
        private String currency;
        private AuctionLotStatus lotStatus;
        private UUID winnerBidderId;
        private int displayOrder;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AuctionResponse {
        private UUID id;
        private String auctionNumber;
        private String title;
        private String description;
        private UUID sellerProfileId;
        private String sellerCompanyName;
        private AuctionState state;
        private AuctionType auctionType;
        private AuctionVisibility visibility;
        private String currency;
        private String timezone;
        private Instant registrationStart;
        private Instant registrationEnd;
        private Instant inspectionStart;
        private Instant inspectionEnd;
        private Instant auctionStart;
        private Instant auctionEnd;
        private boolean reservePriceEnabled;
        private boolean autoExtensionEnabled;
        private Integer extensionMinutes;
        private AuctionSettingsResponse settings;
        private List<AuctionLotResponse> lots;
        private Instant createdAt;
        private Instant updatedAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AuctionSummaryResponse {
        private UUID id;
        private String auctionNumber;
        private String title;
        private AuctionState state;
        private AuctionType auctionType;
        private AuctionVisibility visibility;
        private Instant auctionStart;
        private Instant auctionEnd;
        private int lotCount;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PaginatedAuctionResponse {
        private List<AuctionSummaryResponse> content;
        private int pageNumber;
        private int pageSize;
        private long totalElements;
        private int totalPages;
        private boolean last;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LotSortRequest {
        private List<UUID> sortedLotIds;
    }
}
