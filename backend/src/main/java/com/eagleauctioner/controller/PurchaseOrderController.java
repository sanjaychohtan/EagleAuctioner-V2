package com.eagleauctioner.controller;

import com.eagleauctioner.dto.ApiResponse;
import com.eagleauctioner.dto.CommercialDocumentDTOs.PurchaseOrderResponse;
import com.eagleauctioner.entity.PurchaseOrder;
import com.eagleauctioner.repository.PurchaseOrderRepository;
import com.eagleauctioner.service.PurchaseOrderService;
import com.eagleauctioner.service.PdfGenerationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * Enterprise controller for Purchase Order document lifecycle.
 */
@RestController
@RequestMapping("/api/v1/purchase-orders")
@RequiredArgsConstructor
public class PurchaseOrderController {

    private final PurchaseOrderService purchaseOrderService;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final PdfGenerationService pdfGenerationService;

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('BIDDER', 'ADMIN', 'FINANCE')")
    public ResponseEntity<ApiResponse<PurchaseOrderResponse>> getById(@PathVariable UUID id) {
        PurchaseOrderResponse response = purchaseOrderService.getById(id);
        return ResponseEntity.ok(ApiResponse.success("Purchase Order retrieved", response));
    }

    @GetMapping("/{id}/pdf")
    @PreAuthorize("hasAnyRole('BIDDER', 'ADMIN', 'FINANCE')")
    public ResponseEntity<byte[]> downloadPdf(@PathVariable UUID id) {
        PurchaseOrder po = purchaseOrderRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Purchase Order not found: " + id));
        byte[] pdfBytes = pdfGenerationService.generatePurchaseOrderPdf(po);

        return ResponseEntity.ok()
                .header("Content-Type", "application/pdf")
                .header("Content-Disposition", "attachment; filename=" + pdfGenerationService.sanitizeFilename(po.getDocumentNumber()))
                .body(pdfBytes);
    }
}
