package com.eagleauctioner.service;

import com.eagleauctioner.enums.DocumentType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Enterprise facade service for centralized commercial document operations.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class DocumentService {

    private final SaleConfirmationService saleConfirmationService;
    private final PurchaseOrderService purchaseOrderService;
    private final InvoiceService invoiceService;
    private final GSTInvoiceService gstInvoiceService;

    /**
     * Centralized retrieval of any commercial document by ID and type.
     */
    public Object getDocument(UUID id, DocumentType type) {
        log.info("Centralized document retrieval request: ID={}, Type={}", id, type);
        switch (type) {
            case SALE_CONFIRMATION:
                return saleConfirmationService.getById(id);
            case PURCHASE_ORDER:
                return purchaseOrderService.getById(id);
            case FEE_INVOICE:
                return invoiceService.getById(id);
            case GST_INVOICE:
                return gstInvoiceService.getById(id);
            default:
                throw new IllegalArgumentException("Unsupported or unhandled document type: " + type);
        }
    }
}
