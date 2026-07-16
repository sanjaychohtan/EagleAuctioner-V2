package com.eagleauctioner.service;

import com.eagleauctioner.entity.OutboxEvent;
import com.eagleauctioner.repository.OutboxEventRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;
import io.micrometer.core.instrument.MeterRegistry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class OutboxProcessor {

    private final OutboxEventRepository outboxEventRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final MeterRegistry meterRegistry;
    private final ObjectMapper objectMapper;
    
    private static final int MAX_RETRIES = 5;

    @Scheduled(fixedDelay = 5000)
    @Transactional
    public void processOutboxEvents() {
        String nodeId = System.getenv("HOSTNAME");
        if (nodeId == null || nodeId.trim().isEmpty()) {
            try {
                nodeId = java.net.InetAddress.getLocalHost().getHostName();
            } catch (Exception ex) {
                nodeId = "fallback-node-unknown";
            }
        }
        Instant now = Instant.now();
        List<OutboxEvent> events = outboxEventRepository.findEventsToProcess(now);
        
        meterRegistry.gauge("outbox.queue.size", events.size());
        
        for (OutboxEvent event : events) {
            event.setLastAttemptTime(now);
            event.setProcessingNode(nodeId);
            try {
                log.info("Processing OutboxEvent: {} on node {}", event.getId(), nodeId);
                
                if (event.getPayload() == null || event.getPayload().isEmpty()) {
                    throw new IllegalArgumentException("Poison message: Empty payload");
                }
                
                JsonNode root = objectMapper.readTree(event.getPayload());
                
                String eventVersion = root.has("eventVersion") ? root.get("eventVersion").asText() : (event.getEventVersion() != null ? event.getEventVersion() : "1.0");
                String schemaVersion = root.has("schemaVersion") ? root.get("schemaVersion").asText() : (event.getSchemaVersion() != null ? event.getSchemaVersion() : "1.0");
                Long aggregateVersion = root.has("aggregateVersion") ? root.get("aggregateVersion").asLong() : (event.getAggregateVersion() != null ? event.getAggregateVersion() : 1L);
                
                if ("FinancialPeriodClosedEvent".equals(event.getEventType())) {
                    UUID periodId = UUID.fromString(root.get("periodId").asText());
                    String periodName = root.get("periodName").asText();
                    eventPublisher.publishEvent(new com.eagleauctioner.event.FinancialPeriodClosedEvent(periodId, periodName, eventVersion, schemaVersion, aggregateVersion));
                } else if ("GSTInvoiceGeneratedEvent".equals(event.getEventType())) {
                    UUID invoiceId = UUID.fromString(root.get("invoiceId").asText());
                    UUID settlementId = UUID.fromString(root.get("settlementId").asText());
                    String invoiceNumber = root.get("invoiceNumber").asText();
                    eventPublisher.publishEvent(new com.eagleauctioner.event.GSTInvoiceGeneratedEvent(invoiceId, settlementId, invoiceNumber, eventVersion, schemaVersion, aggregateVersion));
                } else if ("LedgerPostedEvent".equals(event.getEventType())) {
                    UUID batchId = UUID.fromString(root.get("batchId").asText());
                    String batchReference = root.get("batchReference").asText();
                    eventPublisher.publishEvent(new com.eagleauctioner.event.LedgerPostedEvent(batchId, batchReference, eventVersion, schemaVersion, aggregateVersion));
                } else if ("ReconciliationCompletedEvent".equals(event.getEventType())) {
                    UUID reconciliationId = UUID.fromString(root.get("reconciliationId").asText());
                    String reconciliationType = root.get("reconciliationType").asText();
                    eventPublisher.publishEvent(new com.eagleauctioner.event.ReconciliationCompletedEvent(reconciliationId, reconciliationType, eventVersion, schemaVersion, aggregateVersion));
                } else {
                    throw new IllegalArgumentException("Unsupported or unknown outbox event type: " + event.getEventType());
                }
                
                event.setProcessed(true);
                event.setStatus("COMPLETED");
                event.setProcessedAt(now);
                
                meterRegistry.counter("outbox.processed.success", "type", event.getEventType()).increment();
            } catch (Exception e) {
                log.error("Failed to process OutboxEvent: {}", event.getId(), e);
                event.setRetryCount(event.getRetryCount() + 1);
                event.setErrorMessage(e.getMessage());
                event.setLastFailureReason(e.getMessage());
                event.setExceptionClass(e.getClass().getName());
                
                java.io.StringWriter sw = new java.io.StringWriter();
                java.io.PrintWriter pw = new java.io.PrintWriter(sw);
                e.printStackTrace(pw);
                String stackTrace = sw.toString();
                stackTrace = stackTrace.replaceAll("(?i)(password|secret|token|key)=\\\\S+", "$1=********");
                event.setStackTraceSummary(stackTrace.substring(0, Math.min(stackTrace.length(), 1000)));
                
                meterRegistry.counter("outbox.processed.retry", "type", event.getEventType()).increment();
                
                if (event.getRetryCount() >= MAX_RETRIES || 
                    e instanceof IllegalArgumentException || 
                    e instanceof com.fasterxml.jackson.core.JsonProcessingException) {
                    event.setStatus("DLQ");
                    event.setDeadLetterTimestamp(now);
                    log.error("OutboxEvent {} moved to Dead Letter Queue (DLQ). Permanent failure.", event.getId());
                    meterRegistry.counter("outbox.processed.dlq", "type", event.getEventType()).increment();
                } else {
                    event.setStatus("FAILED");
                    long backoffSeconds = (long) Math.pow(2, event.getRetryCount()) * 5;
                    event.setNextRetryTime(now.plusSeconds(backoffSeconds));
                    meterRegistry.counter("outbox.processed.failed", "type", event.getEventType()).increment();
                }
            }
            outboxEventRepository.save(event);
        }
    }
}
