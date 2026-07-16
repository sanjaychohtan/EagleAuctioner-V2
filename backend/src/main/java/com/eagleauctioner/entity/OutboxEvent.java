package com.eagleauctioner.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "outbox_events")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OutboxEvent {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "aggregate_id", nullable = false)
    private UUID aggregateId;

    @Column(name = "aggregate_type", nullable = false, length = 100)
    private String aggregateType;

    @Column(name = "event_type", nullable = false, length = 100)
    private String eventType;

    @Column(name = "payload", nullable = false, columnDefinition = "TEXT")
    private String payload;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "processed", nullable = false)
    private boolean processed;

    @Column(name = "status", nullable = false, length = 50)
    @Builder.Default
    private String status = "PENDING";

    @Column(name = "retry_count", nullable = false)
    @Builder.Default
    private int retryCount = 0;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "last_attempt_time")
    private Instant lastAttemptTime;

    @Column(name = "next_retry_time")
    private Instant nextRetryTime;

    @Column(name = "last_failure_reason", columnDefinition = "TEXT")
    private String lastFailureReason;

    @Column(name = "exception_class", length = 255)
    private String exceptionClass;

    @Column(name = "stack_trace_summary", columnDefinition = "TEXT")
    private String stackTraceSummary;

    @Column(name = "processing_node", length = 255)
    private String processingNode;

    @Column(name = "dead_letter_timestamp")
    private Instant deadLetterTimestamp;

    @Column(name = "processed_at")
    private Instant processedAt;

    @Column(name = "event_version", nullable = false, length = 50)
    @Builder.Default
    private String eventVersion = "1.0";

    @Column(name = "schema_version", nullable = false, length = 50)
    @Builder.Default
    private String schemaVersion = "1.0";

    @Column(name = "aggregate_version", nullable = false)
    @Builder.Default
    private Long aggregateVersion = 1L;

    @Column(name = "correlation_id", length = 100)
    private String correlationId;

    @Column(name = "trace_id", length = 100)
    private String traceId;

    @Column(name = "node_id", length = 100)
    private String nodeId;

    @PrePersist
    public void populateTracingFields() {
        com.eagleauctioner.context.AuditContext.getOptional().ifPresent(ctx -> {
            if (this.correlationId == null) {
                this.correlationId = ctx.getCorrelationId();
            }
            if (this.traceId == null) {
                this.traceId = ctx.getRequestId();
            }
        });
        if (this.correlationId == null) {
            this.correlationId = "CORR-" + java.util.UUID.randomUUID().toString().substring(0, 8);
        }
        if (this.traceId == null) {
            this.traceId = "TRACE-" + java.util.UUID.randomUUID().toString().substring(0, 8);
        }
        if (this.nodeId == null) {
            this.nodeId = System.getenv("HOSTNAME") != null ? System.getenv("HOSTNAME") : "localhost";
        }
    }

    @Version
    private Long version;
}
