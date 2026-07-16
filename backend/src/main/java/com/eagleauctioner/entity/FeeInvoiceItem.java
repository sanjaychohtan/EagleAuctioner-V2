package com.eagleauctioner.entity;

import jakarta.persistence.*;
import lombok.*;


@Entity
@Table(name = "fee_invoice_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FeeInvoiceItem extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fee_invoice_id", nullable = false)
    private FeeInvoice feeInvoice;

    @Column(name = "description", nullable = false, length = 500)
    private String description;

    @Column(name = "amount", nullable = false)
    private Long amount;
}
