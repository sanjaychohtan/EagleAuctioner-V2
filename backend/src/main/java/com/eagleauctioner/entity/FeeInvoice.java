package com.eagleauctioner.entity;

import com.eagleauctioner.enums.InvoiceStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.BatchSize;

import java.util.ArrayList;
import java.util.List;

/**
 * Invoice issued for the platform fee based on the Purchase Order total.
 */
@Entity
@Table(name = "fee_invoices", indexes = {
    @Index(name = "idx_fi_document_number", columnList = "document_number", unique = true),
    @Index(name = "idx_fi_po", columnList = "purchase_order_id"),
    @Index(name = "idx_fi_status", columnList = "status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FeeInvoice extends BaseEntity {

    @Column(name = "document_number", nullable = false, unique = true, length = 100)
    private String documentNumber;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "purchase_order_id", nullable = false)
    private PurchaseOrder purchaseOrder;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50)
    private InvoiceStatus status;

    @Column(name = "subtotal", nullable = false)
    private Long subtotal;

    @Column(name = "tax_amount", nullable = false)
    private Long taxAmount;

    @Column(name = "total_amount", nullable = false)
    private Long totalAmount;

    @Builder.Default
    @OneToMany(mappedBy = "feeInvoice", cascade = CascadeType.ALL, orphanRemoval = true)
    @BatchSize(size = 20)
    private List<FeeInvoiceItem> items = new ArrayList<>();

    public void addItem(FeeInvoiceItem item) {
        items.add(item);
        item.setFeeInvoice(this);
    }
}
