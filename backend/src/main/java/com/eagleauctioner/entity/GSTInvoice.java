package com.eagleauctioner.entity;

import com.eagleauctioner.enums.GSTInvoiceStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.envers.Audited;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "gst_invoices")
@Audited
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GSTInvoice extends BaseEntity {

    @Column(name = "invoice_number", unique = true, nullable = false, updatable = false, length = 50)
    private String invoiceNumber;

    @Column(name = "settlement_id", nullable = false, updatable = false)
    private UUID settlementId;

    @Column(name = "seller_id", nullable = false, updatable = false)
    private UUID sellerId;
    
    @Column(name = "buyer_id", nullable = false, updatable = false)
    private UUID buyerId;

    @Column(name = "subtotal", nullable = false, updatable = false, precision = 19, scale = 2)
    private Long subtotal;

    @Column(name = "total_tax", nullable = false, updatable = false, precision = 19, scale = 2)
    private Long totalTax;

    @Column(name = "total_amount", nullable = false, updatable = false, precision = 19, scale = 2)
    private Long totalAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private GSTInvoiceStatus status;

    @Column(name = "pdf_url", length = 500)
    private String pdfUrl;

    @Column(name = "generated_at", nullable = false, updatable = false)
    private Instant generatedAt;

    @Column(name = "tax_version", nullable = false, updatable = false, length = 50)
    private String taxVersion;

    @Column(name = "effective_from", nullable = false, updatable = false)
    private Instant effectiveFrom;

    @Column(name = "effective_to", nullable = false, updatable = false)
    private Instant effectiveTo;

    @Column(name = "tax_configuration_id", nullable = false, updatable = false)
    private UUID taxConfigurationId;

    @OneToMany(mappedBy = "invoice", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<GSTInvoiceItem> items = new ArrayList<>();

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

    public void addItem(GSTInvoiceItem item) {
        items.add(item);
        item.setInvoice(this);
    }
}
