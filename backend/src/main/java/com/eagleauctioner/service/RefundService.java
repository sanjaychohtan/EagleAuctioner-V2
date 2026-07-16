package com.eagleauctioner.service;

import com.eagleauctioner.entity.Refund;
import com.eagleauctioner.repository.RefundRepository;
import com.eagleauctioner.event.RefundApprovedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class RefundService {

    private final RefundRepository refundRepository;
    private final ApplicationEventPublisher eventPublisher;
    
    // Threshold: 10,000 INR represented as paise (1,000,000 paise)
    private static final long DUAL_APPROVAL_THRESHOLD = 1000000L;

    @Transactional
    public Refund initiateRefund(UUID initiatorId, String initiatorRole, Long amount) {
        // Maker must be SELLER or ADMIN
        if (!"SELLER".equals(initiatorRole) && !"ADMIN".equals(initiatorRole)) {
            throw new org.springframework.security.access.AccessDeniedException("Unauthorized: Initiator must have SELLER or ADMIN role");
        }

        if (amount == null || amount <= 0) {
            throw new IllegalArgumentException("Refund amount must be positive");
        }

        Refund refund = Refund.builder()
                .amount(amount)
                .initiatorId(initiatorId)
                .status("PENDING_FIRST_APPROVAL")
                .createdAt(Instant.now())
                .build();

        refund.appendAudit("Refund request of " + amount + " paise initiated by user " + initiatorId + " (" + initiatorRole + ")");
        Refund saved = refundRepository.save(refund);
        log.info("[REFUND_MAKER] Initiated refund request. ID: {}, Initiator: {}, Amount: {} paise", saved.getId(), initiatorId, amount);
        return saved;
    }

    @Transactional
    public Refund approveRefund(UUID refundId, UUID approverId, String approverRole) {
        Refund refund = refundRepository.findById(refundId)
                .orElseThrow(() -> new IllegalArgumentException("Refund request not found"));

        // Segregation of Duties: Maker-Checker boundary enforcement
        if (refund.getInitiatorId().equals(approverId)) {
            throw new SecurityException("Segregation of Duties Violation: Maker cannot approve their own refund requests.");
        }

        boolean fullyApproved = false;

        if ("PENDING_FIRST_APPROVAL".equals(refund.getStatus())) {
            // First Level Approval: Require FINANCE or ADMIN roles
            if (!"FINANCE".equals(approverRole) && !"ADMIN".equals(approverRole)) {
                throw new org.springframework.security.access.AccessDeniedException("Unauthorized role for first level refund approval");
            }

            refund.setFirstApproverId(approverId);
            refund.setUpdatedAt(Instant.now());

            // Dual multi-approver check if amount exceeds threshold (10,000 INR)
            if (refund.getAmount() > DUAL_APPROVAL_THRESHOLD) {
                refund.setStatus("PENDING_SECOND_APPROVAL");
                refund.appendAudit("First level approved by " + approverId + " (" + approverRole + "). Pending dual-approver confirmation due to threshold breach.");
                log.info("[REFUND_CHECKER_1] Level 1 approved for refund ID: {}. Amount exceeds dual-approver threshold.", refundId);
            } else {
                refund.setStatus("APPROVED");
                refund.appendAudit("Final approval granted by " + approverId + " (" + approverRole + "). Refund completed.");
                log.info("[REFUND_COMPLETE] Fully approved refund ID: {}", refundId);
                fullyApproved = true;
            }

        } else if ("PENDING_SECOND_APPROVAL".equals(refund.getStatus())) {
            // Dual Level Approval: Require FINANCE_DIRECTOR role
            if (!"FINANCE_DIRECTOR".equals(approverRole)) {
                throw new org.springframework.security.access.AccessDeniedException("Unauthorized role for dual-level refund approval");
            }

            // Must be a different checker
            if (refund.getFirstApproverId().equals(approverId)) {
                throw new SecurityException("Segregation of Duties Violation: Checker 2 must be different from Checker 1.");
            }

            refund.setSecondApproverId(approverId);
            refund.setStatus("APPROVED");
            refund.setUpdatedAt(Instant.now());
            refund.appendAudit("Dual level approved by " + approverId + " (" + approverRole + "). Refund completed.");
            log.info("[REFUND_COMPLETE] Fully approved dual-approver refund ID: {}", refundId);
            fullyApproved = true;
        } else {
            throw new IllegalStateException("Refund request is not in a status that allows approval");
        }

        Refund saved = refundRepository.save(refund);

        if (fullyApproved) {
            eventPublisher.publishEvent(new RefundApprovedEvent(saved.getId(), saved.getAmount(), saved.getInitiatorId()));
        }

        return saved;
    }

    @Transactional
    public Refund rejectRefund(UUID refundId, UUID approverId, String reason) {
        Refund refund = refundRepository.findById(refundId)
                .orElseThrow(() -> new IllegalArgumentException("Refund request not found"));

        if ("APPROVED".equals(refund.getStatus()) || "REJECTED".equals(refund.getStatus())) {
            throw new IllegalStateException("Refund request is already finalized");
        }

        refund.setStatus("REJECTED");
        refund.setRejectionReason(reason);
        refund.setUpdatedAt(Instant.now());
        refund.appendAudit("Refund request rejected by " + approverId + ". Reason: " + reason);
        log.warn("[REFUND_REJECTED] Refund request {} was rejected by {}. Reason: {}", refundId, approverId, reason);

        return refundRepository.save(refund);
    }
}
