package com.eagleauctioner.service;

import com.eagleauctioner.entity.*;
import com.eagleauctioner.enums.*;
import java.util.List;
import java.util.UUID;

public interface AdminOperationsService {
    User updateUserStatus(UUID userId, boolean active, boolean locked, UUID adminId);
    User assignUserRoles(UUID userId, List<UUID> roleIds, UUID adminId);
    Role createRole(String roleName, String description, List<UUID> permissionIds, UUID adminId);
    Permission createPermission(String name, com.eagleauctioner.enums.Module module, String description, UUID adminId);
    KycReview performKycReview(UUID profileId, UUID reviewerId, String decision, String notes);
    SellerReview performSellerReview(UUID sellerProfileId, UUID reviewerId, String decision, String notes);
    AuctionLot overrideAuctionWinner(UUID lotId, UUID targetBidderProfileId, UUID adminId, String reason);
    SupportTicket createSupportTicket(UUID userId, String title, String description, String category, String priority);
    SupportTicket updateTicketStatus(UUID ticketId, String status, UUID agentId);
    Dispute raiseDispute(UUID settlementId, UUID contractId, Long amount, String reason, UUID userId);
    Dispute resolveDispute(UUID disputeId, String status, String resolutionNotes, UUID adminId);
    NotificationTemplate createOrUpdateTemplate(String name, NotificationType type, NotificationChannel channel, String subject, String body, UUID adminId);
    FeatureFlag setFeatureFlag(String flagKey, boolean enabled, String description, UUID adminId);
    FinancialConfiguration setSystemConfig(String configKey, String configValue, String description, UUID adminId);
    List<AuditLog> getAuditLogsForUser(UUID userId);
    List<AuditLog> getAuditLogsForEntity(String entityType, String entityId);
}
