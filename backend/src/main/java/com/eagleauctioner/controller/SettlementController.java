package com.eagleauctioner.controller;

import com.eagleauctioner.dto.SettlementHistoryDto;
import com.eagleauctioner.dto.SettlementRequest;
import com.eagleauctioner.dto.SettlementResponse;
import com.eagleauctioner.enums.SettlementStatus;
import com.eagleauctioner.service.SettlementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Enterprise REST Controller governing Settlement Core operations.
 * Protected with RBAC annotations and strict IDOR/Security verification.
 */
@RestController
@RequestMapping("/api/v1/settlements")
@RequiredArgsConstructor
@Slf4j
public class SettlementController {

    private final SettlementService settlementService;

    /**
     * Generates a Settlement for an ACCEPTED Contract.
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SELLER', 'BIDDER')")
    public ResponseEntity<SettlementResponse> generateSettlement(@RequestBody @Valid SettlementRequest request) {
        log.info("REST API Request: Generate settlement for contract ID: {}", request.getContractId());
        SettlementResponse response = settlementService.generateSettlement(request.getContractId());
        return ResponseEntity.ok(response);
    }

    /**
     * Retrieves a Settlement by its ID.
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SELLER', 'BIDDER')")
    public ResponseEntity<SettlementResponse> getById(@PathVariable("id") UUID id) {
        log.info("REST API Request: Fetch settlement by ID: {}", id);
        return ResponseEntity.ok(settlementService.getById(id));
    }

    /**
     * Retrieves a Settlement by associated Contract ID.
     */
    @GetMapping("/contract/{contractId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SELLER', 'BIDDER')")
    public ResponseEntity<SettlementResponse> getByContractId(@PathVariable("contractId") UUID contractId) {
        log.info("REST API Request: Fetch settlement by Contract ID: {}", contractId);
        return ResponseEntity.ok(settlementService.getByContractId(contractId));
    }

    /**
     * Retrieves the status of a Settlement by its ID.
     */
    @GetMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'SELLER', 'BIDDER')")
    public ResponseEntity<SettlementStatus> getStatus(@PathVariable("id") UUID id) {
        log.info("REST API Request: Fetch settlement status by ID: {}", id);
        return ResponseEntity.ok(settlementService.getStatus(id));
    }

    /**
     * Submits a Settlement for approval.
     */
    @PostMapping("/{id}/submit")
    @PreAuthorize("hasAnyRole('ADMIN', 'SELLER', 'BIDDER')")
    public ResponseEntity<SettlementResponse> submitForApproval(@PathVariable("id") UUID id) {
        log.info("REST API Request: Submit settlement for approval ID: {}", id);
        return ResponseEntity.ok(settlementService.submitForApproval(id));
    }

    /**
     * Approves a Settlement.
     */
    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('ADMIN', 'SELLER')")
    public ResponseEntity<SettlementResponse> approveSettlement(@PathVariable("id") UUID id) {
        log.info("REST API Request: Approve settlement ID: {}", id);
        return ResponseEntity.ok(settlementService.approveSettlement(id));
    }

    /**
     * Transition from APPROVED to PAYMENT_PENDING.
     */
    @PostMapping("/{id}/payment-pending")
    @PreAuthorize("hasAnyRole('ADMIN', 'SELLER')")
    public ResponseEntity<SettlementResponse> transitionToPaymentPending(@PathVariable("id") UUID id) {
        log.info("REST API Request: Transition settlement to PAYMENT_PENDING ID: {}", id);
        return ResponseEntity.ok(settlementService.transitionToPaymentPending(id));
    }

    /**
     * Transition from PAYMENT_PENDING to PAYMENT_RECEIVED.
     */
    @PostMapping("/{id}/receive-payment")
    @PreAuthorize("hasAnyRole('ADMIN', 'SELLER')")
    public ResponseEntity<SettlementResponse> receivePayment(
            @PathVariable("id") UUID id,
            @RequestBody(required = false) SettlementRequest request) {
        String remarks = (request != null) ? request.getRemarks() : null;
        log.info("REST API Request: Receive payment for settlement ID: {}, Remarks: {}", id, remarks);
        return ResponseEntity.ok(settlementService.receivePayment(id, remarks));
    }

    /**
     * Rejects a Settlement.
     */
    @PostMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('ADMIN', 'SELLER')")
    public ResponseEntity<SettlementResponse> rejectSettlement(
            @PathVariable("id") UUID id,
            @RequestBody(required = false) SettlementRequest request) {
        String reason = (request != null) ? request.getReason() : null;
        log.info("REST API Request: Reject settlement ID: {}, Reason: {}", id, reason);
        return ResponseEntity.ok(settlementService.rejectSettlement(id, (reason != null && !reason.trim().isEmpty()) ? reason : "Rejected by counterparty."));
    }

    /**
     * Completes a Settlement.
     */
    @PostMapping("/{id}/complete")
    @PreAuthorize("hasAnyRole('ADMIN', 'SELLER')")
    public ResponseEntity<SettlementResponse> completeSettlement(
            @PathVariable("id") UUID id,
            @RequestBody(required = false) SettlementRequest request) {
        String remarks = (request != null) ? request.getRemarks() : null;
        log.info("REST API Request: Complete settlement ID: {}, Remarks: {}", id, remarks);
        return ResponseEntity.ok(settlementService.completeSettlement(id, remarks));
    }

    /**
     * Cancels a Settlement.
     */
    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('ADMIN', 'SELLER', 'BIDDER')")
    public ResponseEntity<SettlementResponse> cancelSettlement(
            @PathVariable("id") UUID id,
            @RequestBody(required = false) SettlementRequest request) {
        String reason = (request != null) ? request.getReason() : null;
        log.info("REST API Request: Cancel settlement ID: {}, Reason: {}", id, reason);
        return ResponseEntity.ok(settlementService.cancelSettlement(id, (reason != null && !reason.trim().isEmpty()) ? reason : "Settlement cancelled."));
    }

    /**
     * Adds an operational remark to a Settlement.
     */
    @PostMapping("/{id}/remarks")
    @PreAuthorize("hasAnyRole('ADMIN', 'SELLER')")
    public ResponseEntity<Void> addRemark(
            @PathVariable("id") UUID id,
            @RequestBody @Valid SettlementRequest request) {
        log.info("REST API Request: Add remark to settlement ID: {}", id);
        settlementService.addRemark(id, request.getRemarks());
        return ResponseEntity.ok().build();
    }

    /**
     * Retrieves complete immutable history.
     */
    @GetMapping("/{id}/history")
    @PreAuthorize("hasAnyRole('ADMIN', 'SELLER', 'BIDDER')")
    public ResponseEntity<List<SettlementHistoryDto>> getHistory(@PathVariable("id") UUID id) {
        log.info("REST API Request: Get settlement history ID: {}", id);
        return ResponseEntity.ok(settlementService.getHistory(id));
    }

    /**
     * Retrieves chronological workflow timeline.
     */
    @GetMapping("/{id}/timeline")
    @PreAuthorize("hasAnyRole('ADMIN', 'SELLER', 'BIDDER')")
    public ResponseEntity<List<SettlementHistoryDto>> getTimeline(@PathVariable("id") UUID id) {
        log.info("REST API Request: Get settlement timeline ID: {}", id);
        return ResponseEntity.ok(settlementService.getTimeline(id));
    }

    /**
     * Retrieves operational remarks.
     */
    @GetMapping("/{id}/remarks")
    @PreAuthorize("hasAnyRole('ADMIN', 'SELLER', 'BIDDER')")
    public ResponseEntity<List<String>> getRemarks(@PathVariable("id") UUID id) {
        log.info("REST API Request: Get settlement remarks ID: {}", id);
        return ResponseEntity.ok(settlementService.getRemarks(id));
    }
}
