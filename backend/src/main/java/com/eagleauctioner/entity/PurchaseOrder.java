package com.eagleauctioner.entity;

import com.eagleauctioner.enums.PurchaseOrderStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.BatchSize;

import java.util.ArrayList;
import java.util.List;

/**
 * Commercial Purchase Order document generated once a Sale Confirmation has been accepted.
 */
@Entity
@Table(name = "purchase_orders", indexes = {
    @Index(name = "idx_po_document_number", columnList = "document_number", unique = true),
    @Index(name = "idx_po_sc", columnList = "sale_confirmation_id"),
    @Index(name = "idx_po_status", columnList = "status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PurchaseOrder extends BaseEntity {

    @Column(name = "document_number", nullable = false, unique = true, length = 100)
    private String documentNumber;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sale_confirmation_id", nullable = false)
    private SaleConfirmation saleConfirmation;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50)
    private PurchaseOrderStatus status;

    @Column(name = "total_amount", nullable = false)
    private Long totalAmount;

    @Builder.Default
    @OneToMany(mappedBy = "purchaseOrder", cascade = CascadeType.ALL, orphanRemoval = true)
    @BatchSize(size = 20)
    private List<PurchaseOrderItem> items = new ArrayList<>();

    public void addItem(PurchaseOrderItem item) {
        items.add(item);
        item.setPurchaseOrder(this);
    }
}
