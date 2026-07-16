package com.eagleauctioner.controller;

import com.eagleauctioner.dto.ApiResponse;
import com.eagleauctioner.dto.CommercialDocumentDTOs.SaleConfirmationResponse;
import com.eagleauctioner.entity.SaleConfirmation;
import com.eagleauctioner.enums.SaleConfirmationStatus;
import com.eagleauctioner.repository.SaleConfirmationRepository;
import com.eagleauctioner.service.SaleConfirmationService;
import com.eagleauctioner.service.PdfGenerationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * Enterprise controller for Sale Confirmation document lifecycle.
 */
@RestController
@RequestMapping("/api/v1/sale-confirmations")
@RequiredArgsConstructor
public class SaleConfirmationController {

    private final SaleConfirmationService saleConfirmationService;
    private final SaleConfirmationRepository saleConfirmationRepository;
    private final PdfGenerationService pdfGenerationService;

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('BIDDER', 'SELLER', 'ADMIN', 'FINANCE')")
    public ResponseEntity<ApiResponse<SaleConfirmationResponse>> getById(@PathVariable UUID id) {
        SaleConfirmationResponse response = saleConfirmationService.getById(id);
        return ResponseEntity.ok(ApiResponse.success("Sale Confirmation retrieved", response));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE', 'BIDDER', 'SELLER')")
    public ResponseEntity<ApiResponse<SaleConfirmationResponse>> updateStatus(
            @PathVariable UUID id,
            @RequestParam SaleConfirmationStatus status,
            @RequestParam String reason) {
        String actor = "USER"; // Replace with SecurityContext logic
        SaleConfirmationResponse response = saleConfirmationService.updateStatus(id, status, reason, actor);
        return ResponseEntity.ok(ApiResponse.success("Status updated", response));
    }

    @GetMapping("/{id}/pdf")
    @PreAuthorize("hasAnyRole('BIDDER', 'SELLER', 'ADMIN', 'FINANCE')")
    public ResponseEntity<byte[]> downloadPdf(@PathVariable UUID id) {
        SaleConfirmation sc = saleConfirmationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Sale Confirmation not found: " + id));
        byte[] pdfBytes = pdfGenerationService.generateSaleConfirmationPdf(sc);

        return ResponseEntity.ok()
                .header("Content-Type", "application/pdf")
                .header("Content-Disposition", "attachment; filename=" + pdfGenerationService.sanitizeFilename(sc.getDocumentNumber()))
                .body(pdfBytes);
    }
}
