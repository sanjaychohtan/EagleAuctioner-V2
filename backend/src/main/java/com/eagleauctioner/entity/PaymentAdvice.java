package com.eagleauctioner.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import com.eagleauctioner.enums.PaymentAdviceStatus;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.time.Instant;

/**
 * Formal request issued to trigger payment after a Settlement is approved.
 */
@Entity
@Table(name = "payment_advices", indexes = {
    @Index(name = "idx_advice_number", columnList = "advice_number", unique = true),
    @Index(name = "idx_advice_settlement", columnList = "settlement_id", unique = true),
    @Index(name = "idx_advice_status", columnList = "status")
})
@SQLDelete(sql = "UPDATE payment_advices SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND version = ?")
@SQLRestriction("deleted_at IS NULL")

@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class PaymentAdvice extends BaseEntity {

    @NotBlank
    @Size(max = 100)
    @Column(name = "advice_number", nullable = false, unique = true, length = 100)
    private String adviceNumber;

    @NotNull
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "settlement_id", nullable = false)
    private Settlement settlement;

    @NotNull
    @PositiveOrZero
    @Column(name = "amount_due", nullable = false)
    private Long amountDue;

    @NotNull
    @Column(name = "due_date", nullable = false)
    private Instant dueDate;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50)
    private PaymentAdviceStatus status;
}
