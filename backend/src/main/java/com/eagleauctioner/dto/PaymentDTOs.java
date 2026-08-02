package com.eagleauctioner.dto;

import com.eagleauctioner.enums.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public final class PaymentDTOs {

    private PaymentDTOs() {}

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PaymentRequest {
        @NotNull(message = "Amount is required")
        @Positive(message = "Amount must be greater than zero")
        private Long amount;
        
        private PaymentMethod paymentMethod;
        private String referenceNumber;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PaymentResponse {
        private UUID id;
        private String paymentNumber;
        private UUID settlementId;
        private String settlementNumber;
        private PaymentStatus status;
        private Long totalAmount;
        private String referenceNumber;
        private PaymentMethod paymentMethod;
        private Instant paymentDate;
        private List<PaymentAllocationResponse> allocations;
        private List<PaymentTransactionResponse> transactions;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PaymentTransactionResponse {
        private UUID id;
        private String gatewayReference;
        private Long amount;
        private PaymentTransactionStatus status;
        private String errorMessage;
        private Instant completedAt;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PaymentAllocationResponse {
        private UUID id;
        private Long allocatedAmount;
        private PaymentAllocationType allocationType;
        private Instant allocatedAt;
    }
}
