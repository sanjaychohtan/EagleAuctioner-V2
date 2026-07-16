package com.eagleauctioner.dto;

import com.eagleauctioner.enums.GSTInvoiceStatus;
import lombok.*;


import java.time.Instant;
import java.util.List;
import java.util.UUID;

public class GSTInvoiceDTOs {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class GSTInvoiceRequest {
        private UUID settlementId;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class GSTInvoiceResponse {
        private UUID id;
        private String invoiceNumber;
        private UUID settlementId;
        private UUID sellerId;
        private UUID buyerId;
        private Long subtotal;
        private Long totalTax;
        private Long totalAmount;
        private GSTInvoiceStatus status;
        private String pdfUrl;
        private Instant generatedAt;
        
        // Tax Version fields
        private String taxVersion;
        private Instant effectiveFrom;
        private Instant effectiveTo;
        private UUID taxConfigurationId;

        private List<GSTInvoiceItemResponse> items;

        private String correlationId;
        private String traceId;
        private String nodeId;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class GSTInvoiceItemResponse {
        private UUID id;
        private String description;
        private String hsnSacCode;
        private Long amount;
        private Long taxRate;
        private Long taxAmount;
        private Long totalAmount;
    }
}
