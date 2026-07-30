package com.eagleauctioner.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.*;
import org.hibernate.annotations.BatchSize;
import com.eagleauctioner.enums.PaymentStatus;
import com.eagleauctioner.enums.PaymentMethod;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * High-level entity representing an individual payment entry.
 */
@Entity
@Table(name = "payments", indexes = {
    @Index(name = "idx_payments_num", columnList = "payment_number", unique = true),
    @Index(name = "idx_payments_reference_number", columnList = "reference_number", unique = true),
    @Index(name = "idx_payments_status", columnList = "status"),
    @Index(name = "idx_payments_settlement", columnList = "settlement_id")
})
@SQLDelete(sql = "UPDATE payments SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND version = ?")
@SQLRestriction("deleted_at IS NULL")

@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Payment extends BaseEntity {

    @NotBlank
    @Size(max = 100)
    @Column(name = "payment_number", nullable = false, unique = true, length = 100)
    private String paymentNumber;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "settlement_id", nullable = false)
    private Settlement settlement;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50)
    private PaymentStatus status;

    @NotNull
    @PositiveOrZero
    @Column(name = "total_amount", nullable = false)
    private Long totalAmount;

    public Long getAmount() {
        return totalAmount;
    }

    @Size(max = 255)
    @Column(name = "reference_number", unique = true, length = 255)
    private String referenceNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", length = 100)
    private PaymentMethod paymentMethod;

    @Column(name = "payment_date")
    private Instant paymentDate;

    @Builder.Default
    @OneToMany(mappedBy = "payment", cascade = CascadeType.ALL, orphanRemoval = true)
    @BatchSize(size = 20)
    @OrderBy("allocatedAt ASC")
    private List<PaymentAllocation> allocations = new ArrayList<>();

    @Builder.Default
    @OneToMany(mappedBy = "payment", cascade = CascadeType.ALL, orphanRemoval = true)
    @BatchSize(size = 20)
    @OrderBy("completedAt DESC")
    private List<PaymentTransaction> transactions = new ArrayList<>();

    public void addAllocation(PaymentAllocation allocation) {
        allocations.add(allocation);
        allocation.setPayment(this);
    }

    public void addTransaction(PaymentTransaction transaction) {
        transactions.add(transaction);
        transaction.setPayment(this);
    }
}
