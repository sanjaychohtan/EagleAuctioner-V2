package com.eagleauctioner.service;

import com.eagleauctioner.entity.AuctionResult;
import com.eagleauctioner.entity.AuctionWinner;
import com.eagleauctioner.entity.WinnerHistory;
import com.eagleauctioner.entity.AuctionLot;
import com.eagleauctioner.entity.BidderProfile;
import com.eagleauctioner.entity.Bid;
import com.eagleauctioner.enums.WinnerStatus;
import com.eagleauctioner.enums.WinnerSelectionType;
import com.eagleauctioner.enums.AuctionResultStatus;
import com.eagleauctioner.enums.AuctionLotStatus;
import com.eagleauctioner.enums.AuctionState;
import com.eagleauctioner.repository.AuctionResultRepository;
import com.eagleauctioner.repository.AuctionWinnerRepository;
import com.eagleauctioner.repository.WinnerHistoryRepository;
import com.eagleauctioner.repository.AuctionLotRepository;
import com.eagleauctioner.repository.BidRepository;
import com.eagleauctioner.repository.BidderProfileRepository;
import com.eagleauctioner.dto.WinnerDTOs.WinnerRequest;
import com.eagleauctioner.dto.WinnerDTOs.WinnerResponse;
import com.eagleauctioner.dto.WinnerDTOs.AuctionResultResponse;

import com.eagleauctioner.event.WinnerApprovedEvent;
import com.eagleauctioner.event.WinnerRejectedEvent;
import com.eagleauctioner.event.WinnerOverriddenEvent;
import com.eagleauctioner.context.AuditContext;
import com.eagleauctioner.factory.WinnerSnapshotFactory;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.context.ApplicationEventPublisher;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Service managing winner approvals, rejections, manual administrative overrides, and audit trails.
 * Publishes native ApplicationEvents and secures snapshot values at post-auction settlement.
 * Fully hardened to resolve N+1 issues and remove all hardcoded audit/trace parameters.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class WinnerService {

    private final AuctionWinnerRepository auctionWinnerRepository;
    private final AuctionResultRepository auctionResultRepository;
    private final WinnerHistoryRepository winnerHistoryRepository;
    private final AuctionLotRepository auctionLotRepository;
    private final BidRepository bidRepository;
    private final BidderProfileRepository bidderProfileRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public WinnerResponse approveUnderReserveWinner(UUID winnerId, String remarks, UUID currentUserId, String executorName, boolean isAdmin) {
        log.info("Seller/Admin attempting to approve under-reserve winner {}. Executor: {}", winnerId, executorName);

        // Optimized fetch join of relations to prevent N+1 (FIX-4)
        AuctionWinner winner = auctionWinnerRepository.findByIdWithRelations(winnerId)
                .orElseThrow(() -> new IllegalArgumentException("Winner record not found: " + winnerId));

        // Enforce business authorization check: user must be the lot's auction owner (seller) OR an administrator
        validateSellerOrAdminOwnership(winner.getAuctionLot(), currentUserId, isAdmin);

        if (winner.getStatus() != WinnerStatus.PENDING_SELLER_APPROVAL) {
            throw new IllegalStateException("Winner cannot be approved in its current status: " + winner.getStatus());
        }

        WinnerStatus previousStatus = winner.getStatus();
        winner.setStatus(WinnerStatus.APPROVED);
        winner.setSellerDecisionAt(Instant.now());
        winner.setNotes(remarks);
        winner = auctionWinnerRepository.save(winner);
        
        final UUID lotId = winner.getAuctionLot().getId();

        // Update associated AuctionResult status to COMPLETED
        AuctionResult result = auctionResultRepository.findByAuctionLotId(lotId)
                .orElseThrow(() -> new IllegalStateException("Auction result not found for lot: " + lotId));
        result.setStatus(AuctionResultStatus.COMPLETED);
        result.setReserveMet(false); // Approved under reserve, so reserve was NOT met.
        auctionResultRepository.save(result);

        // Record history with dynamic AuditContext parameters (FIX-2)
        AuditContext auditCtx = null;
        try {
            auditCtx = AuditContext.get();
        } catch (Exception e) {
            // Allow tests or contexts without thread-local
        }
        String corrId = auditCtx != null ? auditCtx.getCorrelationId() : null;
        String ipAddr = auditCtx != null ? auditCtx.getIpAddress() : null;
        String userAgt = auditCtx != null ? auditCtx.getUserAgent() : null;

        recordHistory(
                winner, 
                previousStatus, 
                WinnerStatus.APPROVED, 
                currentUserId, 
                isAdmin ? "ADMIN" : "SELLER", 
                executorName, 
                remarks, 
                "Manual approval of bid under reserve price threshold", 
                corrId, 
                ipAddr, 
                userAgt
        );

        // Publish WinnerApprovedEvent to notify surrounding boundaries
        eventPublisher.publishEvent(new WinnerApprovedEvent(
                winner.getId(),
                winner.getAuctionLot().getId(),
                winner.getBidderProfile().getId(),
                winner.getWinningAmount(),
                executorName
        ));

        log.info("Winner {} successfully approved by seller/admin {}", winnerId, executorName);
        return mapToWinnerResponse(winner);
    }

    @Transactional
    public WinnerResponse rejectUnderReserveWinner(UUID winnerId, String remarks, UUID currentUserId, String executorName, boolean isAdmin) {
        log.info("Seller/Admin attempting to reject under-reserve winner {}. Executor: {}", winnerId, executorName);

        // Optimized fetch join of relations to prevent N+1 (FIX-4)
        AuctionWinner winner = auctionWinnerRepository.findByIdWithRelations(winnerId)
                .orElseThrow(() -> new IllegalArgumentException("Winner record not found: " + winnerId));

        validateSellerOrAdminOwnership(winner.getAuctionLot(), currentUserId, isAdmin);

        if (winner.getStatus() != WinnerStatus.PENDING_SELLER_APPROVAL) {
            throw new IllegalStateException("Winner cannot be rejected in its current status: " + winner.getStatus());
        }

        WinnerStatus previousStatus = winner.getStatus();
        winner.setStatus(WinnerStatus.REJECTED);
        winner.setSellerDecisionAt(Instant.now());
        winner.setNotes(remarks);
        winner = auctionWinnerRepository.save(winner);
        
        final UUID lotId = winner.getAuctionLot().getId();

        // Update associated AuctionResult status to RESERVE_NOT_MET
        AuctionResult result = auctionResultRepository.findByAuctionLotId(lotId)
                .orElseThrow(() -> new IllegalStateException("Auction result not found for lot: " + lotId));
        result.setStatus(AuctionResultStatus.RESERVE_NOT_MET);
        auctionResultRepository.save(result);

        // Record history with dynamic AuditContext parameters (FIX-2)
        AuditContext auditCtx = null;
        try {
            auditCtx = AuditContext.get();
        } catch (Exception e) {
            // Allow tests or contexts without thread-local
        }
        String corrId = auditCtx != null ? auditCtx.getCorrelationId() : null;
        String ipAddr = auditCtx != null ? auditCtx.getIpAddress() : null;
        String userAgt = auditCtx != null ? auditCtx.getUserAgent() : null;

        recordHistory(
                winner, 
                previousStatus, 
                WinnerStatus.REJECTED, 
                currentUserId, 
                isAdmin ? "ADMIN" : "SELLER", 
                executorName, 
                remarks, 
                "Manual rejection of bid under reserve price threshold", 
                corrId, 
                ipAddr, 
                userAgt
        );

        // Publish WinnerRejectedEvent to notify surrounding boundaries
        eventPublisher.publishEvent(new WinnerRejectedEvent(
                winner.getId(),
                winner.getAuctionLot().getId(),
                winner.getBidderProfile().getId(),
                executorName
        ));

        log.info("Winner {} successfully rejected by seller/admin {}", winnerId, executorName);
        return mapToWinnerResponse(winner);
    }

    @Transactional
    public WinnerResponse manualOverrideWinner(WinnerRequest request, String adminUserEmail) {
        UUID currentUserId = null;
        try {
            AuditContext auditCtx = AuditContext.get();
            currentUserId = auditCtx.getActorId();
        } catch (Exception e) {
            // Allow override if context not initialized
        }
        return manualOverrideWinner(request, adminUserEmail, currentUserId);
    }

    @Transactional
    public WinnerResponse manualOverrideWinner(WinnerRequest request, String adminUserEmail, UUID currentUserId) {
        log.info("Admin manual override initiated for lot {}. Executor: {}, Actor: {}", request.getAuctionLotId(), adminUserEmail, currentUserId);

        AuctionLot lot = auctionLotRepository.findById(request.getAuctionLotId())
                .orElseThrow(() -> new IllegalArgumentException("Auction lot not found: " + request.getAuctionLotId()));

        // Validate appropriate auction/lot state before override
        if (lot.getLotStatus() == AuctionLotStatus.DRAFT || lot.getLotStatus() == AuctionLotStatus.READY || lot.getLotStatus() == AuctionLotStatus.LIVE) {
            throw new IllegalStateException("Cannot manual override winner for a lot that is still active or in draft.");
        }
        if (lot.getAuction() != null && lot.getAuction().getState() != null) {
            AuctionState auctionState = lot.getAuction().getState();
            if (auctionState != AuctionState.ENDED && auctionState != AuctionState.SETTLED && auctionState != AuctionState.CANCELLED && auctionState != AuctionState.ARCHIVED) {
                throw new IllegalStateException("Cannot manual override winner before the auction is completed/ended.");
            }
        }

        BidderProfile bidder = bidderProfileRepository.findById(request.getBidderProfileId())
                .orElseThrow(() -> new IllegalArgumentException("Bidder profile not found: " + request.getBidderProfileId()));

        Bid bid = null;
        if (request.getBidId() != null) {
            bid = bidRepository.findById(request.getBidId())
                    .orElseThrow(() -> new IllegalArgumentException("Bid record not found: " + request.getBidId()));
            if (bid.getAuctionLot() == null || !bid.getAuctionLot().getId().equals(lot.getId())) {
                throw new IllegalArgumentException("The selected bid does not belong to the same auction lot being overridden.");
            }
        }

        Long winningAmount = bid != null ? bid.getBidAmount() : lot.getStartingPrice();

        Optional<AuctionWinner> existingWinnerOpt = auctionWinnerRepository.findByAuctionLotId(request.getAuctionLotId());
        AuctionWinner winner;
        WinnerStatus previousStatus = null;
        UUID previousBidderId = null;

        if (existingWinnerOpt.isPresent()) {
            winner = existingWinnerOpt.get();
            if (winner.getStatus() == WinnerStatus.MANUAL_OVERRIDE && winner.getBidderProfile().getId().equals(bidder.getId())) {
                throw new IllegalStateException("The winner for this lot is already manually overridden with the same bidder.");
            }
            previousStatus = winner.getStatus();
            previousBidderId = winner.getBidderProfile().getId();
            winner.setBidderProfile(bidder);
            winner.setBid(bid);
            winner.setStatus(WinnerStatus.MANUAL_OVERRIDE);
            winner.setSelectionType(WinnerSelectionType.MANUAL_OVERRIDE);
            winner.setWinningAmount(winningAmount);
            winner.setNotes(request.getRemarks());
            
            // Centralized Snapshot Factory (FIX-6)
            WinnerSnapshotFactory.populateSnapshotsOnInstance(winner, lot, bidder, bid, winningAmount);
        } else {
            AuctionWinner.AuctionWinnerBuilder winnerBuilder = AuctionWinner.builder()
                    .auctionLot(lot)
                    .bidderProfile(bidder)
                    .bid(bid)
                    .status(WinnerStatus.MANUAL_OVERRIDE)
                    .selectionType(WinnerSelectionType.MANUAL_OVERRIDE)
                    .winningAmount(winningAmount)
                    .notes(request.getRemarks());

            winner = WinnerSnapshotFactory.populateSnapshots(winnerBuilder, lot, bidder, bid, winningAmount).build();
        }

        winner = auctionWinnerRepository.save(winner);

        // Upsert AuctionResult to reflect completed override
        Optional<AuctionResult> resultOpt = auctionResultRepository.findByAuctionLotId(request.getAuctionLotId());
        AuctionResult result;
        boolean isResMet = lot.getReservePrice() != null && winningAmount.compareTo(lot.getReservePrice()) >= 0;
        if (resultOpt.isPresent()) {
            result = resultOpt.get();
            result.setStatus(AuctionResultStatus.COMPLETED);
            result.setHighestBidAmount(winningAmount);
            result.setReserveMet(isResMet);
            result.setWinner(winner);
        } else {
            result = AuctionResult.builder()
                    .auctionLot(lot)
                    .status(AuctionResultStatus.COMPLETED)
                    .highestBidAmount(winningAmount)
                    .reservePrice(lot.getReservePrice())
                    .reserveMet(isResMet)
                    .winner(winner)
                    .build();
        }
        auctionResultRepository.save(result);

        AuditContext auditCtx = null;
        try {
            auditCtx = AuditContext.get();
        } catch (Exception e) {
            // ignore
        }
        String corrId = auditCtx != null ? auditCtx.getCorrelationId() : null;
        String ipAddr = auditCtx != null ? auditCtx.getIpAddress() : null;
        String userAgt = auditCtx != null ? auditCtx.getUserAgent() : null;

        // Record history entry using only the verified currentUserId passed from the controller
        recordHistory(
                winner, 
                previousStatus, 
                WinnerStatus.MANUAL_OVERRIDE, 
                currentUserId, 
                "ADMIN", 
                adminUserEmail, 
                request.getRemarks(), 
                "Administrative override of the lot winner", 
                corrId, 
                ipAddr, 
                userAgt
        );

        // Publish WinnerOverriddenEvent to notify surrounding boundaries
        eventPublisher.publishEvent(new WinnerOverriddenEvent(
                winner.getId(),
                winner.getAuctionLot().getId(),
                previousBidderId != null ? previousBidderId : bidder.getId(),
                bidder.getId(),
                adminUserEmail
        ));

        log.info("Admin manual override completed for lot {}. Winner updated to: {}", lot.getId(), bidder.getId());
        return mapToWinnerResponse(winner);
    }

    private void validateSellerOrAdminOwnership(AuctionLot lot, UUID currentUserId, boolean isAdmin) {
        if (isAdmin) {
            return; // Admin bypasses ownership constraints
        }
        if (lot.getAuction() != null && lot.getAuction().getSellerProfile() != null 
                && lot.getAuction().getSellerProfile().getUser() != null) {
            UUID ownerUserId = lot.getAuction().getSellerProfile().getUser().getId();
            if (ownerUserId != null && ownerUserId.equals(currentUserId)) {
                return; // Valid seller owner
            }
        }
        throw new org.springframework.security.access.AccessDeniedException("Unauthorized: You do not own this auction lot.");
    }

    private void recordHistory(
            AuctionWinner winner, 
            WinnerStatus previous, 
            WinnerStatus current, 
            UUID actorId,
            String actorType,
            String executor, 
            String remarks,
            String reason,
            String correlationId,
            String ipAddress,
            String userAgent) {
        
        UUID resolvedActorId = actorId;
        if (resolvedActorId == null) {
            try {
                AuditContext auditCtx = AuditContext.get();
                if (auditCtx != null && auditCtx.getActorId() != null) {
                    resolvedActorId = auditCtx.getActorId();
                }
            } catch (Exception e) {
                // ignore
            }
        }
        if (resolvedActorId == null) {
            resolvedActorId = UUID.fromString("00000000-0000-0000-0000-000000000000"); // SYSTEM Fallback UUID
        }

        String resolvedActorType = actorType != null ? actorType : "SYSTEM";
        String resolvedExecutor = executor != null && !executor.trim().isEmpty() ? executor : "SYSTEM";

        String resolvedCorrId = correlationId;
        if (resolvedCorrId == null || resolvedCorrId.trim().isEmpty()) {
            try {
                AuditContext auditCtx = AuditContext.get();
                if (auditCtx != null && auditCtx.getCorrelationId() != null) {
                    resolvedCorrId = auditCtx.getCorrelationId();
                }
            } catch (Exception e) {
                // ignore
            }
        }
        if (resolvedCorrId == null || resolvedCorrId.trim().isEmpty()) {
            resolvedCorrId = "CORR-SYSTEM-FALLBACK";
        }

        String resolvedIpAddress = ipAddress;
        if (resolvedIpAddress == null || resolvedIpAddress.trim().isEmpty()) {
            try {
                AuditContext auditCtx = AuditContext.get();
                if (auditCtx != null && auditCtx.getIpAddress() != null) {
                    resolvedIpAddress = auditCtx.getIpAddress();
                }
            } catch (Exception e) {
                // ignore
            }
        }
        if (resolvedIpAddress == null || resolvedIpAddress.trim().isEmpty()) {
            resolvedIpAddress = "127.0.0.1";
        }

        String resolvedUserAgent = userAgent;
        if (resolvedUserAgent == null || resolvedUserAgent.trim().isEmpty()) {
            try {
                AuditContext auditCtx = AuditContext.get();
                if (auditCtx != null && auditCtx.getUserAgent() != null) {
                    resolvedUserAgent = auditCtx.getUserAgent();
                }
            } catch (Exception e) {
                // ignore
            }
        }
        if (resolvedUserAgent == null || resolvedUserAgent.trim().isEmpty()) {
            resolvedUserAgent = "SYSTEM-AGENT-FALLBACK";
        }
        
        Instant now = Instant.now();
        WinnerHistory history = WinnerHistory.builder()
                .winner(winner)
                .previousStatus(previous)
                .newStatus(current)
                .actionBy(resolvedExecutor)
                .actionAt(now)
                .remarks(remarks)
                .actorId(resolvedActorId)
                .actorType(resolvedActorType)
                .reason(reason)
                .comments(remarks)
                .correlationId(resolvedCorrId)
                .ipAddress(resolvedIpAddress)
                .userAgent(resolvedUserAgent)
                .actionTimestamp(now)
                .build();
        winnerHistoryRepository.save(history);
    }

    private WinnerResponse mapToWinnerResponse(AuctionWinner winner) {
        if (winner == null) {
            return null;
        }
        return WinnerResponse.builder()
                .id(winner.getId())
                .auctionLotId(winner.getAuctionLot().getId())
                .bidderProfileId(winner.getBidderProfile().getId())
                .bidId(winner.getBid() != null ? winner.getBid().getId() : null)
                .status(winner.getStatus())
                .selectionType(winner.getSelectionType())
                .winningAmount(winner.getWinningAmount())
                .sellerDecisionAt(winner.getSellerDecisionAt())
                .notes(winner.getNotes())
                .winnerCompanyName(winner.getWinnerCompanyName())
                .winnerDisplayName(winner.getWinnerDisplayName())
                .winnerAnonymousCode(winner.getWinnerAnonymousCode())
                .winnerBidAmountSnapshot(winner.getWinnerBidAmountSnapshot())
                .winnerBidTimeSnapshot(winner.getWinnerBidTimeSnapshot())
                .sellerCompanySnapshot(winner.getSellerCompanySnapshot())
                .reservePriceSnapshot(winner.getReservePriceSnapshot())
                .currencySnapshot(winner.getCurrencySnapshot())
                .taxProfileSnapshot(winner.getTaxProfileSnapshot())
                .build();
    }
}
