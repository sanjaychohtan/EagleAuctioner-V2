package com.eagleauctioner.event;

import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * Event listener for Settlement core lifecycle events, executing after commit.
 * TODO: Implement Outbox Pattern / Retry Engine for robust event delivery.
 * Currently, event failures (e.g., in @Async processing) will only be logged and could 
 * result in missed downstream workflow triggers. A reliable event publishing mechanism
 * is required for production.
 */
@Component
@Slf4j
public class SettlementEventListener {

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleSettlementGenerated(SettlementGeneratedEvent event) {
        log.info("[EVENT] SettlementGeneratedEvent processed AFTER_COMMIT. Settlement ID: {}, Contract: {}, Timestamp: {}", 
                event.getSettlementId(), event.getContractNumber(), event.getTimestamp());
    }

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleSettlementApproved(SettlementApprovedEvent event) {
        log.info("[EVENT] SettlementApprovedEvent processed AFTER_COMMIT. Settlement ID: {}, Approved By: {}, Timestamp: {}", 
                event.getSettlementId(), event.getApprovedBy(), event.getTimestamp());
    }

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleSettlementRejected(SettlementRejectedEvent event) {
        log.info("[EVENT] SettlementRejectedEvent processed AFTER_COMMIT. Settlement ID: {}, Rejected By: {}, Reason: {}, Timestamp: {}", 
                event.getSettlementId(), event.getRejectedBy(), event.getReason(), event.getTimestamp());
    }

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleSettlementCompleted(SettlementCompletedEvent event) {
        log.info("[EVENT] SettlementCompletedEvent processed AFTER_COMMIT. Settlement ID: {}, Completed By: {}, Timestamp: {}", 
                event.getSettlementId(), event.getCompletedBy(), event.getTimestamp());
    }

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleSettlementCancelled(SettlementCancelledEvent event) {
        log.info("[EVENT] SettlementCancelledEvent processed AFTER_COMMIT. Settlement ID: {}, Cancelled By: {}, Timestamp: {}", 
                event.getSettlementId(), event.getCancelledBy(), event.getTimestamp());
    }
}
