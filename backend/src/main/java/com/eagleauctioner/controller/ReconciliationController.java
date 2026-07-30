package com.eagleauctioner.controller;

import com.eagleauctioner.dto.ReconciliationDTOs.*;
import com.eagleauctioner.service.ReconciliationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.eagleauctioner.aspect.EnforceDataScope;
import com.eagleauctioner.enums.DataScopeType;

@RestController
@RequestMapping({"/api/v1/reconciliation", "/api/reconciliation"})
@RequiredArgsConstructor
public class ReconciliationController {

    private final ReconciliationService reconciliationService;

    @PostMapping("/settlement")
    @PreAuthorize("hasAuthority('reconciliation.perform') or hasAuthority('finance.wallet.approve') or hasRole('ADMIN')")
    @EnforceDataScope(DataScopeType.COMPANY)
    public ResponseEntity<SettlementReconciliationResponse> reconcileSettlement(
            @RequestBody ReconcileSettlementRequest request) {
        return ResponseEntity.ok(reconciliationService.reconcileSettlement(request));
    }

    @PostMapping("/bank")
    @PreAuthorize("hasAuthority('reconciliation.perform') or hasAuthority('finance.wallet.approve') or hasRole('ADMIN')")
    @EnforceDataScope(DataScopeType.COMPANY)
    public ResponseEntity<BankReconciliationResponse> reconcileBankPayment(
            @RequestBody ReconcileBankRequest request) {
        return ResponseEntity.ok(reconciliationService.reconcileBankPayment(request));
    }
}
