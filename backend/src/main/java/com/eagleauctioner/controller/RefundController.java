package com.eagleauctioner.controller;

import com.eagleauctioner.dto.ApiResponse;
import com.eagleauctioner.entity.Refund;
import com.eagleauctioner.service.RefundService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;
import java.util.List;

import com.eagleauctioner.aspect.EnforceDataScope;
import com.eagleauctioner.enums.DataScopeType;

@RestController
@RequestMapping({"/api/v1/finance/refunds", "/api/v1/refunds", "/api/refunds"})
@RequiredArgsConstructor
@Slf4j
public class RefundController {

    private final RefundService refundService;

    @GetMapping
    @PreAuthorize("hasAuthority('refund.approve') or hasRole('ADMIN') or hasRole('SUPER_ADMIN') or hasRole('FINANCE')")
    @EnforceDataScope(DataScopeType.COMPANY)
    public ResponseEntity<ApiResponse<List<Refund>>> getAllRefunds() {
        log.info("REST API Request: Fetch all refunds");
        return ResponseEntity.ok(ApiResponse.success("Refunds list retrieved successfully", refundService.getAllRefunds()));
    }

    @PostMapping("/initiate")
    @PreAuthorize("hasAuthority('refund.create') or hasRole('SELLER') or hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    @EnforceDataScope(DataScopeType.COMPANY)
    public ResponseEntity<ApiResponse<Refund>> initiateRefund(
            @RequestParam("initiatorId") UUID initiatorId,
            @RequestParam("initiatorRole") String initiatorRole,
            @RequestParam("amount") Long amount) {
        
        Refund refund = refundService.initiateRefund(initiatorId, initiatorRole, amount);
        return ResponseEntity.ok(ApiResponse.success("Refund initiated successfully", refund));
    }

    @PostMapping("/{refundId}/approve")
    @PreAuthorize("hasAuthority('refund.approve') or hasAuthority('finance.wallet.approve') or hasRole('ADMIN') or hasRole('SUPER_ADMIN') or hasRole('FINANCE') or hasRole('FINANCE_DIRECTOR')")
    @EnforceDataScope(DataScopeType.COMPANY)
    public ResponseEntity<ApiResponse<Refund>> approveRefund(
            @PathVariable UUID refundId,
            @RequestParam("approverId") UUID approverId,
            @RequestParam("approverRole") String approverRole) {
        
        Refund refund = refundService.approveRefund(refundId, approverId, approverRole);
        return ResponseEntity.ok(ApiResponse.success("Refund level approved successfully", refund));
    }

    @PostMapping("/{refundId}/reject")
    @PreAuthorize("hasAuthority('refund.approve') or hasAuthority('finance.wallet.approve') or hasRole('ADMIN') or hasRole('SUPER_ADMIN') or hasRole('FINANCE') or hasRole('FINANCE_DIRECTOR')")
    @EnforceDataScope(DataScopeType.COMPANY)
    public ResponseEntity<ApiResponse<Refund>> rejectRefund(
            @PathVariable UUID refundId,
            @RequestParam("approverId") UUID approverId,
            @RequestParam("reason") String reason) {
        
        Refund refund = refundService.rejectRefund(refundId, approverId, reason);
        return ResponseEntity.ok(ApiResponse.success("Refund request rejected", refund));
    }
}
