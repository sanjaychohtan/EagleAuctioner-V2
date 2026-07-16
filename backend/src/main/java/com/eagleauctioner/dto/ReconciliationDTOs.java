package com.eagleauctioner.dto;

import com.eagleauctioner.enums.ReconciliationStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

public class ReconciliationDTOs {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ReconcileSettlementRequest {
        @NotNull(message = "Settlement ID is required")
        private UUID settlementId;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ReconcileBankRequest {
        @NotNull(message = "Payment ID is required")
        private UUID paymentId;

        @NotBlank(message = "Bank transaction ID is required")
        private String bankTransactionId;

        @NotNull(message = "Actual amount is required")
        @Positive(message = "Actual amount must be positive")
        private Long actualAmount;

        private String notes;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SettlementReconciliationResponse {
        private UUID id;
        private UUID settlementId;
        private UUID paymentId;
        private UUID ledgerBatchId;
        private UUID gstInvoiceId;
        private ReconciliationStatus status;
        private String notes;
        private Instant reconciledAt;
        private String correlationId;
        private String traceId;
        private String nodeId;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class BankReconciliationResponse {
        private UUID id;
        private UUID paymentId;
        private String bankTransactionId;
        private Long expectedAmount;
        private Long actualAmount;
        private ReconciliationStatus status;
        private Instant reconciledAt;
        private String notes;
        private String correlationId;
        private String traceId;
        private String nodeId;
    }
}
