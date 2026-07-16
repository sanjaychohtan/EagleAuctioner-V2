package com.eagleauctioner.controller;

import com.eagleauctioner.dto.ApiResponse;
import com.eagleauctioner.entity.Refund;
import com.eagleauctioner.service.RefundService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/refunds")
@RequiredArgsConstructor
public class RefundController {

    private final RefundService refundService;

    @PostMapping("/initiate")
    @PreAuthorize("hasRole('SELLER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Refund>> initiateRefund(
            @RequestParam("initiatorId") UUID initiatorId,
            @RequestParam("initiatorRole") String initiatorRole,
            @RequestParam("amount") Long amount) {
        
        Refund refund = refundService.initiateRefund(initiatorId, initiatorRole, amount);
        return ResponseEntity.ok(ApiResponse.success("Refund initiated successfully", refund));
    }

    @PostMapping("/{refundId}/approve")
    @PreAuthorize("hasRole('ADMIN') or hasRole('FINANCE') or hasRole('FINANCE_DIRECTOR')")
    public ResponseEntity<ApiResponse<Refund>> approveRefund(
            @PathVariable UUID refundId,
            @RequestParam("approverId") UUID approverId,
            @RequestParam("approverRole") String approverRole) {
        
        Refund refund = refundService.approveRefund(refundId, approverId, approverRole);
        return ResponseEntity.ok(ApiResponse.success("Refund level approved successfully", refund));
    }

    @PostMapping("/{refundId}/reject")
    @PreAuthorize("hasRole('ADMIN') or hasRole('FINANCE') or hasRole('FINANCE_DIRECTOR')")
    public ResponseEntity<ApiResponse<Refund>> rejectRefund(
            @PathVariable UUID refundId,
            @RequestParam("approverId") UUID approverId,
            @RequestParam("reason") String reason) {
        
        Refund refund = refundService.rejectRefund(refundId, approverId, reason);
        return ResponseEntity.ok(ApiResponse.success("Refund request rejected", refund));
    }
}
