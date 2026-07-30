package com.eagleauctioner.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.*;
import com.eagleauctioner.enums.TaxType;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

/**
 * Detailed calculations of various tax components applied to a Settlement.
 */
@Entity
@Table(name = "tax_breakups", indexes = {
    @Index(name = "idx_tax_breakup_settlement", columnList = "settlement_id"),
    @Index(name = "idx_tax_breakup_created", columnList = "created_at")
})
@SQLDelete(sql = "UPDATE tax_breakups SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND version = ?")
@SQLRestriction("deleted_at IS NULL")

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaxBreakup extends BaseEntity {

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "settlement_id", nullable = false)
    private Settlement settlement;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "tax_name", nullable = false, length = 100)
    private TaxType taxName;

    @NotNull
    @PositiveOrZero
    @Column(name = "tax_rate", nullable = false)
    private Long taxRate;

    @NotNull
    @PositiveOrZero
    @Column(name = "taxable_basis", nullable = false)
    private Long taxableBasis;

    @NotNull
    @PositiveOrZero
    @Column(name = "calculated_tax", nullable = false)
    private Long calculatedTax;
}
