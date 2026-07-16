package com.eagleauctioner.entity;

import com.eagleauctioner.enums.ClosingStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.envers.Audited;

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "closing_periods")
@Audited
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClosingPeriod extends BaseEntity {

    @Column(name = "period_name", nullable = false, length = 50)
    private String periodName;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;
    
    @Column(name = "period_year", nullable = false)
    private Integer periodYear;
    
    @Column(name = "period_month", nullable = false)
    private Integer periodMonth;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private ClosingStatus status;

    @Column(name = "closed_at")
    private java.time.Instant closedAt;
    
    @Column(name = "closed_by")
    private UUID closedBy;

    @Column(name = "created_by")
    private UUID createdBy;

    @Column(name = "approved_by")
    private UUID approvedBy;

    @Column(name = "approved_at")
    private java.time.Instant approvedAt;

    @Column(name = "reopened_by")
    private UUID reopenedBy;

    @Column(name = "reopened_at")
    private java.time.Instant reopenedAt;

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
}
