package com.eagleauctioner.event;

import com.eagleauctioner.entity.OutboxEvent;
import com.eagleauctioner.repository.OutboxEventRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.time.Instant;
import java.util.UUID;

/**
 * Event listener for Settlement core lifecycle events, executing after commit.
 * Persists events into the Outbox table for reliable delivery and downstream processing.
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class SettlementEventListener {

    private final OutboxEventRepository outboxEventRepository;
    private final ObjectMapper objectMapper;

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleSettlementGenerated(SettlementGeneratedEvent event) {
        log.info("[EVENT] SettlementGeneratedEvent processed AFTER_COMMIT. Settlement ID: {}, Contract: {}, Timestamp: {}", 
                event.getSettlementId(), event.getContractNumber(), event.getTimestamp());
        saveOutboxEvent(event.getSettlementId(), "Settlement", "SettlementGeneratedEvent", event);
    }

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleSettlementApproved(SettlementApprovedEvent event) {
        log.info("[EVENT] SettlementApprovedEvent processed AFTER_COMMIT. Settlement ID: {}, Approved By: {}, Timestamp: {}", 
                event.getSettlementId(), event.getApprovedBy(), event.getTimestamp());
        saveOutboxEvent(event.getSettlementId(), "Settlement", "SettlementApprovedEvent", event);
    }

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleSettlementRejected(SettlementRejectedEvent event) {
        log.info("[EVENT] SettlementRejectedEvent processed AFTER_COMMIT. Settlement ID: {}, Rejected By: {}, Reason: {}, Timestamp: {}", 
                event.getSettlementId(), event.getRejectedBy(), event.getReason(), event.getTimestamp());
        saveOutboxEvent(event.getSettlementId(), "Settlement", "SettlementRejectedEvent", event);
    }

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleSettlementCompleted(SettlementCompletedEvent event) {
        log.info("[EVENT] SettlementCompletedEvent processed AFTER_COMMIT. Settlement ID: {}, Completed By: {}, Timestamp: {}", 
                event.getSettlementId(), event.getCompletedBy(), event.getTimestamp());
        saveOutboxEvent(event.getSettlementId(), "Settlement", "SettlementCompletedEvent", event);
    }

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleSettlementCancelled(SettlementCancelledEvent event) {
        log.info("[EVENT] SettlementCancelledEvent processed AFTER_COMMIT. Settlement ID: {}, Cancelled By: {}, Timestamp: {}", 
                event.getSettlementId(), event.getCancelledBy(), event.getTimestamp());
        saveOutboxEvent(event.getSettlementId(), "Settlement", "SettlementCancelledEvent", event);
    }

    private void saveOutboxEvent(UUID aggregateId, String aggregateType, String eventType, Object payload) {
        try {
            String jsonPayload = objectMapper.writeValueAsString(payload);
            OutboxEvent outbox = OutboxEvent.builder()
                    .aggregateId(aggregateId)
                    .aggregateType(aggregateType)
                    .eventType(eventType)
                    .payload(jsonPayload)
                    .createdAt(Instant.now())
                    .processed(false)
                    .status("PENDING")
                    .retryCount(0)
                    .build();
            outboxEventRepository.save(outbox);
            log.info("Successfully persisted OutboxEvent [{}] for aggregateId [{}]", eventType, aggregateId);
        } catch (Exception e) {
            log.error("Failed to persist OutboxEvent [{}] for aggregateId [{}]: ", eventType, aggregateId, e);
        }
    }
}
