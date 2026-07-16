package com.eagleauctioner.dto;

import com.eagleauctioner.enums.PurchaseOrderStatus;
import com.eagleauctioner.enums.SaleConfirmationStatus;
import com.eagleauctioner.enums.InvoiceStatus;
import lombok.*;


import java.time.Instant;
import java.util.List;
import java.util.UUID;

public class CommercialDocumentDTOs {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SaleConfirmationResponse {
        private UUID id;
        private String documentNumber;
        private UUID winnerId;
        private UUID auctionLotId;
        private String bidderCompanyName;
        private SaleConfirmationStatus status;
        private Long saleAmount;
        private String termsAndConditions;
        private Integer version;
        private Instant createdAt;
        private List<SaleConfirmationVersionResponse> versions;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SaleConfirmationVersionResponse {
        private UUID id;
        private Integer versionNumber;
        private SaleConfirmationStatus status;
        private Long saleAmount;
        private String termsAndConditions;
        private String changedBy;
        private String changeReason;
        private Instant createdAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PurchaseOrderResponse {
        private UUID id;
        private String documentNumber;
        private UUID saleConfirmationId;
        private String saleConfirmationNumber;
        private PurchaseOrderStatus status;
        private Long totalAmount;
        private Instant createdAt;
        private List<PurchaseOrderItemResponse> items;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PurchaseOrderItemResponse {
        private UUID id;
        private String itemDescription;
        private Integer quantity;
        private Long unitPrice;
        private Long lineTotal;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FeeInvoiceResponse {
        private UUID id;
        private String documentNumber;
        private UUID purchaseOrderId;
        private InvoiceStatus status;
        private Long subtotal;
        private Long taxAmount;
        private Long totalAmount;
        private Instant createdAt;
        private List<FeeInvoiceItemResponse> items;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FeeInvoiceItemResponse {
        private UUID id;
        private String description;
        private Long amount;
    }
}
