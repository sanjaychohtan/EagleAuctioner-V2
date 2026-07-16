package com.eagleauctioner.controller;

import com.eagleauctioner.dto.ReconciliationDTOs.*;
import com.eagleauctioner.service.ReconciliationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reconciliation")
@RequiredArgsConstructor
public class ReconciliationController {

    private final ReconciliationService reconciliationService;

    @PostMapping("/settlement")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SettlementReconciliationResponse> reconcileSettlement(
            @RequestBody ReconcileSettlementRequest request) {
        return ResponseEntity.ok(reconciliationService.reconcileSettlement(request));
    }

    @PostMapping("/bank")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BankReconciliationResponse> reconcileBankPayment(
            @RequestBody ReconcileBankRequest request) {
        return ResponseEntity.ok(reconciliationService.reconcileBankPayment(request));
    }
}
