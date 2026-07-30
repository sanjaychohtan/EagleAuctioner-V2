package com.eagleauctioner.controller;

import com.eagleauctioner.dto.DashboardDTOs.*;
import com.eagleauctioner.service.DashboardService;
import com.eagleauctioner.entity.User;
import com.eagleauctioner.security.UserPrincipal;
import com.eagleauctioner.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

import com.eagleauctioner.aspect.EnforceDataScope;
import com.eagleauctioner.enums.DataScopeType;

@RestController
@RequestMapping({"/api/v1/analytics/dashboard", "/api/analytics/dashboard"})
@RequiredArgsConstructor
@Slf4j
@Validated
public class DashboardController {

    private final DashboardService dashboardService;
    private final UserRepository userRepository;

    private UUID getTenantId(String tenantHeader) {
        if (tenantHeader != null && !tenantHeader.trim().isEmpty()) {
            try {
                return UUID.fromString(tenantHeader.trim());
            } catch (IllegalArgumentException e) {
                log.warn("Invalid tenant ID format in header: {}. Using default.", tenantHeader);
            }
        }
        return UUID.fromString("00000000-0000-0000-0000-000000000000");
    }

    @GetMapping("/executive")
    @PreAuthorize("hasAuthority('dashboard.view') or hasAuthority('dashboard.admin') or hasRole('EXECUTIVE') or hasRole('ADMIN')")
    @EnforceDataScope(DataScopeType.COMPANY)
    public ResponseEntity<ExecutiveDashboardData> getExecutiveDashboard(
            @RequestHeader(value = "X-Tenant-Id", required = false) String tenantHeader) {
        UUID tenantId = getTenantId(tenantHeader);
        log.info("Fetching Executive Dashboard for tenant: {}", tenantId);
        return ResponseEntity.ok(dashboardService.getExecutiveDashboard(tenantId));
    }

    @GetMapping("/admin")
    @PreAuthorize("hasAuthority('dashboard.admin') or hasAuthority('admin.access') or hasRole('ADMIN')")
    @EnforceDataScope(DataScopeType.COMPANY)
    public ResponseEntity<AdminDashboardData> getAdminDashboard(
            @RequestHeader(value = "X-Tenant-Id", required = false) String tenantHeader) {
        UUID tenantId = getTenantId(tenantHeader);
        log.info("Fetching Admin Dashboard for tenant: {}", tenantId);
        return ResponseEntity.ok(dashboardService.getAdminDashboard(tenantId));
    }

    @GetMapping("/buyer")
    @PreAuthorize("hasAuthority('dashboard.view') or hasRole('BUYER') or hasRole('BIDDER')")
    @EnforceDataScope(DataScopeType.BUYER)
    public ResponseEntity<BuyerDashboardData> getBuyerDashboard(
            @RequestHeader(value = "X-Tenant-Id", required = false) String tenantHeader) {
        UUID buyerId = extractCurrentUserId(); 
        UUID tenantId = getTenantId(tenantHeader);
        log.info("Fetching Buyer Dashboard for user: {}, tenant: {}", buyerId, tenantId);
        return ResponseEntity.ok(dashboardService.getBuyerDashboard(buyerId, tenantId));
    }

    @GetMapping("/seller")
    @PreAuthorize("hasAuthority('dashboard.view') or hasRole('SELLER')")
    @EnforceDataScope(DataScopeType.SELLER)
    public ResponseEntity<SellerDashboardData> getSellerDashboard(
            @RequestHeader(value = "X-Tenant-Id", required = false) String tenantHeader) {
        UUID sellerId = extractCurrentUserId();
        UUID tenantId = getTenantId(tenantHeader);
        log.info("Fetching Seller Dashboard for user: {}, tenant: {}", sellerId, tenantId);
        return ResponseEntity.ok(dashboardService.getSellerDashboard(sellerId, tenantId));
    }

    @GetMapping("/finance")
    @PreAuthorize("hasAuthority('dashboard.view') or hasAuthority('finance.wallet.view') or hasRole('FINANCE') or hasRole('ADMIN')")
    @EnforceDataScope(DataScopeType.COMPANY)
    public ResponseEntity<FinanceDashboardData> getFinanceDashboard(
            @RequestHeader(value = "X-Tenant-Id", required = false) String tenantHeader) {
        UUID tenantId = getTenantId(tenantHeader);
        log.info("Fetching Finance Dashboard for tenant: {}", tenantId);
        return ResponseEntity.ok(dashboardService.getFinanceDashboard(tenantId));
    }

    @GetMapping("/operations")
    @PreAuthorize("hasAuthority('dashboard.view') or hasRole('OPERATIONS') or hasRole('ADMIN')")
    @EnforceDataScope(DataScopeType.COMPANY)
    public ResponseEntity<OperationsDashboardData> getOperationsDashboard(
            @RequestHeader(value = "X-Tenant-Id", required = false) String tenantHeader) {
        UUID tenantId = getTenantId(tenantHeader);
        log.info("Fetching Operations Dashboard for tenant: {}", tenantId);
        return ResponseEntity.ok(dashboardService.getOperationsDashboard(tenantId));
    }
    
    @PostMapping("/export")
    @PreAuthorize("hasAuthority('reports.export') or hasRole('ADMIN') or hasRole('EXECUTIVE') or hasRole('FINANCE') or hasRole('OPERATIONS')")
    @EnforceDataScope(DataScopeType.COMPANY)
    public ResponseEntity<ExportResponse> exportReport(@Valid @RequestBody ExportRequest request) {
        log.info("Exporting report with format: {}, scope: {}", request.getFormat(), request.getScope());
        return ResponseEntity.ok(dashboardService.exportReport(request));
    }
    
    @PostMapping("/schedule")
    @PreAuthorize("hasAuthority('reports.export') or hasRole('ADMIN') or hasRole('EXECUTIVE') or hasRole('FINANCE') or hasRole('OPERATIONS')")
    @EnforceDataScope(DataScopeType.COMPANY)
    public ResponseEntity<ScheduleResponse> scheduleReport(@Valid @RequestBody ScheduleRequest request) {
        log.info("Scheduling report to: {} with cron: {}", request.getRecipient(), request.getScheduleCron());
        return ResponseEntity.ok(dashboardService.scheduleReport(request));
    }

    @PostMapping("/invalidate-cache")
    @PreAuthorize("hasAuthority('dashboard.admin') or hasAuthority('admin.access') or hasRole('ADMIN')")
    @EnforceDataScope(DataScopeType.COMPANY)
    public ResponseEntity<Void> invalidateDashboardCache() {
        log.info("Invalidating dashboard cache manually");
        dashboardService.invalidateDashboardCache();
        return ResponseEntity.ok().build();
    }

    private UUID extractCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) {
            log.warn("Not authenticated context for extracting current user ID");
            return null;
        }
        if (auth.getPrincipal() instanceof UserPrincipal) {
            return ((UserPrincipal) auth.getPrincipal()).getId();
        }
        String email = auth.getName();
        return userRepository.findByEmailIgnoreCaseAndDeletedAtIsNull(email)
                .map(User::getId)
                .orElse(null);
    }
}
