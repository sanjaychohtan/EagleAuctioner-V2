package com.eagleauctioner.entity;

import com.eagleauctioner.enums.ReconciliationStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.envers.Audited;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "settlement_reconciliations")
@Audited
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SettlementReconciliation extends BaseEntity {

    @Column(name = "settlement_id", nullable = false)
    private UUID settlementId;

    @Column(name = "payment_id")
    private UUID paymentId;

    @Column(name = "ledger_batch_id")
    private UUID ledgerBatchId;

    @Column(name = "gst_invoice_id")
    private UUID gstInvoiceId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private ReconciliationStatus status;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "reconciled_at")
    private Instant reconciledAt;

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
