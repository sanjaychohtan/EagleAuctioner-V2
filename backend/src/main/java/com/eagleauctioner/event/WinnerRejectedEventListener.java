package com.eagleauctioner.event;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * Event listener that dispatches post-commit actions and notifications when an under-reserve winner is rejected.
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class WinnerRejectedEventListener {

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleWinnerRejected(WinnerRejectedEvent event) {
        log.info("Transaction COMMITTED: Processing WinnerRejectedEvent. WinnerId: {}, LotId: {}, RejectedBy: {}",
                event.getWinnerId(), event.getAuctionLotId(), event.getRejectedBy());
        // Integration placeholder for re-listing, notifying other bidders, or logging.
    }
}
