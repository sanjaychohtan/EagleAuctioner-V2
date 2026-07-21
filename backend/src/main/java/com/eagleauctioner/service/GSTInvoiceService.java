package com.eagleauctioner.service;

import com.eagleauctioner.dto.GSTInvoiceDTOs.*;
import com.eagleauctioner.entity.*;
import com.eagleauctioner.enums.DocumentType;
import com.eagleauctioner.enums.GSTInvoiceStatus;
import com.eagleauctioner.repository.GSTInvoiceRepository;
import com.eagleauctioner.repository.SettlementRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Enterprise service governing GST Invoice lifecycles.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class GSTInvoiceService {

    private final GSTInvoiceRepository gstInvoiceRepository;
    private final SettlementRepository settlementRepository;
    private final DocumentNumberGeneratorService documentNumberGenerator;
    private final TaxEngine taxEngine;
    private final PdfGenerationService pdfGenerationService;
    private final FinancialRuleEngine financialRuleEngine;

    @Transactional
    public GSTInvoiceResponse generateInvoice(UUID settlementId) {
        log.info("Generating GST Invoice for Settlement: {}", settlementId);

        Settlement settlement = settlementRepository.findByIdWithRelations(settlementId)
                .orElseThrow(() -> new IllegalArgumentException("Settlement not found: " + settlementId));

        if (gstInvoiceRepository.findBySettlementId(settlementId).isPresent()) {
            throw new IllegalStateException("GST Invoice already exists for Settlement: " + settlementId);
        }

        String invoiceNum = documentNumberGenerator.generateNextNumber(DocumentType.GST_INVOICE);

        // Basis for GST is the platform fee
        Long subtotal = settlement.getPlatformFee();
        BigDecimal gstRate = financialRuleEngine.getGstPercentage();
        Long gstRateLong = gstRate.movePointRight(2).setScale(0, java.math.RoundingMode.HALF_UP).longValueExact();
        Long gstAmount = taxEngine.calculateTax(subtotal, gstRate);
        Long totalAmount = subtotal + gstAmount;

        GSTInvoice invoice = GSTInvoice.builder()
                .invoiceNumber(invoiceNum)
                .settlementId(settlementId)
                .sellerId(settlement.getContract().getWinner().getAuctionLot().getAuction().getSellerProfile().getId())
                .buyerId(settlement.getContract().getWinner().getBidderProfile().getId())
                .subtotal(subtotal)
                .totalTax(gstAmount)
                .totalAmount(totalAmount)
                .status(GSTInvoiceStatus.GENERATED)
                .generatedAt(java.time.Instant.now())
                .taxVersion("V1")
                .effectiveFrom(java.time.Instant.now())
                .effectiveTo(java.time.Instant.now().plus(java.time.Duration.ofDays(365)))
                .taxConfigurationId(java.util.UUID.randomUUID())
                .items(new ArrayList<>())
                .build();

        GSTInvoiceItem item = GSTInvoiceItem.builder()
                .description("Platform facilitation fee for Lot: " + settlement.getContract().getWinner().getAuctionLot().getLotNumber())
                .hsnSacCode("998311") // Management consulting and management services
                .amount(subtotal)
                .taxRate(gstRateLong)
                .taxAmount(gstAmount)
                .totalAmount(totalAmount)
                .build();

        invoice.addItem(item);

        // Mock PDF Generation
        String pdfUrl = pdfGenerationService.generateInvoicePdf(invoiceNum, subtotal, gstAmount, totalAmount);
        invoice.setPdfUrl(pdfUrl);

        GSTInvoice saved = gstInvoiceRepository.save(invoice);
        log.info("GST Invoice {} generated successfully.", saved.getInvoiceNumber());

        return mapToResponse(saved);
    }

    public GSTInvoiceResponse getById(UUID id) {
        GSTInvoice invoice = gstInvoiceRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("GST Invoice not found: " + id));
        return mapToResponse(invoice);
    }

    public List<GSTInvoiceResponse> getBySellerId(UUID sellerId) {
        return gstInvoiceRepository.findBySellerId(sellerId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private GSTInvoiceResponse mapToResponse(GSTInvoice invoice) {
        if (invoice == null) return null;

        List<GSTInvoiceItemResponse> itemResponses = invoice.getItems().stream()
                .map(i -> GSTInvoiceItemResponse.builder()
                        .id(i.getId())
                        .description(i.getDescription())
                        .hsnSacCode(i.getHsnSacCode())
                        .amount(i.getAmount())
                        .taxRate(i.getTaxRate() != null ? i.getTaxRate().longValue() : 0L)
                        .taxAmount(i.getTaxAmount())
                        .totalAmount(i.getTotalAmount())
                        .build())
                .collect(Collectors.toList());

        return GSTInvoiceResponse.builder()
                .id(invoice.getId())
                .invoiceNumber(invoice.getInvoiceNumber())
                .settlementId(invoice.getSettlementId())
                .sellerId(invoice.getSellerId())
                .buyerId(invoice.getBuyerId())
                .subtotal(invoice.getSubtotal())
                .totalTax(invoice.getTotalTax())
                .totalAmount(invoice.getTotalAmount())
                .status(invoice.getStatus())
                .pdfUrl(invoice.getPdfUrl())
                .generatedAt(invoice.getCreatedAt())
                .items(itemResponses)
                .correlationId(invoice.getCorrelationId())
                .traceId(invoice.getTraceId())
                .nodeId(invoice.getNodeId())
                .build();
    }
}
