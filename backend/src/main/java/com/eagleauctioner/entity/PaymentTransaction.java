package com.eagleauctioner.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.*;
import org.hibernate.envers.Audited;
import com.eagleauctioner.enums.PaymentTransactionStatus;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.time.Instant;

/**
 * Gateway transaction attempts tracker for billing logs and security compliance.
 */
@Entity
@Table(name = "payment_transactions", indexes = {
    @Index(name = "idx_pay_tx_payment", columnList = "payment_id"),
    @Index(name = "idx_pay_tx_reference", columnList = "gateway_reference")
})
@SQLDelete(sql = "UPDATE payment_transactions SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND version = ?")
@SQLRestriction("deleted_at IS NULL")
@Audited
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class PaymentTransaction extends BaseEntity {

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payment_id", nullable = false)
    private Payment payment;

    @Size(max = 255)
    @Column(name = "gateway_reference", length = 255)
    private String gatewayReference;

    @NotNull
    @PositiveOrZero
    @Column(name = "amount", nullable = false, updatable = false)
    private Long amount;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50)
    private PaymentTransactionStatus status;

    @Size(max = 1000)
    @Column(name = "error_message", length = 1000)
    private String errorMessage;

    @Column(name = "completed_at")
    private Instant completedAt;

    /**
     * Restrict mutation only to legitimate gateway lifecycle fields.
     */
    public void updateGatewayResponse(PaymentTransactionStatus newStatus, String newGatewayReference, String newErrorMessage, Instant newCompletedAt) {
        if (this.status != PaymentTransactionStatus.PENDING) {
            throw new IllegalStateException("Cannot update a completed payment transaction");
        }
        this.status = newStatus;
        this.gatewayReference = newGatewayReference;
        this.errorMessage = newErrorMessage;
        this.completedAt = newCompletedAt;
    }
    
    // Package-private setter for Payment entity to use
    void setPayment(Payment payment) {
        this.payment = payment;
    }
}
