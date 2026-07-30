package com.eagleauctioner.controller;

import com.eagleauctioner.dto.ApiResponse;
import com.eagleauctioner.dto.CommercialDocumentDTOs.FeeInvoiceResponse;
import com.eagleauctioner.entity.FeeInvoice;
import com.eagleauctioner.repository.FeeInvoiceRepository;
import com.eagleauctioner.service.InvoiceService;
import com.eagleauctioner.service.PdfGenerationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

import com.eagleauctioner.aspect.EnforceDataScope;
import com.eagleauctioner.enums.DataScopeType;

/**
 * Enterprise controller for Platform Fee Invoice document lifecycle.
 */
@RestController
@RequestMapping({"/api/v1/fee-invoices", "/api/fee-invoices"})
@RequiredArgsConstructor
public class InvoiceController {

    private final InvoiceService invoiceService;
    private final FeeInvoiceRepository feeInvoiceRepository;
    private final PdfGenerationService pdfGenerationService;

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('invoice.view') or hasAuthority('finance.wallet.view') or hasRole('BIDDER') or hasRole('ADMIN') or hasRole('FINANCE')")
    @EnforceDataScope(DataScopeType.COMPANY)
    public ResponseEntity<ApiResponse<FeeInvoiceResponse>> getById(@PathVariable UUID id) {
        FeeInvoiceResponse response = invoiceService.getById(id);
        return ResponseEntity.ok(ApiResponse.success("Fee Invoice retrieved", response));
    }

    @PostMapping("/{id}/pay")
    @PreAuthorize("hasAuthority('invoice.pay') or hasAuthority('payment.create') or hasRole('BIDDER') or hasRole('ADMIN') or hasRole('FINANCE')")
    @EnforceDataScope(DataScopeType.COMPANY)
    public ResponseEntity<ApiResponse<FeeInvoiceResponse>> payInvoice(@PathVariable UUID id) {
        FeeInvoiceResponse response = invoiceService.payInvoice(id);
        return ResponseEntity.ok(ApiResponse.success("Invoice paid", response));
    }

    @GetMapping("/{id}/pdf")
    @PreAuthorize("hasAuthority('invoice.view') or hasRole('BIDDER') or hasRole('ADMIN') or hasRole('FINANCE')")
    @EnforceDataScope(DataScopeType.COMPANY)
    public ResponseEntity<byte[]> downloadPdf(@PathVariable UUID id) {
        FeeInvoice fi = feeInvoiceRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Fee Invoice not found: " + id));
        byte[] pdfBytes = pdfGenerationService.generateFeeInvoicePdf(fi);

        return ResponseEntity.ok()
                .header("Content-Type", "application/pdf")
                .header("Content-Disposition", "attachment; filename=" + pdfGenerationService.sanitizeFilename(fi.getDocumentNumber()))
                .body(pdfBytes);
    }
}
