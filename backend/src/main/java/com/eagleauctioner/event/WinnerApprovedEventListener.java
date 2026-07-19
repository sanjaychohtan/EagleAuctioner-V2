package com.eagleauctioner.event;

import com.eagleauctioner.entity.AuctionWinner;
import com.eagleauctioner.repository.AuctionWinnerRepository;
import com.eagleauctioner.service.SaleConfirmationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * Event listener that dispatches post-commit actions and notifications when a winner is approved.
 * Runs asynchronously and out-of-band to prevent side-effect failures from blocking database transactions.
 * Automatically initiates the Commercial Document Engine cascade by creating a Draft Sale Confirmation.
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class WinnerApprovedEventListener {

    private final AuctionWinnerRepository auctionWinnerRepository;
    private final SaleConfirmationService saleConfirmationService;

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void handleWinnerApproved(WinnerApprovedEvent event) {
        log.info("Transaction COMMITTED: Processing WinnerApprovedEvent. WinnerId: {}, LotId: {}, WinnerAmount: {}",
                event.getWinnerId(), event.getAuctionLotId(), event.getWinningAmount());

        try {
            AuctionWinner winner = auctionWinnerRepository.findByIdWithRelations(event.getWinnerId())
                    .orElseThrow(() -> new IllegalArgumentException("Winner not found for post-commit processing: " + event.getWinnerId()));

            log.info("Executing Commercial Document Engine trigger: Creating Auto Draft Sale Confirmation");
            saleConfirmationService.createDraft(winner);
            
        } catch (Exception e) {
            log.error("Failed to automatically generate Sale Confirmation for Winner: " + event.getWinnerId(), e);
        }
    }
}
