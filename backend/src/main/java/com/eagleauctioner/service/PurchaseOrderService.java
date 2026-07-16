package com.eagleauctioner.service;

import com.eagleauctioner.dto.CommercialDocumentDTOs.*;
import com.eagleauctioner.entity.*;
import com.eagleauctioner.enums.PurchaseOrderStatus;
import com.eagleauctioner.enums.DocumentType;
import com.eagleauctioner.repository.PurchaseOrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Enterprise service governing Purchase Order lifecycles.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class PurchaseOrderService {

    private final PurchaseOrderRepository purchaseOrderRepository;
    private final DocumentNumberGeneratorService documentNumberGenerator;
    private final InvoiceService invoiceService;

    @Transactional
    public PurchaseOrder createPurchaseOrder(SaleConfirmation sc) {
        log.info("Auto-generating Purchase Order for Sale Confirmation: {}", sc.getDocumentNumber());

        String docNum = documentNumberGenerator.generateNextNumber(DocumentType.PURCHASE_ORDER);

        PurchaseOrder po = PurchaseOrder.builder()
                .documentNumber(docNum)
                .saleConfirmation(sc)
                .status(PurchaseOrderStatus.ISSUED)
                .totalAmount(sc.getSaleAmount())
                .items(new ArrayList<>())
                .build();

        PurchaseOrderItem item = PurchaseOrderItem.builder()
                .itemDescription("Acquisition of Auction Lot LotID: " + sc.getWinner().getAuctionLot().getId())
                .quantity(1)
                .unitPrice(sc.getSaleAmount())
                .lineTotal(sc.getSaleAmount())
                .build();

        po.addItem(item);
        PurchaseOrder saved = purchaseOrderRepository.save(po);
        log.info("Purchase Order saved successfully: {}", saved.getDocumentNumber());

        // Business Rule 3: Purchase Order -> Platform Fee Calculation -> Fee Invoice
        invoiceService.calculateAndCreateInvoice(saved);

        return saved;
    }

    public PurchaseOrderResponse getById(UUID id) {
        PurchaseOrder po = purchaseOrderRepository.findByIdWithRelations(id)
                .orElseThrow(() -> new IllegalArgumentException("Purchase Order not found: " + id));
        return mapToResponse(po);
    }

    public PurchaseOrderResponse getBySaleConfirmationId(UUID scId) {
        PurchaseOrder po = purchaseOrderRepository.findBySaleConfirmationId(scId)
                .orElseThrow(() -> new IllegalArgumentException("Purchase Order not found for Sale Confirmation: " + scId));
        return mapToResponse(po);
    }

    private PurchaseOrderResponse mapToResponse(PurchaseOrder po) {
        if (po == null) return null;

        List<PurchaseOrderItemResponse> itemResponses = po.getItems().stream()
                .map(i -> PurchaseOrderItemResponse.builder()
                        .id(i.getId())
                        .itemDescription(i.getItemDescription())
                        .quantity(i.getQuantity())
                        .unitPrice(i.getUnitPrice())
                        .lineTotal(i.getLineTotal())
                        .build())
                .collect(Collectors.toList());

        return PurchaseOrderResponse.builder()
                .id(po.getId())
                .documentNumber(po.getDocumentNumber())
                .saleConfirmationId(po.getSaleConfirmation().getId())
                .saleConfirmationNumber(po.getSaleConfirmation().getDocumentNumber())
                .status(po.getStatus())
                .totalAmount(po.getTotalAmount())
                .createdAt(po.getCreatedAt())
                .items(itemResponses)
                .build();
    }
}
