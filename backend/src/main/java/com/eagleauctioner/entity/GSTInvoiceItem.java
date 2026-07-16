package com.eagleauctioner.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.envers.Audited;

import java.math.BigDecimal;

@Entity
@Table(name = "gst_invoice_items")
@Audited
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GSTInvoiceItem extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invoice_id", nullable = false, updatable = false)
    private GSTInvoice invoice;

    @Column(name = "description", nullable = false, updatable = false, length = 255)
    private String description;

    @Column(name = "hsn_sac_code", length = 20, updatable = false)
    private String hsnSacCode;

    @Column(name = "amount", nullable = false, updatable = false, precision = 19, scale = 2)
    private Long amount;

    @Column(name = "tax_rate", nullable = false, updatable = false, precision = 5, scale = 2)
    private BigDecimal taxRate;

    @Column(name = "tax_amount", nullable = false, updatable = false, precision = 19, scale = 2)
    private Long taxAmount;

    @Column(name = "total_amount", nullable = false, updatable = false, precision = 19, scale = 2)
    private Long totalAmount;
}
