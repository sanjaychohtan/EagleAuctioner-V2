package com.eagleauctioner.controller;

import com.eagleauctioner.dto.GSTInvoiceDTOs.*;
import com.eagleauctioner.service.GSTInvoiceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

import com.eagleauctioner.aspect.EnforceDataScope;
import com.eagleauctioner.enums.DataScopeType;

@RestController
@RequestMapping({"/api/v1/gst-invoices", "/api/gst-invoices"})
@RequiredArgsConstructor
@Slf4j
public class GSTInvoiceController {

    private final GSTInvoiceService gstInvoiceService;

    @PostMapping("/generate")
    @PreAuthorize("hasAuthority('invoice.create') or hasAuthority('settlement.approve') or hasRole('ADMIN') or hasRole('FINANCE')")
    @EnforceDataScope(DataScopeType.COMPANY)
    public ResponseEntity<GSTInvoiceResponse> generateInvoice(@RequestBody GSTInvoiceRequest request) {
        return ResponseEntity.ok(gstInvoiceService.generateInvoice(request.getSettlementId()));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('invoice.view') or hasRole('ADMIN') or hasRole('FINANCE') or hasRole('BUYER') or hasRole('SELLER')")
    @EnforceDataScope(DataScopeType.COMPANY)
    public ResponseEntity<GSTInvoiceResponse> getInvoice(@PathVariable UUID id) {
        return ResponseEntity.ok(gstInvoiceService.getById(id));
    }

    @GetMapping("/seller/{sellerId}")
    @PreAuthorize("hasAuthority('invoice.view') or hasRole('ADMIN') or hasRole('FINANCE') or hasRole('SELLER')")
    @EnforceDataScope(DataScopeType.COMPANY)
    public ResponseEntity<List<GSTInvoiceResponse>> getSellerInvoices(@PathVariable UUID sellerId) {
        return ResponseEntity.ok(gstInvoiceService.getBySellerId(sellerId));
    }
}
