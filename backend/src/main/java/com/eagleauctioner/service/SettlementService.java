package com.eagleauctioner.service;

import com.eagleauctioner.dto.SettlementHistoryDto;
import com.eagleauctioner.dto.SettlementResponse;
import com.eagleauctioner.entity.*;
import com.eagleauctioner.enums.ContractStatus;
import com.eagleauctioner.enums.SettlementStatus;
import com.eagleauctioner.event.SettlementApprovedEvent;
import com.eagleauctioner.event.SettlementGeneratedEvent;
import com.eagleauctioner.event.SettlementRejectedEvent;
import com.eagleauctioner.event.SettlementCompletedEvent;
import com.eagleauctioner.event.SettlementCancelledEvent;
import com.eagleauctioner.context.AuditContext;
import com.eagleauctioner.exception.ResourceNotFoundException;
import com.eagleauctioner.repository.ContractRepository;
import com.eagleauctioner.repository.SettlementRepository;
import com.eagleauctioner.repository.SettlementHistoryRepository;
import com.eagleauctioner.security.SecurityUtils;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * Settlement Core Engine governing the post-contract closure.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class SettlementService {

    private final SettlementRepository settlementRepository;
    private final ContractRepository contractRepository;
    private final SettlementHistoryRepository settlementHistoryRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final ObjectMapper objectMapper;
    private final FinancialRuleEngine financialRuleEngine;

    /**
     * Legacy entry point keeping backward compatibility with Phase 6.
     */
    @Transactional
    public void createSettlementDraft(Contract contract, String region) {
        log.info("Legacy/Cascade entry point: Creating Settlement draft for contract: {}", contract.getDocumentNumber());
        
        Optional<Settlement> existing = settlementRepository.findByContractId(contract.getId());
        if (existing.isPresent()) {
            log.info("Settlement already exists for contract: {}, skipping creation.", contract.getDocumentNumber());
            return;
        }

        if (contract.getStatus() != ContractStatus.ACCEPTED) {
            log.warn("Contract {} status is not ACCEPTED. Skipping settlement cascade.", contract.getDocumentNumber());
            return;
        }

        generateInternal(contract, region);
    }

    /**
     * REST API entry point: Generates a Settlement for an ACCEPTED Contract.
     */
    @Transactional
    public SettlementResponse generateSettlement(UUID contractId) {
        log.info("Generating settlement for contract ID: {}", contractId);

        // Fetch contract with all necessary associations
        Contract contract = contractRepository.findByIdWithRelationsForUpdate(contractId)
                .orElseThrow(() -> new ResourceNotFoundException("Contract not found: " + contractId));

        validateContractAccess(contract);

        // Exactly ONE Settlement per Contract: Check if duplicate exists
        Optional<Settlement> existing = settlementRepository.findByContractId(contractId);
        if (existing.isPresent()) {
            log.info("Settlement already exists for contract ID: {}. Returning existing record.", contractId);
            return mapToResponse(existing.get());
        }

        if (contract.getStatus() != ContractStatus.ACCEPTED) {
            throw new IllegalStateException("Settlement can only be generated when Contract Status is ACCEPTED.");
        }

        String region = detectRegion(contract);

        Settlement settlement = generateInternal(contract, region);
        return mapToResponse(settlement);
    }

    private Settlement generateInternal(Contract contract, String region) {
        String buyerSnapshot = buildBuyerSnapshot(contract);
        String sellerSnapshot = buildSellerSnapshot(contract);
        String auctionSnapshot = buildAuctionSnapshot(contract);
        String lotSnapshot = buildLotSnapshot(contract);

        Long winningAmount = contract.getTotalAmount() != null ? contract.getTotalAmount() : 0L;
        Long taxAmount = 0L;
        if ("IN".equalsIgnoreCase(region)) {
            Long multiplied = Math.multiplyExact(winningAmount, 18L);
            Long withHalfUp = Math.addExact(multiplied, 50L);
            taxAmount = withHalfUp / 100L;
        }

        BigDecimal feePercent = financialRuleEngine.getPlatformFeePercentage();
        BigDecimal feeFactor = feePercent.divide(new BigDecimal("100"), 6, java.math.RoundingMode.HALF_UP);
        Long platformFee = new BigDecimal(winningAmount).multiply(feeFactor).setScale(0, java.math.RoundingMode.HALF_UP).longValueExact();

        Long payoutAmount = Math.subtractExact(winningAmount, platformFee);

        String taxSnapshot = buildTaxSnapshot(contract, region, taxAmount);

        String currency = "INR";
        if (contract.getWinner() != null) {
            if (contract.getWinner().getCurrencySnapshot() != null) {
                currency = contract.getWinner().getCurrencySnapshot();
            } else if (contract.getWinner().getAuctionLot() != null &&
                       contract.getWinner().getAuctionLot().getAuction() != null &&
                       contract.getWinner().getAuctionLot().getAuction().getCurrency() != null) {
                currency = contract.getWinner().getAuctionLot().getAuction().getCurrency();
            }
        }

        Settlement settlement = Settlement.builder()
                .contract(contract)
                .status(SettlementStatus.DRAFT)
                .contractNumber(contract.getDocumentNumber())
                .winnerId(contract.getWinner().getId())
                .buyerSnapshot(buyerSnapshot)
                .sellerSnapshot(sellerSnapshot)
                .auctionSnapshot(auctionSnapshot)
                .lotSnapshot(lotSnapshot)
                .winningAmount(winningAmount)
                .platformFee(platformFee)
                .taxAmount(taxAmount)
                .payoutAmount(payoutAmount)
                .currency(currency)
                .taxSnapshot(taxSnapshot)
                .generatedTimestamp(Instant.now())
                .build();

        Settlement saved = settlementRepository.save(settlement);
        log.info("Settlement draft generated and saved: ID = {}", saved.getId());

        // Record History
        recordHistory(saved, null, SettlementStatus.DRAFT, "Generation", "Settlement Draft generated automatically.");

        // Publish event
        eventPublisher.publishEvent(new SettlementGeneratedEvent(saved.getId(), contract.getId(), contract.getDocumentNumber()));
        return saved;
    }

    /**
     * Submit a Settlement for approval. Transitions status from DRAFT -> PENDING_APPROVAL.
     */
    @Transactional
    public SettlementResponse submitForApproval(UUID id) {
        log.info("Submitting Settlement for approval: ID = {}", id);
        Settlement settlement = settlementRepository.findByIdWithRelationsForUpdate(id)
                .orElseThrow(() -> new ResourceNotFoundException("Settlement not found: " + id));

        validateSettlementAccess(settlement);

        if (settlement.getStatus() != SettlementStatus.DRAFT && settlement.getStatus() != SettlementStatus.REJECTED) {
            throw new IllegalStateException("Only settlements in DRAFT or REJECTED status can be submitted for approval.");
        }

        SettlementStatus prev = settlement.getStatus();
        settlement.setStatus(SettlementStatus.PENDING_APPROVAL);
        Settlement saved = settlementRepository.save(settlement);
        recordHistory(saved, prev, SettlementStatus.PENDING_APPROVAL, "Submission", "Settlement submitted for approval.");
        return mapToResponse(saved);
    }

    /**
     * Approve a Settlement. Transitions status from PENDING_APPROVAL -> APPROVED.
     */
    @Transactional
    public SettlementResponse approveSettlement(UUID id) {
        log.info("Approving Settlement: ID = {}", id);
        Settlement settlement = settlementRepository.findByIdWithRelationsForUpdate(id)
                .orElseThrow(() -> new ResourceNotFoundException("Settlement not found: " + id));

        validateSettlementAccess(settlement);

        if (settlement.getStatus() != SettlementStatus.PENDING_APPROVAL) {
            throw new IllegalStateException("Only settlements in PENDING_APPROVAL status can be approved.");
        }

        SettlementStatus prev = settlement.getStatus();
        settlement.setStatus(SettlementStatus.APPROVED);
        Settlement saved = settlementRepository.save(settlement);
        recordHistory(saved, prev, SettlementStatus.APPROVED, "Approval", "Settlement approved.");

        String actor = SecurityUtils.getCurrentActor();
        eventPublisher.publishEvent(new SettlementApprovedEvent(saved.getId(), saved.getContract().getId(), actor));
        return mapToResponse(saved);
    }

    /**
     * Transition from APPROVED to PAYMENT_PENDING.
     */
    @Transactional
    public SettlementResponse transitionToPaymentPending(UUID id) {
        log.info("Transitioning Settlement to PAYMENT_PENDING: ID = {}", id);
        Settlement settlement = settlementRepository.findByIdWithRelationsForUpdate(id)
                .orElseThrow(() -> new ResourceNotFoundException("Settlement not found: " + id));

        validateSettlementAccess(settlement);

        if (settlement.getStatus() != SettlementStatus.APPROVED) {
            throw new IllegalStateException("Only APPROVED settlements can transition to PAYMENT_PENDING.");
        }

        SettlementStatus prev = settlement.getStatus();
        settlement.setStatus(SettlementStatus.PAYMENT_PENDING);
        Settlement saved = settlementRepository.save(settlement);
        recordHistory(saved, prev, SettlementStatus.PAYMENT_PENDING, "Payment Pending", "Settlement ready for payment.");
        return mapToResponse(saved);
    }

    /**
     * Transition from PAYMENT_PENDING to PAYMENT_RECEIVED.
     */
    @Transactional
    public SettlementResponse receivePayment(UUID id, String remarks) {
        log.info("Receiving payment for Settlement: ID = {}", id);
        if (remarks != null && remarks.length() > 2000) {
            throw new IllegalArgumentException("Remarks cannot exceed 2000 characters.");
        }
        
        Settlement settlement = settlementRepository.findByIdWithRelationsForUpdate(id)
                .orElseThrow(() -> new ResourceNotFoundException("Settlement not found: " + id));

        validateSettlementAccess(settlement);

        if (settlement.getStatus() != SettlementStatus.PAYMENT_PENDING) {
            throw new IllegalStateException("Only PAYMENT_PENDING settlements can mark payment as received.");
        }

        SettlementStatus prev = settlement.getStatus();
        settlement.setStatus(SettlementStatus.PAYMENT_RECEIVED);
        Settlement saved = settlementRepository.save(settlement);
        recordHistory(saved, prev, SettlementStatus.PAYMENT_RECEIVED, "Payment Received", remarks != null ? remarks : "Payment marked as received.");
        return mapToResponse(saved);
    }

    /**
     * Complete a Settlement. Transitions from PAYMENT_RECEIVED -> COMPLETED.
     */
    @Transactional
    public SettlementResponse completeSettlement(UUID id, String remarks) {
        log.info("Completing Settlement: ID = {}", id);
        if (remarks != null && remarks.length() > 2000) {
            throw new IllegalArgumentException("Completion remarks cannot exceed 2000 characters.");
        }
        
        Settlement settlement = settlementRepository.findByIdWithRelationsForUpdate(id)
                .orElseThrow(() -> new ResourceNotFoundException("Settlement not found: " + id));

        validateSettlementAccess(settlement);

        if (settlement.getStatus() == SettlementStatus.COMPLETED) {
            throw new IllegalStateException("Settlement is already completed.");
        }
        if (settlement.getStatus() != SettlementStatus.PAYMENT_RECEIVED) {
            throw new IllegalStateException("Only settlements in PAYMENT_RECEIVED status can be completed.");
        }

        SettlementStatus prev = settlement.getStatus();
        settlement.setStatus(SettlementStatus.COMPLETED);
        String actor = SecurityUtils.getCurrentActor();
        settlement.setCompletedBy(actor);
        settlement.setCompletedAt(Instant.now());
        settlement.setCompletionRemarks(remarks);

        Settlement saved = settlementRepository.save(settlement);
        recordHistory(saved, prev, SettlementStatus.COMPLETED, "Completion", remarks != null ? remarks : "Settlement completed successfully.");

        eventPublisher.publishEvent(new SettlementCompletedEvent(saved.getId(), saved.getContract().getId(), actor));
        return mapToResponse(saved);
    }

    /**
     * Cancel a Settlement. Transitions to CANCELLED.
     */
    @Transactional
    public SettlementResponse cancelSettlement(UUID id, String reason) {
        log.info("Cancelling Settlement: ID = {}, Reason = {}", id, reason);
        if (reason == null || reason.trim().isEmpty()) {
            throw new IllegalArgumentException("Cancellation reason cannot be blank.");
        }
        if (reason.length() > 1000) {
            throw new IllegalArgumentException("Cancellation reason cannot exceed 1000 characters.");
        }
        
        Settlement settlement = settlementRepository.findByIdWithRelationsForUpdate(id)
                .orElseThrow(() -> new ResourceNotFoundException("Settlement not found: " + id));

        validateSettlementAccess(settlement);

        if (settlement.getStatus() == SettlementStatus.COMPLETED) {
            throw new IllegalStateException("Completed settlements cannot be cancelled.");
        }
        if (settlement.getStatus() == SettlementStatus.CANCELLED) {
            throw new IllegalStateException("Settlement is already cancelled.");
        }

        SettlementStatus prev = settlement.getStatus();
        settlement.setStatus(SettlementStatus.CANCELLED);
        String actor = SecurityUtils.getCurrentActor();
        settlement.setCancelledBy(actor);
        settlement.setCancelledAt(Instant.now());
        settlement.setCancellationReason(reason);

        Settlement saved = settlementRepository.save(settlement);
        recordHistory(saved, prev, SettlementStatus.CANCELLED, "Cancellation", reason != null ? reason : "Settlement cancelled.");

        eventPublisher.publishEvent(new SettlementCancelledEvent(saved.getId(), saved.getContract().getId(), actor));
        return mapToResponse(saved);
    }

    /**
     * Reject a Settlement. Transitions status from PENDING_APPROVAL -> REJECTED.
     */
    @Transactional
    public SettlementResponse rejectSettlement(UUID id, String reason) {
        log.info("Rejecting Settlement: ID = {}, Reason = {}", id, reason);
        if (reason == null || reason.trim().isEmpty()) {
            throw new IllegalArgumentException("Rejection reason cannot be blank.");
        }
        if (reason.length() > 1000) {
            throw new IllegalArgumentException("Rejection reason cannot exceed 1000 characters.");
        }

        Settlement settlement = settlementRepository.findByIdWithRelationsForUpdate(id)
                .orElseThrow(() -> new ResourceNotFoundException("Settlement not found: " + id));

        validateSettlementAccess(settlement);

        if (settlement.getStatus() != SettlementStatus.PENDING_APPROVAL) {
            throw new IllegalStateException("Only settlements in PENDING_APPROVAL status can be rejected.");
        }

        SettlementStatus prev = settlement.getStatus();
        settlement.setStatus(SettlementStatus.REJECTED);
        Settlement saved = settlementRepository.save(settlement);
        recordHistory(saved, prev, SettlementStatus.REJECTED, "Rejection", reason);

        String actor = SecurityUtils.getCurrentActor();
        eventPublisher.publishEvent(new SettlementRejectedEvent(saved.getId(), saved.getContract().getId(), actor, reason));
        return mapToResponse(saved);
    }

    /**
     * Retrieve Settlement by ID.
     */
    public SettlementResponse getById(UUID id) {
        Settlement settlement = settlementRepository.findByIdWithRelationsForUpdate(id)
                .orElseThrow(() -> new ResourceNotFoundException("Settlement not found: " + id));

        validateSettlementAccess(settlement);
        return mapToResponse(settlement);
    }

    /**
     * Retrieve Settlement by Contract ID.
     */
    public SettlementResponse getByContractId(UUID contractId) {
        Settlement settlement = settlementRepository.findByContractId(contractId)
                .orElseThrow(() -> new ResourceNotFoundException("Settlement not found for Contract: " + contractId));

        validateSettlementAccess(settlement);
        return mapToResponse(settlement);
    }

    /**
     * Retrieve Settlement Status by ID.
     */
    public SettlementStatus getStatus(UUID id) {
        Settlement settlement = settlementRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Settlement not found: " + id));

        validateSettlementAccess(settlement);
        return settlement.getStatus();
    }

    /**
     * Retrieve complete immutable history.
     */
    public List<SettlementHistoryDto> getHistory(UUID id) {
        log.info("Retrieving history for Settlement: ID = {}", id);
        Settlement settlement = settlementRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Settlement not found: " + id));

        validateSettlementAccess(settlement);

        return settlementHistoryRepository.findBySettlementIdOrderByActionTimestampAsc(id).stream()
                .map(this::mapToHistoryDto)
                .toList();
    }

    /**
     * Retrieve chronological workflow timeline events.
     */
    public List<SettlementHistoryDto> getTimeline(UUID id) {
        return getHistory(id);
    }

    /**
     * Retrieve operational remarks chronologically from history without overwriting previous.
     */
    public List<String> getRemarks(UUID id) {
        log.info("Retrieving remarks for Settlement: ID = {}", id);
        Settlement settlement = settlementRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Settlement not found: " + id));

        validateSettlementAccess(settlement);

        return settlementHistoryRepository.findBySettlementIdOrderByActionTimestampAsc(id).stream()
                .map(SettlementHistory::getRemarks)
                .filter(r -> r != null && !r.trim().isEmpty())
                .toList();
    }

    /**
     * Support operational remarks without changing state.
     */
    @Transactional
    public void addRemark(UUID id, String remark) {
        log.info("Adding operational remark to Settlement: ID = {}, Remark = {}", id, remark);
        if (remark == null || remark.trim().isEmpty()) {
            throw new IllegalArgumentException("Remark cannot be blank.");
        }
        if (remark.length() > 2000) {
            throw new IllegalArgumentException("Remark cannot exceed 2000 characters.");
        }
        
        Settlement settlement = settlementRepository.findByIdWithRelationsForUpdate(id)
                .orElseThrow(() -> new ResourceNotFoundException("Settlement not found: " + id));

        validateSettlementAccess(settlement);

        recordHistory(settlement, settlement.getStatus(), settlement.getStatus(), "Operational Remark", remark);
    }

    private void recordHistory(Settlement settlement, SettlementStatus previousStatus, SettlementStatus currentStatus, String reason, String remarks) {
        String actor = SecurityUtils.getCurrentActor();
        String correlationId = null;
        String ipAddress = null;
        String requestSource = null;
        try {
            AuditContext auditCtx = AuditContext.get();
            if (auditCtx != null) {
                correlationId = auditCtx.getCorrelationId();
                ipAddress = auditCtx.getIpAddress();
                requestSource = auditCtx.getUserAgent();
            }
        } catch (Exception e) {
            // Ignore missing context
        }

        SettlementHistory history = SettlementHistory.builder()
                .settlement(settlement)
                .actor(actor)
                .actionTimestamp(Instant.now())
                .previousStatus(previousStatus)
                .currentStatus(currentStatus)
                .reason(reason)
                .remarks(remarks)
                .correlationId(correlationId)
                .requestSource(requestSource)
                .ipAddress(ipAddress)
                .build();
        settlementHistoryRepository.save(history);
    }

    private SettlementHistoryDto mapToHistoryDto(SettlementHistory h) {
        if (h == null) return null;
        return SettlementHistoryDto.builder()
                .id(h.getId())
                .settlementId(h.getSettlement().getId())
                .actor(h.getActor())
                .actionTimestamp(h.getActionTimestamp())
                .previousStatus(h.getPreviousStatus())
                .currentStatus(h.getCurrentStatus())
                .reason(h.getReason())
                .remarks(h.getRemarks())
                .correlationId(h.getCorrelationId())
                .requestSource(h.getRequestSource())
                .ipAddress(h.getIpAddress())
                .build();
    }

    /**
     * OWASP ASVS IDOR validation checks with strict null safety to differentiate data integrity issues from security violations.
     */
    public void validateSettlementAccess(Settlement settlement) {
        if (settlement == null) {
            throw new IllegalArgumentException("Settlement cannot be null");
        }
        try {
            validateContractAccess(settlement.getContract());
        } catch (AccessDeniedException e) {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String username = auth != null ? auth.getName() : "anonymous";
            log.error("[IDOR_ATTEMPT] User '{}' tried to access Settlement '{}'", username, settlement.getId());
            throw new AccessDeniedException("Access Denied: You do not have permissions to access this settlement.");
        }
    }

    public void validateContractAccess(Contract contract) {
        if (contract == null) {
            throw new IllegalArgumentException("Contract cannot be null");
        }
        if (contract.getWinner() == null) {
            throw new IllegalArgumentException("Contract winner association is missing.");
        }

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) {
            throw new AccessDeniedException("[SECURITY_VIOLATION] Unauthenticated request during contract access.");
        }

        String username = auth.getName();
        boolean isAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (isAdmin) return;

        // Verify if buyer
        if (contract.getWinner().getBidderProfile() == null ||
            contract.getWinner().getBidderProfile().getUser() == null ||
            contract.getWinner().getBidderProfile().getUser().getEmail() == null) {
            throw new IllegalArgumentException("Incomplete or corrupt buyer relationship data.");
        }
        String buyerEmail = contract.getWinner().getBidderProfile().getUser().getEmail();
        if (username.equalsIgnoreCase(buyerEmail)) return;

        // Verify if seller
        if (contract.getWinner().getAuctionLot() == null ||
            contract.getWinner().getAuctionLot().getAuction() == null ||
            contract.getWinner().getAuctionLot().getAuction().getSellerProfile() == null ||
            contract.getWinner().getAuctionLot().getAuction().getSellerProfile().getUser() == null ||
            contract.getWinner().getAuctionLot().getAuction().getSellerProfile().getUser().getEmail() == null) {
            throw new IllegalArgumentException("Incomplete or corrupt seller relationship data.");
        }
        String sellerEmail = contract.getWinner().getAuctionLot().getAuction().getSellerProfile().getUser().getEmail();
        if (username.equalsIgnoreCase(sellerEmail)) return;

        log.error("[IDOR_ATTEMPT] User '{}' tried to access Contract '{}'", username, contract.getDocumentNumber());
        throw new AccessDeniedException("Access Denied: You do not have permissions to access this contract.");
    }

    public String detectRegion(Contract contract) {
        if (contract != null &&
            contract.getWinner() != null &&
            contract.getWinner().getAuctionLot() != null &&
            contract.getWinner().getAuctionLot().getAuction() != null &&
            contract.getWinner().getAuctionLot().getAuction().getSellerProfile() != null &&
            contract.getWinner().getAuctionLot().getAuction().getSellerProfile().getCompany() != null &&
            contract.getWinner().getAuctionLot().getAuction().getSellerProfile().getCompany().getGstin() != null) {
            return "IN";
        }
        return "GLOBAL";
    }

    private String serializeSnapshot(Object data) {
        try {
            return objectMapper.writeValueAsString(data);
        } catch (Exception e) {
            throw new RuntimeException("Failed to serialize snapshot data", e);
        }
    }

    private String buildBuyerSnapshot(Contract contract) {
        Map<String, Object> map = new java.util.HashMap<>();
        AuctionWinner winner = contract.getWinner();
        if (winner != null && winner.getBidderProfile() != null) {
            map.put("id", winner.getBidderProfile().getId().toString());
            User u = winner.getBidderProfile().getUser();
            if (u != null) {
                map.put("firstName", u.getFirstName());
                map.put("lastName", u.getLastName());
                map.put("email", u.getEmail());
                map.put("mobile", u.getMobile());
            }
        }
        return serializeSnapshot(map);
    }

    private String buildSellerSnapshot(Contract contract) {
        Map<String, Object> map = new java.util.HashMap<>();
        AuctionWinner winner = contract.getWinner();
        if (winner != null && winner.getAuctionLot() != null && winner.getAuctionLot().getAuction() != null) {
            var sellerProfile = winner.getAuctionLot().getAuction().getSellerProfile();
            if (sellerProfile != null) {
                map.put("id", sellerProfile.getId().toString());
                User u = sellerProfile.getUser();
                if (u != null) {
                    map.put("firstName", u.getFirstName());
                    map.put("lastName", u.getLastName());
                    map.put("email", u.getEmail());
                }
                if (sellerProfile.getCompany() != null) {
                    map.put("companyName", sellerProfile.getCompany().getCompanyName());
                    map.put("gstin", sellerProfile.getCompany().getGstin());
                }
            }
        }
        return serializeSnapshot(map);
    }

    private String buildAuctionSnapshot(Contract contract) {
        Map<String, Object> map = new java.util.HashMap<>();
        AuctionWinner winner = contract.getWinner();
        if (winner != null && winner.getAuctionLot() != null && winner.getAuctionLot().getAuction() != null) {
            var auction = winner.getAuctionLot().getAuction();
            map.put("id", auction.getId().toString());
            map.put("auctionNumber", auction.getAuctionNumber());
            map.put("title", auction.getTitle());
            map.put("description", auction.getDescription());
            map.put("auctionType", auction.getAuctionType().toString());
        }
        return serializeSnapshot(map);
    }

    private String buildLotSnapshot(Contract contract) {
        Map<String, Object> map = new java.util.HashMap<>();
        AuctionWinner winner = contract.getWinner();
        if (winner != null && winner.getAuctionLot() != null) {
            var lot = winner.getAuctionLot();
            map.put("id", lot.getId().toString());
            map.put("lotNumber", lot.getLotNumber());
            map.put("title", lot.getTitle());
            map.put("description", lot.getDescription());
            map.put("quantity", lot.getQuantity());
            map.put("unitOfMeasure", lot.getUnitOfMeasure());
        }
        return serializeSnapshot(map);
    }

    private String buildTaxSnapshot(Contract contract, String region, Long taxAmount) {
        Map<String, Object> map = new java.util.HashMap<>();
        if ("IN".equalsIgnoreCase(region)) {
            map.put("taxType", "GST");
            map.put("cgstRate", "9%");
            map.put("sgstRate", "9%");
            map.put("igstRate", "0%");
            map.put("totalTaxRate", "18%");
            map.put("taxAmount", taxAmount);
        } else {
            map.put("taxType", "EXPORT_ZERO_RATE");
            map.put("taxRate", "0%");
            map.put("taxAmount", 0L);
        }
        return serializeSnapshot(map);
    }

    private SettlementResponse mapToResponse(Settlement s) {
        if (s == null) return null;
        return SettlementResponse.builder()
                .id(s.getId())
                .contractId(s.getContract().getId())
                .contractNumber(s.getContractNumber())
                .winnerId(s.getWinnerId())
                .status(s.getStatus())
                .buyerSnapshot(s.getBuyerSnapshot())
                .sellerSnapshot(s.getSellerSnapshot())
                .auctionSnapshot(s.getAuctionSnapshot())
                .lotSnapshot(s.getLotSnapshot())
                .winningAmount(s.getWinningAmount())
                .currency(s.getCurrency())
                .taxSnapshot(s.getTaxSnapshot())
                .generatedTimestamp(s.getGeneratedTimestamp())
                .createdAt(s.getCreatedAt())
                .updatedAt(s.getUpdatedAt())
                .version(s.getVersion())
                .completedBy(s.getCompletedBy())
                .completedAt(s.getCompletedAt())
                .completionRemarks(s.getCompletionRemarks())
                .cancelledBy(s.getCancelledBy())
                .cancelledAt(s.getCancelledAt())
                .cancellationReason(s.getCancellationReason())
                .build();
    }
}
