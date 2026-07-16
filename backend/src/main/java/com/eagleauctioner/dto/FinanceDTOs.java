package com.eagleauctioner.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;


import java.time.Instant;
import java.util.UUID;

public class FinanceDTOs {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WalletResponse {
        private UUID walletId;
        private UUID userId;
        private Long availableBalance;
        private Long lockedBalance;
        private String currency;
        private Instant lastUpdated;
        private Long permanentEmd;
        private Long refundPending;
        private Long settlementPending;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LedgerResponse {
        private UUID ledgerId;
        private UUID transactionId;
        private String accountId;
        private String accountType;
        private String entryType;
        private Long amount;
        private String currency;
        private String description;
        private Instant timestamp;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LedgerAdjustmentRequest {
        @NotBlank(message = "Account type is required")
        private String accountType;
        @NotBlank(message = "Entry type is required")
        private String entryType;
        @NotNull(message = "Amount is required")
        @Positive(message = "Amount must be positive")
        private Long amount;
        @NotBlank(message = "Currency is required")
        private String currency;
        @NotBlank(message = "Description is required")
        private String description;
    }
}
