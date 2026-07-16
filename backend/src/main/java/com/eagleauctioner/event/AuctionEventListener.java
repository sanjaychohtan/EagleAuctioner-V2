package com.eagleauctioner.event;

import com.eagleauctioner.entity.AuctionEvent;
import com.eagleauctioner.repository.OutboxEventRepository;
import com.eagleauctioner.service.AuctionWebSocketService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.util.Map;

/**
 * Event listener that dispatches live messages via WebSockets strictly AFTER transactions commit.
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class AuctionEventListener {

    private final AuctionWebSocketService webSocketService;
    private final OutboxEventRepository outboxEventRepository;
    private final ObjectMapper objectMapper;

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleAuctionEvent(AuctionEvent event) {
        log.info("Processing auction event AFTER_COMMIT for type: {}", event.getEventType());

        try {
            Map<String, Object> message = Map.of(
                    "eventId", event.getId().toString(),
                    "eventType", event.getEventType().name(),
                    "payload", event.getPayload() != null ? event.getPayload() : "",
                    "timestamp", event.getTimestamp().toString(),
                    "triggeredBy", event.getTriggeredBy() != null ? event.getTriggeredBy() : "SYSTEM"
            );

            if (event.getLotId() != null) {
                webSocketService.broadcastLotUpdate(event.getLotId(), message);
            }
            if (event.getAuctionId() != null) {
                webSocketService.broadcastAuctionUpdate(event.getAuctionId(), message);
            }

            log.info("Successfully dispatched websocket notification for event {}", event.getId());
        } catch (Exception e) {
            log.error("Failed to handle outbox or websocket dispatch for event {}", event.getId(), e);
        }
    }
}
