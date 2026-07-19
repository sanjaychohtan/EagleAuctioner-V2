package com.eagleauctioner.service;

import com.eagleauctioner.entity.AuctionResult;
import com.eagleauctioner.entity.AuctionWinner;
import com.eagleauctioner.entity.WinnerHistory;
import com.eagleauctioner.entity.AuctionLot;
import com.eagleauctioner.entity.Bid;
import com.eagleauctioner.enums.WinnerStatus;
import com.eagleauctioner.enums.WinnerSelectionType;
import com.eagleauctioner.enums.AuctionResultStatus;
import com.eagleauctioner.repository.AuctionResultRepository;
import com.eagleauctioner.repository.AuctionWinnerRepository;
import com.eagleauctioner.repository.WinnerHistoryRepository;
import com.eagleauctioner.repository.AuctionLotRepository;
import com.eagleauctioner.repository.BidRepository;
import com.eagleauctioner.dto.WinnerDTOs.WinnerResponse;
import com.eagleauctioner.dto.WinnerDTOs.AuctionResultResponse;
import com.eagleauctioner.policy.ReserveEvaluationPolicy;
import com.eagleauctioner.context.AuditContext;
import com.eagleauctioner.factory.WinnerSnapshotFactory;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.scheduling.annotation.Async;
import com.eagleauctioner.entity.AuctionEvent;
import com.eagleauctioner.enums.AuctionEventType;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Service orchestrating post-auction outcome processing, reserve price validations, and tie-breakers.
 * Utilizes standard strategy pattern via ReserveEvaluationPolicy to handle reserve price rules.
 * Fully optimized to eliminate N+1 queries, memory scans, and duplicate snapshots.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class AuctionResultService {

    private final AuctionResultRepository auctionResultRepository;
    private final AuctionWinnerRepository auctionWinnerRepository;
    private final WinnerHistoryRepository winnerHistoryRepository;
    private final AuctionLotRepository auctionLotRepository;
    private final BidRepository bidRepository;
    private final ReserveEvaluationPolicy reserveEvaluationPolicy;

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void handleLotClosed(AuctionEvent event) {
        if (event.getEventType() == AuctionEventType.LOT_ENDED) {
            log.info("Received LOT_ENDED event for lot {}, evaluating outcome.", event.getLotId());
            try {
                evaluateLotOutcome(event.getLotId());
            } catch (Exception e) {
                log.error("Error evaluating lot outcome on event for lot {}: {}", event.getLotId(), e.getMessage(), e);
            }
        }
    }

    @Transactional
    public AuctionResultResponse evaluateLotOutcome(UUID lotId) {
        log.info("Starting post-auction evaluation for lot: {}", lotId);

        AuctionLot lot = auctionLotRepository.findById(lotId)
                .orElseThrow(() -> new IllegalArgumentException("Lot not found: " + lotId));

        // Check if result already exists using optimized fetch join query
        Optional<AuctionResult> existingResult = auctionResultRepository.findByAuctionLotId(lotId);
        if (existingResult.isPresent()) {
            log.info("Lot {} outcome was already evaluated previously.", lotId);
            return mapToResultResponse(existingResult.get());
        }

        // Fetch all active, non-rejected bids for this lot with bidderProfile eager loaded (FIX-3)
        List<Bid> bids = bidRepository.findActiveBidsByLotIdWithBidderProfile(lotId);

        if (bids.isEmpty()) {
            log.info("No valid bids found for lot: {}. Evaluation resulting in NO_BIDS.", lotId);
            AuctionResult noBidResult = AuctionResult.builder()
                    .auctionLot(lot)
                    .status(AuctionResultStatus.NO_BIDS)
                    .highestBidAmount(0L)
                    .reservePrice(lot.getReservePrice())
                    .reserveMet(false)
                    .winner(null)
                    .build();

            AuctionResult saved = auctionResultRepository.save(noBidResult);
            return mapToResultResponse(saved);
        }

        // Apply strict tie-breaking & fallback business rules:
        // 1. Highest valid bid wins.
        // 2. Earlier bid wins on tie.
        // 3. UUID deterministic fallback if both amount and time are identical.
        Bid winningBid = bids.stream()
                .min((b1, b2) -> {
                    int amountComp = b2.getBidAmount().compareTo(b1.getBidAmount());
                    if (amountComp != 0) {
                        return amountComp;
                    }
                    int timeComp = b1.getBidTime().compareTo(b2.getBidTime());
                    if (timeComp != 0) {
                        return timeComp;
                    }
                    return b1.getId().toString().compareTo(b2.getId().toString());
                })
                .orElseThrow(() -> new IllegalStateException("Unexpected empty bid list for lot " + lotId));

        Long highestBidAmount = winningBid.getBidAmount();
        Long reservePrice = lot.getReservePrice();

        // DECOUPLED STRATEGY PATTERN INVOCATION
        boolean reserveMet = reserveEvaluationPolicy.isReserveMet(lot, highestBidAmount);

        AuctionResultStatus resultStatus = reserveMet ? AuctionResultStatus.COMPLETED : AuctionResultStatus.PENDING_APPROVAL;
        WinnerStatus winnerStatus = reserveMet ? WinnerStatus.AUTO_APPROVED : WinnerStatus.PENDING_SELLER_APPROVAL;

        // Use WinnerSnapshotFactory to encapsulate snapshot generation (FIX-6)
        AuctionWinner.AuctionWinnerBuilder winnerBuilder = AuctionWinner.builder()
                .auctionLot(lot)
                .bidderProfile(winningBid.getBidderProfile())
                .bid(winningBid)
                .status(winnerStatus)
                .selectionType(WinnerSelectionType.AUTOMATIC)
                .winningAmount(highestBidAmount)
                .notes(reserveMet ? "Reserve met. Auto-approved." : "Reserve not met. Pending seller approval.");

        AuctionWinner winner = WinnerSnapshotFactory.populateSnapshots(
                winnerBuilder, lot, winningBid.getBidderProfile(), winningBid, highestBidAmount
        ).build();

        winner = auctionWinnerRepository.save(winner);

        // Fetch non-hardcoded values from dynamic thread-bound AuditContext (FIX-2)
        AuditContext auditCtx = null;
        try {
            auditCtx = AuditContext.get();
        } catch (Exception e) {
            // ignore
        }
        
        String actionBy = auditCtx != null ? auditCtx.getExecutor() : "SYSTEM";
        UUID actorId = auditCtx != null ? auditCtx.getActorId() : null;
        String corrId = auditCtx != null ? auditCtx.getCorrelationId() : null;
        String ipAddr = auditCtx != null ? auditCtx.getIpAddress() : null;
        String userAgt = auditCtx != null ? auditCtx.getUserAgent() : null;

        // Record initial status in history with complete security/audit contexts
        WinnerHistory history = WinnerHistory.builder()
                .winner(winner)
                .previousStatus(null)
                .newStatus(winnerStatus)
                .actionBy(actionBy)
                .actionAt(Instant.now())
                .remarks(winner.getNotes())
                .actorId(actorId)
                .actorType("SYSTEM")
                .reason("Post-Auction Lot Settlement Engine Evaluation")
                .comments(winner.getNotes())
                .correlationId(corrId)
                .ipAddress(ipAddr)
                .userAgent(userAgt)
                .actionTimestamp(Instant.now())
                .build();
        winnerHistoryRepository.save(history);

        AuctionResult result = AuctionResult.builder()
                .auctionLot(lot)
                .status(resultStatus)
                .highestBidAmount(highestBidAmount)
                .reservePrice(reservePrice)
                .reserveMet(reserveMet)
                .winner(winner)
                .build();

        AuctionResult savedResult = auctionResultRepository.save(result);
        log.info("Evaluated lot {} outcome successfully. Winner: {}, Amount: {}, Reserve Met: {}", 
                lotId, winner.getBidderProfile().getId(), highestBidAmount, reserveMet);

        return mapToResultResponse(savedResult);
    }

    public Optional<AuctionResultResponse> findResultByLot(UUID lotId) {
        return auctionResultRepository.findByAuctionLotId(lotId).map(this::mapToResultResponse);
    }

    public WinnerResponse mapToWinnerResponse(AuctionWinner winner) {
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

    public AuctionResultResponse mapToResultResponse(AuctionResult result) {
        if (result == null) {
            return null;
        }
        return AuctionResultResponse.builder()
                .id(result.getId())
                .auctionLotId(result.getAuctionLot().getId())
                .status(result.getStatus())
                .highestBidAmount(result.getHighestBidAmount())
                .reservePrice(result.getReservePrice())
                .reserveMet(result.getReserveMet())
                .winner(mapToWinnerResponse(result.getWinner()))
                .build();
    }
}
