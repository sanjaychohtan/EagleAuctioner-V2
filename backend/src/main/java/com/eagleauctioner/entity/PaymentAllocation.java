package com.eagleauctioner.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.*;
import com.eagleauctioner.enums.PaymentAllocationType;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.time.Instant;

/**
 * Tracks the distribution allocation of payments into multiple coordinates (such as Principal, Platform fee, Taxes).
 */
@Entity
@Table(name = "payment_allocations", indexes = {
    @Index(name = "idx_payment_alloc_payment", columnList = "payment_id"),
    @Index(name = "idx_payment_alloc_settlement", columnList = "settlement_id")
})
@SQLDelete(sql = "UPDATE payment_allocations SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND version = ?")
@SQLRestriction("deleted_at IS NULL")

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class PaymentAllocation extends BaseEntity {

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payment_id", nullable = false)
    private Payment payment;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "settlement_id", nullable = false)
    @Setter(AccessLevel.PROTECTED)
    private Settlement settlement;

    @NotNull
    @PositiveOrZero
    @Column(name = "allocated_amount", nullable = false, updatable = false)
    private Long allocatedAmount;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "allocation_type", nullable = false, length = 100, updatable = false)
    private PaymentAllocationType allocationType;

    @NotNull
    @Column(name = "allocated_at", nullable = false, updatable = false)
    private Instant allocatedAt;
    
    // Package-private setter for Payment entity to use
    void setPayment(Payment payment) {
        this.payment = payment;
    }
}
