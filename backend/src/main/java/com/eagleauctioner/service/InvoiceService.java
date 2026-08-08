package com.eagleauctioner.service;

import com.eagleauctioner.dto.CommercialDocumentDTOs.*;
import com.eagleauctioner.entity.*;
import com.eagleauctioner.enums.InvoiceStatus;
import com.eagleauctioner.enums.DocumentType;
import com.eagleauctioner.repository.FeeInvoiceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Enterprise service governing Platform Fee Invoice generation.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class InvoiceService {

    private final FeeInvoiceRepository feeInvoiceRepository;
    private final DocumentNumberGeneratorService documentNumberGenerator;
    private final FinancialRuleEngine financialRuleEngine;

    @Transactional
    public FeeInvoice calculateAndCreateInvoice(PurchaseOrder po) {
        log.info("Auto-generating Platform Fee Invoice for Purchase Order: {}", po.getDocumentNumber());

        String docNum = documentNumberGenerator.generateNextNumber(DocumentType.FEE_INVOICE);

        RoundingMode roundingMode = financialRuleEngine.getRoundingMode();
        int precision = financialRuleEngine.getCurrencyPrecision();
        
        BigDecimal rawFeePercent = financialRuleEngine.getPlatformFeePercentage();
        BigDecimal rawTaxPercent = financialRuleEngine.getVatPercentage();

        BigDecimal feeMultiplier = rawFeePercent.divide(new BigDecimal("100"), precision + 2, roundingMode);
        BigDecimal taxMultiplier = rawTaxPercent.divide(new BigDecimal("100"), precision + 2, roundingMode);

        Long subtotal = new BigDecimal(po.getTotalAmount()).multiply(feeMultiplier).setScale(0, roundingMode).longValueExact();
        Long taxAmount = new BigDecimal(subtotal).multiply(taxMultiplier).setScale(0, roundingMode).longValueExact();
        Long totalAmount = subtotal + taxAmount;

        FeeInvoice fi = FeeInvoice.builder()
                .documentNumber(docNum)
                .purchaseOrder(po)
                .status(InvoiceStatus.UNPAID)
                .subtotal(subtotal)
                .taxAmount(taxAmount)
                .totalAmount(totalAmount)
                .items(new ArrayList<>())
                .build();

        FeeInvoiceItem platformFeeItem = FeeInvoiceItem.builder()
                .description(String.format("AUCTBIZ platform facilitation fee (%.2f%% on total purchase order value of %s)", 
                        rawFeePercent.doubleValue(), po.getTotalAmount().toString()))
                .amount(subtotal)
                .build();

        fi.addItem(platformFeeItem);
        FeeInvoice saved = feeInvoiceRepository.save(fi);
        log.info("Platform Fee Invoice saved successfully: {} with total: {}", saved.getDocumentNumber(), saved.getTotalAmount());
        return saved;
    }

    @Transactional
    public FeeInvoiceResponse payInvoice(UUID invoiceId) {
        log.info("Processing settlement/payment for Invoice: {}", invoiceId);
        FeeInvoice fi = feeInvoiceRepository.findByIdWithRelations(invoiceId)
                .orElseThrow(() -> new IllegalArgumentException("Invoice not found: " + invoiceId));

        validateInvoiceAccess(fi);

        if (fi.getStatus() == InvoiceStatus.PAID) {
            throw new IllegalStateException("Invoice is already settled/paid.");
        }

        fi.setStatus(InvoiceStatus.PAID);
        FeeInvoice saved = feeInvoiceRepository.save(fi);
        log.info("Invoice {} successfully marked as settled (PAID).", saved.getDocumentNumber());
        return mapToResponse(saved);
    }

    public FeeInvoiceResponse getById(UUID id) {
        FeeInvoice fi = feeInvoiceRepository.findByIdWithRelations(id)
                .orElseThrow(() -> new IllegalArgumentException("Invoice not found: " + id));
        
        validateInvoiceAccess(fi);
        
        return mapToResponse(fi);
    }

    public FeeInvoiceResponse getByPurchaseOrderId(UUID poId) {
        FeeInvoice fi = feeInvoiceRepository.findByPurchaseOrderId(poId)
                .orElseThrow(() -> new IllegalArgumentException("Invoice not found for Purchase Order: " + poId));
        
        validateInvoiceAccess(fi);
        
        return mapToResponse(fi);
    }

    public void validateInvoiceAccess(FeeInvoice fi) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) {
            throw new AccessDeniedException("Unauthenticated request rejected during document access check.");
        }

        String username = auth.getName();
        boolean isAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (isAdmin) {
            return;
        }

        // Check if user is the Winning Bidder (Buyer)
        try {
            String buyerEmail = fi.getPurchaseOrder().getSaleConfirmation().getWinner().getBidderProfile().getUser().getEmail();
            if (username.equalsIgnoreCase(buyerEmail)) {
                return;
            }
        } catch (Exception ex) {
            log.warn("IDOR check: Could not resolve buyer email", ex);
        }

        // Check if user is the Seller
        try {
            String sellerEmail = fi.getPurchaseOrder().getSaleConfirmation().getWinner().getAuctionLot().getAuction().getSellerProfile().getUser().getEmail();
            if (username.equalsIgnoreCase(sellerEmail)) {
                return;
            }
        } catch (Exception ex) {
            log.warn("IDOR check: Could not resolve seller email", ex);
        }

        throw new AccessDeniedException("Access Denied: You do not own or have permission to access the requested commercial document.");
    }

    private FeeInvoiceResponse mapToResponse(FeeInvoice fi) {
        if (fi == null) return null;

        List<FeeInvoiceItemResponse> itemResponses = fi.getItems().stream()
                .map(i -> FeeInvoiceItemResponse.builder()
                        .id(i.getId())
                        .description(i.getDescription())
                        .amount(i.getAmount())
                        .build())
                .collect(Collectors.toList());

        return FeeInvoiceResponse.builder()
                .id(fi.getId())
                .documentNumber(fi.getDocumentNumber())
                .purchaseOrderId(fi.getPurchaseOrder().getId())
                .status(fi.getStatus())
                .subtotal(fi.getSubtotal())
                .taxAmount(fi.getTaxAmount())
                .totalAmount(fi.getTotalAmount())
                .createdAt(fi.getCreatedAt())
                .items(itemResponses)
                .build();
    }
}
