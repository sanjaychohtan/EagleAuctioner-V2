package com.eagleauctioner.dto;

import lombok.*;
import com.eagleauctioner.enums.ContractStatus;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public class ContractSettlementPaymentDTOs {

    // ==========================================
    // CONTRACT DTOs
    // ==========================================

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ContractRequest {
        private String termsAndConditions;
        private String changeReason;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ContractResponse {
        private UUID id;
        private String documentNumber;
        private UUID winnerId;
        private UUID saleConfirmationId;
        private ContractStatus status;
        private Long totalAmount;
        private String termsAndConditions;
        private Instant createdAt;
        private Instant updatedAt;
        private List<ContractVersionResponse> versions;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ContractVersionResponse {
        private UUID id;
        private Integer versionNumber;
        private ContractStatus status;
        private Long totalAmount;
        private String termsAndConditions;
        private String changedBy;
        private String changeReason;
        private Instant createdAt;
    }
}
