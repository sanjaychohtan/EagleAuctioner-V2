package com.eagleauctioner.controller;

import com.eagleauctioner.entity.*;
import com.eagleauctioner.enums.Module;
import com.eagleauctioner.enums.NotificationChannel;
import com.eagleauctioner.enums.NotificationType;
import com.eagleauctioner.service.AdminOperationsService;
import com.eagleauctioner.repository.UserRepository;
import com.eagleauctioner.exception.BusinessException;
import jakarta.validation.constraints.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;

import com.eagleauctioner.aspect.EnforceDataScope;
import com.eagleauctioner.enums.DataScopeType;

@RestController
@RequestMapping("/api/v1/admin")
@PreAuthorize("hasAuthority('admin.access') or hasAuthority('role.manage') or hasAuthority('kyc.review') or hasAuthority('seller.review') or hasRole('ADMIN')")
@Validated
@RequiredArgsConstructor
public class AdminOperationsController {

    private final AdminOperationsService adminService;
    private final UserRepository userRepository;

    private UUID getAdminId() {
        if (SecurityContextHolder.getContext().getAuthentication() == null) {
            throw new BusinessException("Unauthorized: No authentication context available");
        }
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        try {
            return UUID.fromString(username);
        } catch (Exception ex) {
            return userRepository.findByEmailIgnoreCaseAndDeletedAtIsNull(username)
                    .map(User::getId)
                    .orElseThrow(() -> new BusinessException("Unauthorized: Admin user not found with username: " + username));
        }
    }

    @PostMapping("/users/{userId}/status")
    @PreAuthorize("hasAuthority('user.disable') or hasAuthority('user.manage') or hasRole('ADMIN')")
    @EnforceDataScope(DataScopeType.COMPANY)
    public ResponseEntity<User> updateUserStatus(
            @PathVariable UUID userId,
            @RequestParam boolean active,
            @RequestParam boolean locked) {
        return ResponseEntity.ok(adminService.updateUserStatus(userId, active, locked, getAdminId()));
    }

    @PostMapping("/users/{userId}/roles")
    @PreAuthorize("hasAuthority('role.manage') or hasRole('ADMIN')")
    @EnforceDataScope(DataScopeType.COMPANY)
    public ResponseEntity<User> assignRoles(
            @PathVariable UUID userId,
            @RequestBody @NotEmpty(message = "Role IDs are required") List<UUID> roleIds) {
        return ResponseEntity.ok(adminService.assignUserRoles(userId, roleIds, getAdminId()));
    }

    @PostMapping("/roles")
    @PreAuthorize("hasAuthority('role.manage') or hasRole('ADMIN')")
    @EnforceDataScope(DataScopeType.COMPANY)
    public ResponseEntity<Role> createRole(
            @RequestParam @NotBlank(message = "Role name is required") @Size(min = 3, max = 50, message = "Role name must be between 3 and 50 characters") String roleName,
            @RequestParam @Size(max = 255, message = "Description must not exceed 255 characters") String description,
            @RequestBody @NotEmpty(message = "Permission IDs are required") List<UUID> permissionIds) {
        return ResponseEntity.ok(adminService.createRole(roleName, description, permissionIds, getAdminId()));
    }

    @PostMapping("/permissions")
    @PreAuthorize("hasAuthority('role.manage') or hasRole('ADMIN')")
    @EnforceDataScope(DataScopeType.COMPANY)
    public ResponseEntity<Permission> createPermission(
            @RequestParam @NotBlank(message = "Permission name is required") @Size(min = 3, max = 100, message = "Permission name must be between 3 and 100 characters") String name,
            @RequestParam @NotNull(message = "Module is required") Module module,
            @RequestParam @Size(max = 255, message = "Description must not exceed 255 characters") String description) {
        return ResponseEntity.ok(adminService.createPermission(name, module, description, getAdminId()));
    }

    @PostMapping("/kyc/{profileId}/review")
    @PreAuthorize("hasAuthority('kyc.review')")
    @EnforceDataScope(DataScopeType.COMPANY)
    public ResponseEntity<KycReview> reviewKyc(
            @PathVariable UUID profileId,
            @RequestParam @NotBlank(message = "Decision is required") @Pattern(regexp = "^(APPROVED|REJECTED)$", message = "Decision must be APPROVED or REJECTED") String decision,
            @RequestParam @NotBlank(message = "Notes are required") @Size(max = 1000, message = "Notes must not exceed 1000 characters") String notes) {
        return ResponseEntity.ok(adminService.performKycReview(profileId, getAdminId(), decision, notes));
    }

    @PostMapping("/seller/{profileId}/review")
    @PreAuthorize("hasAuthority('seller.review') or hasAuthority('kyc.review')")
    @EnforceDataScope(DataScopeType.COMPANY)
    public ResponseEntity<SellerReview> reviewSeller(
            @PathVariable UUID profileId,
            @RequestParam @NotBlank(message = "Decision is required") @Pattern(regexp = "^(APPROVED|REJECTED)$", message = "Decision must be APPROVED or REJECTED") String decision,
            @RequestParam @NotBlank(message = "Notes are required") @Size(max = 1000, message = "Notes must not exceed 1000 characters") String notes) {
        return ResponseEntity.ok(adminService.performSellerReview(profileId, getAdminId(), decision, notes));
    }

    @PostMapping("/auction-lots/{lotId}/override")
    @PreAuthorize("hasAuthority('winner.override') or hasAuthority('admin.access') or hasRole('ADMIN')")
    @EnforceDataScope(DataScopeType.COMPANY)
    public ResponseEntity<AuctionLot> overrideWinner(
            @PathVariable UUID lotId,
            @RequestParam UUID targetBidderProfileId,
            @RequestParam @NotBlank(message = "Reason is required") @Size(max = 1000, message = "Reason must not exceed 1000 characters") String reason) {
        return ResponseEntity.ok(adminService.overrideAuctionWinner(lotId, targetBidderProfileId, getAdminId(), reason));
    }

    @PostMapping("/tickets/{ticketId}/status")
    @PreAuthorize("hasAuthority('support.ticket.update') or hasAuthority('support.ticket.close') or hasRole('ADMIN')")
    @EnforceDataScope(DataScopeType.COMPANY)
    public ResponseEntity<SupportTicket> updateTicketStatus(
            @PathVariable UUID ticketId,
            @RequestParam @NotBlank(message = "Status is required") @Pattern(regexp = "^(OPEN|IN_PROGRESS|RESOLVED|CLOSED)$", message = "Invalid support ticket status") String status) {
        return ResponseEntity.ok(adminService.updateTicketStatus(ticketId, status, getAdminId()));
    }

    @PostMapping("/disputes/{disputeId}/resolve")
    @PreAuthorize("hasAuthority('support.dispute.resolve') or hasRole('ADMIN')")
    @EnforceDataScope(DataScopeType.COMPANY)
    public ResponseEntity<Dispute> resolveDispute(
            @PathVariable UUID disputeId,
            @RequestParam @NotBlank(message = "Status is required") @Pattern(regexp = "^(OPEN|UNDER_INVESTIGATION|SETTLED|DISMISSED)$", message = "Invalid dispute status") String status,
            @RequestParam @NotBlank(message = "Resolution notes are required") @Size(max = 2000, message = "Resolution notes must not exceed 2000 characters") String resolutionNotes) {
        return ResponseEntity.ok(adminService.resolveDispute(disputeId, status, resolutionNotes, getAdminId()));
    }

    @PostMapping("/templates")
    @PreAuthorize("hasAuthority('notification.manage') or hasRole('ADMIN')")
    @EnforceDataScope(DataScopeType.COMPANY)
    public ResponseEntity<NotificationTemplate> createTemplate(
            @RequestParam @NotBlank(message = "Template name is required") @Size(max = 100, message = "Name must not exceed 100 characters") String name,
            @RequestParam @NotNull(message = "Notification type is required") NotificationType type,
            @RequestParam @NotNull(message = "Channel is required") NotificationChannel channel,
            @RequestParam @NotBlank(message = "Subject is required") @Size(max = 255, message = "Subject must not exceed 255 characters") String subject,
            @RequestParam @NotBlank(message = "Body is required") String body) {
        return ResponseEntity.ok(adminService.createOrUpdateTemplate(name, type, channel, subject, body, getAdminId()));
    }

    @PostMapping("/features")
    @PreAuthorize("hasAuthority('system.feature_flags.manage') or hasAuthority('admin.access') or hasRole('ADMIN')")
    @EnforceDataScope(DataScopeType.COMPANY)
    public ResponseEntity<FeatureFlag> setFeatureFlag(
            @RequestParam @NotBlank(message = "Flag key is required") @Size(max = 100, message = "Key must not exceed 100 characters") String flagKey,
            @RequestParam boolean enabled,
            @RequestParam @Size(max = 500, message = "Description must not exceed 500 characters") String description) {
        return ResponseEntity.ok(adminService.setFeatureFlag(flagKey, enabled, description, getAdminId()));
    }

    @PostMapping("/config")
    @PreAuthorize("hasAuthority('system.config.manage') or hasAuthority('admin.access') or hasRole('ADMIN')")
    @EnforceDataScope(DataScopeType.COMPANY)
    public ResponseEntity<FinancialConfiguration> setSystemConfig(
            @RequestParam @NotBlank(message = "Config key is required") @Size(max = 100, message = "Key must not exceed 100 characters") String configKey,
            @RequestParam @NotBlank(message = "Config value is required") @Size(max = 1000, message = "Value must not exceed 1000 characters") String configValue,
            @RequestParam @Size(max = 500, message = "Description must not exceed 500 characters") String description) {
        return ResponseEntity.ok(adminService.setSystemConfig(configKey, configValue, description, getAdminId()));
    }

    @GetMapping("/audit/user/{userId}")
    @PreAuthorize("hasAuthority('audit.view') or hasAuthority('admin.access') or hasRole('ADMIN')")
    @EnforceDataScope(DataScopeType.COMPANY)
    public ResponseEntity<List<AuditLog>> getUserAudits(@PathVariable UUID userId) {
        return ResponseEntity.ok(adminService.getAuditLogsForUser(userId));
    }

    @GetMapping("/audit/entity/{entityType}/{entityId}")
    @PreAuthorize("hasAuthority('audit.view') or hasAuthority('admin.access') or hasRole('ADMIN')")
    @EnforceDataScope(DataScopeType.COMPANY)
    public ResponseEntity<List<AuditLog>> getEntityAudits(
            @PathVariable String entityType,
            @PathVariable String entityId) {
        return ResponseEntity.ok(adminService.getAuditLogsForEntity(entityType, entityId));
    }
}
