package com.eagleauctioner.service;

import java.util.UUID;
import com.eagleauctioner.entity.AuctionWinner;
import com.eagleauctioner.event.*;
import com.eagleauctioner.repository.AuctionWinnerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * Decoupled Domain Event listener governing the contract lifecycle and its downstream impacts.
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class ContractEventListener {

    private final ContractService contractService;
    private final AuctionWinnerRepository auctionWinnerRepository;
    private final PaymentService paymentService;
    private final LedgerService ledgerService;

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void handleWinnerApproved(WinnerApprovedEvent event) {
        log.info("Contract Engine Latch: Processing approved lot winner {}", event.getWinnerId());
        try {
            AuctionWinner winner = auctionWinnerRepository.findById(event.getWinnerId())
                    .orElseThrow(() -> new IllegalArgumentException("Winner not found for contract engine: " + event.getWinnerId()));

            contractService.createContractDraft(winner);
            log.info("Auto Draft Contract created successfully for Winner: {}", event.getWinnerId());
        } catch (Exception ex) {
            log.error("Failed to auto-create Contract for winner: " + event.getWinnerId(), ex);
        }
    }

    @EventListener
    @Async
    public void onContractGenerated(ContractGeneratedEvent event) {
        log.info("Contract Generated: {}. Sending notifications.", event.getContractId());
        this.notifyContractUpdate(event.getContractId(), "DRAFT", "SYSTEM");
    }

    @EventListener
    @Async
    public void onContractAccepted(ContractAcceptedEvent event) {
        log.info("Contract Accepted: {}. Triggering downstream workflows.", event.getContractId());
        this.notifyContractUpdate(event.getContractId(), "ACCEPTED", event.getAcceptedBy());
    }

    @EventListener
    @Async
    public void onContractRejected(ContractRejectedEvent event) {
        log.info("Contract Rejected: {}. Reason: {}", event.getContractId(), event.getReason());
        this.notifyContractUpdate(event.getContractId(), "REJECTED", event.getRejectedBy());
    }

    @EventListener
    @Async
    public void onContractTerminated(ContractTerminatedEvent event) {
        log.info("Contract Terminated: {}. Reversing financial obligations.", event.getContractId());
        this.notifyContractUpdate(event.getContractId(), "TERMINATED", event.getTerminatedBy());
        
        // Cascades to Payment and Ledger for reversals (Phase 7 & 8 integration)
        paymentService.voidPaymentObligations(event.getContractId());
        ledgerService.reverseEntries(event.getContractId());
    }

    private void notifyContractUpdate(UUID contractId, String status, String actor) {
        log.info("Enterprise Notification: Contract {} updated to {} by {}", contractId, status, actor);
    }
}
