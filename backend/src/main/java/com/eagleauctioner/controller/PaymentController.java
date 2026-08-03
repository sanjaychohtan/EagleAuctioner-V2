package com.eagleauctioner.controller;

import com.eagleauctioner.dto.PaymentDTOs.*;
import com.eagleauctioner.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

import com.eagleauctioner.aspect.EnforceDataScope;
import com.eagleauctioner.enums.DataScopeType;
import java.util.List;

/**
 * Enterprise REST Controller governing billing transactions, allocations, and receipts.
 */
@RestController
@RequestMapping({"/api/v1/finance/payments", "/api/payments"})
@RequiredArgsConstructor
@Slf4j
public class PaymentController {

    private final PaymentService paymentService;

    @GetMapping
    @PreAuthorize("hasAuthority('payment.view') or hasAuthority('finance.wallet.view') or hasRole('ADMIN') or hasRole('SUPER_ADMIN') or hasRole('FINANCE')")
    @EnforceDataScope(DataScopeType.COMPANY)
    public ResponseEntity<List<PaymentResponse>> getAllPayments() {
        log.info("REST API Request: Fetch all payments");
        return ResponseEntity.ok(paymentService.getAllPayments());
    }

    /**
     * Retrieves a payment by its ID. Includes IDOR safety barriers.
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('payment.view') or hasAuthority('finance.wallet.view') or hasRole('ADMIN') or hasRole('SUPER_ADMIN') or hasRole('SELLER') or hasRole('BIDDER')")
    @EnforceDataScope(DataScopeType.COMPANY)
    public ResponseEntity<PaymentResponse> getById(@PathVariable("id") UUID id) {
        log.info("REST API Request: Fetch Payment by ID: {}", id);
        return ResponseEntity.ok(paymentService.getById(id));
    }

    /**
     * Records a received cash payment against an approved settlement. Allocates funds.
     */
    @PostMapping("/settlement/{settlementId}")
    @PreAuthorize("hasAuthority('payment.create') or hasAuthority('finance.wallet.approve') or hasRole('ADMIN') or hasRole('SUPER_ADMIN') or hasRole('BIDDER')")
    @EnforceDataScope(DataScopeType.COMPANY)
    public ResponseEntity<PaymentResponse> receivePayment(
            @PathVariable("settlementId") UUID settlementId,
            @RequestBody @Valid PaymentRequest request) {
        log.info("REST API Request: Receive payment against Settlement ID: {}", settlementId);
        PaymentResponse response = paymentService.receivePayment(settlementId, request);
        return ResponseEntity.ok(response);
    }
}
