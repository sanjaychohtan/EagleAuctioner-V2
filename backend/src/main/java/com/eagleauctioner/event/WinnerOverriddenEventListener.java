package com.eagleauctioner.event;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * Event listener that dispatches post-commit actions and notifications when a winner is manually overridden by admin.
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class WinnerOverriddenEventListener {

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleWinnerOverridden(WinnerOverriddenEvent event) {
        log.info("Transaction COMMITTED: Processing WinnerOverriddenEvent. WinnerId: {}, PreviousBidder: {}, NewBidder: {}, OverriddenBy: {}",
                event.getWinnerId(), event.getPreviousBidderProfileId(), event.getNewBidderProfileId(), event.getOverriddenBy());
        // Integration placeholder for logging security trace and alerting security teams on manual administrative override.
    }
}
