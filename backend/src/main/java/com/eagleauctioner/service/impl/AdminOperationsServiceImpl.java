package com.eagleauctioner.service.impl;

import com.eagleauctioner.entity.*;
import com.eagleauctioner.enums.*;
import com.eagleauctioner.repository.*;
import com.eagleauctioner.service.AdminOperationsService;
import com.eagleauctioner.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.HashSet;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class AdminOperationsServiceImpl implements AdminOperationsService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final KycReviewRepository kycReviewRepository;
    private final SellerReviewRepository sellerReviewRepository;
    private final AuctionLotRepository auctionLotRepository;
    private final BidderProfileRepository bidderProfileRepository;
    private final SupportTicketRepository supportTicketRepository;
    private final DisputeRepository disputeRepository;
    private final NotificationTemplateRepository templateRepository;
    private final FeatureFlagRepository featureFlagRepository;
    private final FinancialConfigurationRepository configRepository;
    private final AuditLogRepository auditLogRepository;

    private String sanitizeHtml(String input) {
        if (input == null) {
            return null;
        }
        return input.replace("&", "&amp;")
                    .replace("<", "&lt;")
                    .replace(">", "&gt;")
                    .replace("\"", "&quot;")
                    .replace("'", "&#x27;")
                    .replace("/", "&#x2F;");
    }

    private ReviewDecision parseReviewDecision(String decision) {
        if (decision == null || decision.trim().isEmpty()) {
            throw new IllegalArgumentException("Review decision is required");
        }
        try {
            return ReviewDecision.valueOf(decision.toUpperCase().trim());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Invalid review decision: '" + decision + "'. Allowed values are: APPROVED, REJECTED");
        }
    }

    @Override
    @Transactional
    public User updateUserStatus(UUID userId, boolean active, boolean locked, UUID adminId) {
        log.info("Admin {} updating status of User {}: active={}, locked={}", adminId, userId, active, locked);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException("User not found with ID: " + userId));

        String oldVal = String.format("{\"isActive\":%b,\"isLocked\":%b}", user.isActive(), user.isLocked());
        user.setActive(active);
        user.setLocked(locked);
        if (locked) {
            user.setLockedAt(Instant.now());
        } else {
            user.setLockedAt(null);
            user.setFailedLoginAttempts(0);
        }
        User saved = userRepository.save(user);

        String newVal = String.format("{\"isActive\":%b,\"isLocked\":%b}", saved.isActive(), saved.isLocked());
        logAudit(adminId, Action.UPDATE, "User", user.getId().toString(), oldVal, newVal);

        return saved;
    }

    @Override
    @Transactional
    public User assignUserRoles(UUID userId, List<UUID> roleIds, UUID adminId) {
        log.info("Admin {} assigning roles {} to User {}", adminId, roleIds, userId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException("User not found: " + userId));

        String oldRoles = user.getRoles() == null ? "" : user.getRoles().stream()
                .map(Role::getName)
                .collect(Collectors.joining(","));

        List<Role> roles = roleRepository.findAllById(roleIds);
        user.setRoles(new HashSet<>(roles));
        User saved = userRepository.save(user);

        String newRoles = roles.stream()
                .map(Role::getName)
                .collect(Collectors.joining(","));

        logAudit(adminId, Action.ROLE_CHANGE, "User", user.getId().toString(), oldRoles, newRoles);
        return saved;
    }

    @Override
    @Transactional
    public Role createRole(String roleName, String description, List<UUID> permissionIds, UUID adminId) {
        log.info("Admin {} creating role: {}", adminId, roleName);
        if (roleRepository.findByName(roleName).isPresent()) {
            throw new BusinessException("Role already exists with name: " + roleName);
        }

        List<Permission> permissions = permissionRepository.findAllById(permissionIds);
        Role role = Role.builder()
                .name(roleName)
                .description(sanitizeHtml(description))
                .permissions(new HashSet<>(permissions))
                .systemRole(false)
                .build();

        Role saved = roleRepository.save(role);
        logAudit(adminId, Action.CREATE, "Role", saved.getId().toString(), "", saved.getName());
        return saved;
    }

    @Override
    @Transactional
    public Permission createPermission(String name, com.eagleauctioner.enums.Module module, String description, UUID adminId) {
        log.info("Admin {} creating permission: {} for module: {}", adminId, name, module);
        if (permissionRepository.findByName(name).isPresent()) {
            throw new BusinessException("Permission already exists with name: " + name);
        }
        Permission permission = Permission.builder()
                .name(name)
                .module(module)
                .description(sanitizeHtml(description))
                .build();

        Permission saved = permissionRepository.save(permission);
        logAudit(adminId, Action.CREATE, "Permission", saved.getId().toString(), "", saved.getName());
        return saved;
    }

    @Override
    @Transactional
    public KycReview performKycReview(UUID profileId, UUID reviewerId, String decision, String notes) {
        log.info("Reviewer {} performing KYC review on profile: {}. Decision: {}", reviewerId, profileId, decision);
        BidderProfile bidderProfile = new BidderProfile();
        bidderProfile.setId(profileId);

        User reviewerUser = new User();
        reviewerUser.setId(reviewerId);

        ReviewDecision reviewDecision = parseReviewDecision(decision);
        BidderState targetState = (reviewDecision == ReviewDecision.APPROVED) ? BidderState.APPROVED : BidderState.REJECTED;

        KycReview review = KycReview.builder()
                .bidderProfile(bidderProfile)
                .reviewer(reviewerUser)
                .previousState(BidderState.UNDER_REVIEW)
                .newState(targetState)
                .decision(reviewDecision)
                .reviewNotes(sanitizeHtml(notes))
                .reviewedAt(Instant.now())
                .build();

        KycReview saved = kycReviewRepository.save(review);
        logAudit(reviewerId, Action.UPDATE, "KycReview", saved.getId().toString(), "", decision);
        return saved;
    }

    @Override
    @Transactional
    public SellerReview performSellerReview(UUID sellerProfileId, UUID reviewerId, String decision, String notes) {
        log.info("Reviewer {} performing Seller review on profile: {}. Decision: {}", reviewerId, sellerProfileId, decision);
        SellerProfile sellerProfile = new SellerProfile();
        sellerProfile.setId(sellerProfileId);

        User reviewerUser = new User();
        reviewerUser.setId(reviewerId);

        ReviewDecision reviewDecision = parseReviewDecision(decision);
        SellerState targetState = (reviewDecision == ReviewDecision.APPROVED) ? SellerState.APPROVED : SellerState.REJECTED;

        SellerReview review = SellerReview.builder()
                .sellerProfile(sellerProfile)
                .reviewer(reviewerUser)
                .previousState(SellerState.UNDER_REVIEW)
                .newState(targetState)
                .decision(reviewDecision)
                .reviewNotes(sanitizeHtml(notes))
                .reviewedAt(Instant.now())
                .build();

        SellerReview saved = sellerReviewRepository.save(review);
        logAudit(reviewerId, Action.UPDATE, "SellerReview", saved.getId().toString(), "", decision);
        return saved;
    }

    @Override
    @Transactional
    public AuctionLot overrideAuctionWinner(UUID lotId, UUID targetBidderProfileId, UUID adminId, String reason) {
        log.info("Admin {} overriding winner of Lot {} to Bidder Profile {}", adminId, lotId, targetBidderProfileId);
        AuctionLot lot = auctionLotRepository.findById(lotId)
                .orElseThrow(() -> new BusinessException("Auction Lot not found: " + lotId));

        BidderProfile targetBidder = bidderProfileRepository.findById(targetBidderProfileId)
                .orElseThrow(() -> new BusinessException("Bidder Profile not found: " + targetBidderProfileId));

        if (lot.getLotStatus() == AuctionLotStatus.SOLD || lot.getLotStatus() == AuctionLotStatus.CANCELLED) {
            throw new BusinessException("Cannot override winner: Lot is in " + lot.getLotStatus() + " status");
        }
        if (lot.getAuction() != null && lot.getAuction().getState() != null) {
            AuctionState state = lot.getAuction().getState();
            if (state == AuctionState.SETTLED || state == AuctionState.CANCELLED || state == AuctionState.ARCHIVED) {
                throw new BusinessException("Cannot override winner: Auction is in immutable state " + state);
            }
        }

        String oldVal = lot.getWinnerBidder() != null ? lot.getWinnerBidder().getId().toString() : "NULL";
        lot.setWinnerBidder(targetBidder);
        lot.setLotStatus(AuctionLotStatus.SOLD);
        AuctionLot saved = auctionLotRepository.save(lot);

        logAudit(adminId, Action.UPDATE, "AuctionLotWinnerOverride", lotId.toString(), oldVal, targetBidderProfileId.toString());
        return saved;
    }

    @Override
    @Transactional
    public SupportTicket createSupportTicket(UUID userId, String title, String description, String category, String priority) {
        log.info("User {} raising support ticket: {}", userId, title);
        SupportTicket ticket = SupportTicket.builder()
                .userId(userId)
                .title(sanitizeHtml(title))
                .description(sanitizeHtml(description))
                .category(sanitizeHtml(category))
                .priority(priority)
                .status("OPEN")
                .build();
        SupportTicket saved = supportTicketRepository.save(ticket);
        logAudit(userId, Action.CREATE, "SupportTicket", saved.getId().toString(), "", "OPEN");
        return saved;
    }

    @Override
    @Transactional
    public SupportTicket updateTicketStatus(UUID ticketId, String status, UUID agentId) {
        log.info("Agent {} updating ticket {} to status: {}", agentId, ticketId, status);
        SupportTicket ticket = supportTicketRepository.findById(ticketId)
                .orElseThrow(() -> new BusinessException("Ticket not found: " + ticketId));

        if (status == null) {
            throw new BusinessException("Ticket status is required");
        }
        String upperStatus = status.toUpperCase().trim();
        if (!List.of("OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED").contains(upperStatus)) {
            throw new BusinessException("Invalid support ticket status: " + status + ". Allowed values are: OPEN, IN_PROGRESS, RESOLVED, CLOSED");
        }

        String oldStatus = ticket.getStatus();
        ticket.setStatus(upperStatus);
        ticket.setAssignedTo(agentId);
        SupportTicket saved = supportTicketRepository.save(ticket);

        logAudit(agentId, Action.UPDATE, "SupportTicket", ticketId.toString(), oldStatus, upperStatus);
        return saved;
    }

    @Override
    @Transactional
    public Dispute raiseDispute(UUID settlementId, UUID contractId, Long amount, String reason, UUID userId) {
        log.info("User {} raising settlement dispute on settlement: {} for amount: {}", userId, settlementId, amount);
        Dispute dispute = Dispute.builder()
                .settlementId(settlementId)
                .contractId(contractId)
                .disputedAmount(amount)
                .reason(sanitizeHtml(reason))
                .status("OPEN")
                .build();
        Dispute saved = disputeRepository.save(dispute);
        logAudit(userId, Action.CREATE, "Dispute", saved.getId().toString(), "", "OPEN");
        return saved;
    }

    @Override
    @Transactional
    public Dispute resolveDispute(UUID disputeId, String status, String resolutionNotes, UUID adminId) {
        log.info("Admin {} resolving dispute {}: status={}, notes={}", adminId, disputeId, status, resolutionNotes);
        Dispute dispute = disputeRepository.findById(disputeId)
                .orElseThrow(() -> new BusinessException("Dispute not found: " + disputeId));

        if (status == null) {
            throw new BusinessException("Dispute status is required");
        }
        String upperStatus = status.toUpperCase().trim();
        if (!List.of("OPEN", "UNDER_INVESTIGATION", "SETTLED", "DISMISSED").contains(upperStatus)) {
            throw new BusinessException("Invalid dispute status: " + status + ". Allowed values are: OPEN, UNDER_INVESTIGATION, SETTLED, DISMISSED");
        }

        String oldStatus = dispute.getStatus();
        dispute.setStatus(upperStatus);
        dispute.setResolutionNotes(sanitizeHtml(resolutionNotes));
        dispute.setResolvedBy(adminId);
        Dispute saved = disputeRepository.save(dispute);

        logAudit(adminId, Action.UPDATE, "Dispute", disputeId.toString(), oldStatus, upperStatus);
        return saved;
    }

    @Override
    @Transactional
    public NotificationTemplate createOrUpdateTemplate(String name, NotificationType type, NotificationChannel channel, String subject, String body, UUID adminId) {
        log.info("Admin {} creating/updating notification template: {}", adminId, name);
        Optional<NotificationTemplate> existing = templateRepository.findByNameAndIsActiveTrue(name);
        NotificationTemplate template;
        String oldSubject = "NULL";
        
        if (existing.isPresent()) {
            template = existing.get();
            oldSubject = template.getSubjectTemplate();
            template.setSubjectTemplate(sanitizeHtml(subject));
            template.setBodyTemplate(sanitizeHtml(body));
            template.setNotificationType(type);
            template.setChannel(channel);
        } else {
            template = NotificationTemplate.builder()
                    .name(name)
                    .notificationType(type)
                    .channel(channel)
                    .subjectTemplate(sanitizeHtml(subject))
                    .bodyTemplate(sanitizeHtml(body))
                    .isActive(true)
                    .build();
        }

        NotificationTemplate saved = templateRepository.save(template);
        logAudit(adminId, Action.UPDATE, "NotificationTemplate", saved.getId().toString(), oldSubject, name);
        return saved;
    }

    @Override
    @Transactional
    public FeatureFlag setFeatureFlag(String flagKey, boolean enabled, String description, UUID adminId) {
        log.info("Admin {} setting feature flag: {} to enabled={}", adminId, flagKey, enabled);
        if (flagKey == null || flagKey.trim().isEmpty()) {
            throw new BusinessException("Feature flag key is required");
        }
        if (flagKey.length() > 100) {
            throw new BusinessException("Feature flag key must not exceed 100 characters");
        }
        if (!flagKey.matches("^[A-Z0-9_]+$")) {
            throw new BusinessException("Feature flag key must contain only uppercase letters, numbers, and underscores (e.g. ENABLE_BETA_BIDDING)");
        }

        Optional<FeatureFlag> existing = featureFlagRepository.findByFlagKey(flagKey);
        FeatureFlag flag;
        String oldVal = "NULL";

        if (existing.isPresent()) {
            flag = existing.get();
            oldVal = String.valueOf(flag.isEnabled());
            flag.setEnabled(enabled);
        } else {
            flag = FeatureFlag.builder()
                    .flagKey(flagKey)
                    .description(sanitizeHtml(description))
                    .isEnabled(enabled)
                    .build();
        }

        FeatureFlag saved = featureFlagRepository.save(flag);
        logAudit(adminId, Action.UPDATE, "FeatureFlag", saved.getId().toString(), oldVal, String.valueOf(enabled));
        return saved;
    }

    @Override
    @Transactional
    public FinancialConfiguration setSystemConfig(String configKey, String configValue, String description, UUID adminId) {
        log.info("Admin {} setting system config key {} to value {}", adminId, configKey, configValue);
        Optional<FinancialConfiguration> existing = configRepository.findById(configKey);
        FinancialConfiguration config;
        String oldVal = "NULL";

        if (existing.isPresent()) {
            config = existing.get();
            oldVal = config.getConfigValue();
            config.setConfigValue(configValue);
        } else {
            config = FinancialConfiguration.builder()
                    .configKey(configKey)
                    .configValue(configValue)
                    .description(sanitizeHtml(description))
                    .build();
        }

        FinancialConfiguration saved = configRepository.save(config);
        logAudit(adminId, Action.UPDATE, "FinancialConfiguration", configKey, oldVal, configValue);
        return saved;
    }

    @Override
    @Transactional(readOnly = true)
    public List<AuditLog> getAuditLogsForUser(UUID userId) {
        return auditLogRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AuditLog> getAuditLogsForEntity(String entityType, String entityId) {
        return auditLogRepository.findByEntityTypeAndEntityIdOrderByCreatedAtDesc(entityType, entityId);
    }

    private void logAudit(UUID userId, Action action, String entityType, String entityId, String oldVal, String newVal) {
        String ipAddress = "127.0.0.1";
        String userAgent = "SYSTEM-ADMIN-CONSOLE";
        try {
            org.springframework.web.context.request.ServletRequestAttributes attributes =
                (org.springframework.web.context.request.ServletRequestAttributes) org.springframework.web.context.request.RequestContextHolder.getRequestAttributes();
            if (attributes != null) {
                jakarta.servlet.http.HttpServletRequest request = attributes.getRequest();
                if (request != null) {
                    ipAddress = request.getRemoteAddr();
                    String xff = request.getHeader("X-Forwarded-For");
                    if (xff != null && !xff.isEmpty()) {
                        ipAddress = xff.split(",")[0].trim();
                    }
                    String ua = request.getHeader("User-Agent");
                    if (ua != null && !ua.isEmpty()) {
                        userAgent = ua;
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Failed to extract request metadata for audit log", e);
        }

        AuditLog audit = AuditLog.builder()
                .userId(userId)
                .action(action)
                .entityType(entityType)
                .entityId(entityId)
                .oldValue(oldVal)
                .newValue(newVal)
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .build();
        auditLogRepository.save(audit);
    }
}
