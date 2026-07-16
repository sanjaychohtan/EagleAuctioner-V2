package com.eagleauctioner.controller;

import com.eagleauctioner.dto.PaymentRequest;
import com.eagleauctioner.dto.PaymentResponse;
import com.eagleauctioner.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * Enterprise REST Controller governing billing transactions, allocations, and receipts.
 */
@RestController
@RequestMapping("/api/v1/finance/payments")
@RequiredArgsConstructor
@Slf4j
public class PaymentController {

    private final PaymentService paymentService;

    /**
     * Retrieves a payment by its ID. Includes IDOR safety barriers.
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SELLER', 'BIDDER')")
    public ResponseEntity<PaymentResponse> getById(@PathVariable("id") UUID id) {
        log.info("REST API Request: Fetch Payment by ID: {}", id);
        return ResponseEntity.ok(paymentService.getById(id));
    }

    /**
     * Records a received cash payment against an approved settlement. Allocates funds.
     */
    @PostMapping("/settlement/{settlementId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'BIDDER')")
    public ResponseEntity<PaymentResponse> receivePayment(
            @PathVariable("settlementId") UUID settlementId,
            @RequestBody @Valid PaymentRequest request) {
        log.info("REST API Request: Receive payment against Settlement ID: {}", settlementId);
        PaymentResponse response = paymentService.receivePayment(settlementId, request);
        return ResponseEntity.ok(response);
    }
}
