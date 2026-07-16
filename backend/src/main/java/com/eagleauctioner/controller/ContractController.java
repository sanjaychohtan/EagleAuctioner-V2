package com.eagleauctioner.controller;

import com.eagleauctioner.dto.ContractSettlementPaymentDTOs.*;
import com.eagleauctioner.service.ContractService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Enterprise REST Controller governing legal contract signatures and queries.
 * Locked down with Spring Security annotations and strict RBAC validation.
 */
@RestController
@RequestMapping("/api/v1/contracts")
@RequiredArgsConstructor
@Slf4j
public class ContractController {

    private final ContractService contractService;

    /**
     * Retrieves a Contract by its ID. Includes standard IDOR verification checks.
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SELLER', 'BIDDER')")
    public ResponseEntity<ContractResponse> getById(@PathVariable("id") UUID id) {
        log.info("REST API Request: Fetch contract by ID: {}", id);
        return ResponseEntity.ok(contractService.getById(id));
    }

    /**
     * Retrieves a Contract by associated Auction Winner ID.
     */
    @GetMapping("/winner/{winnerId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SELLER', 'BIDDER')")
    public ResponseEntity<ContractResponse> getByWinnerId(@PathVariable("winnerId") UUID winnerId) {
        log.info("REST API Request: Fetch contract by Winner ID: {}", winnerId);
        return ResponseEntity.ok(contractService.getByWinnerId(winnerId));
    }

    /**
     * Signs/Accepts a contract. Automatically transitions status and cascades to settlement drafting.
     */
    @PostMapping("/{id}/accept")
    @PreAuthorize("hasAnyRole('ADMIN', 'BIDDER')")
    public ResponseEntity<ContractResponse> acceptContract(
            @PathVariable("id") UUID id,
            @RequestBody @Valid ContractRequest request) {
        log.info("REST API Request: Accept/Sign contract by ID: {}", id);
        ContractResponse response = contractService.acceptContract(id, request.getChangeReason());
        return ResponseEntity.ok(response);
    }

    /**
     * Rejects a contract draft. Used when terms are disputed.
     */
    @PostMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('ADMIN', 'BIDDER')")
    public ResponseEntity<ContractResponse> rejectContract(
            @PathVariable("id") UUID id,
            @RequestBody @Valid ContractRequest request) {
        log.info("REST API Request: Reject contract by ID: {}", id);
        return ResponseEntity.ok(contractService.rejectContract(id, request.getChangeReason()));
    }

    /**
     * Terminates an existing contract. Severe action usually reserved for defaults or legal breaks.
     */
    @PostMapping("/{id}/terminate")
    @PreAuthorize("hasAnyRole('ADMIN', 'SELLER')")
    public ResponseEntity<ContractResponse> terminateContract(
            @PathVariable("id") UUID id,
            @RequestBody @Valid ContractRequest request) {
        log.info("REST API Request: Terminate contract by ID: {}", id);
        return ResponseEntity.ok(contractService.terminateContract(id, request.getChangeReason()));
    }

    /**
     * Retrieves the complete version history/audit trail of a contract.
     */
    @GetMapping("/{id}/history")
    @PreAuthorize("hasAnyRole('ADMIN', 'SELLER', 'BIDDER')")
    public ResponseEntity<List<ContractVersionResponse>> getHistory(@PathVariable("id") UUID id) {
        log.info("REST API Request: Fetch contract history by ID: {}", id);
        return ResponseEntity.ok(contractService.getContractHistory(id));
    }
}
