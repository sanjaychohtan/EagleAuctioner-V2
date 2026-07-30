package com.eagleauctioner.entity;

import com.eagleauctioner.enums.SettlementStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.*;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.time.Instant;
import java.util.UUID;

/**
 * Settlement Core entity representing financial and physical closure of a Contract.
 */
@Entity
@Table(name = "settlements", indexes = {
    @Index(name = "idx_settlements_contract", columnList = "contract_id", unique = true),
    @Index(name = "idx_settlements_status", columnList = "status"),
    @Index(name = "idx_settlements_winner", columnList = "winner_id")
})
@SQLDelete(sql = "UPDATE settlements SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND version = ?")
@SQLRestriction("deleted_at IS NULL")

@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Settlement extends BaseEntity {

    @NotNull
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contract_id", nullable = false, unique = true)
    private Contract contract;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50)
    private SettlementStatus status;

    @NotBlank
    @Size(max = 100)
    @Column(name = "contract_number", nullable = false, length = 100)
    private String contractNumber;

    @NotNull
    @Column(name = "winner_id", nullable = false)
    private UUID winnerId;

    @NotBlank
    @Column(name = "buyer_snapshot", nullable = false, columnDefinition = "TEXT")
    private String buyerSnapshot;

    @NotBlank
    @Column(name = "seller_snapshot", nullable = false, columnDefinition = "TEXT")
    private String sellerSnapshot;

    @NotBlank
    @Column(name = "auction_snapshot", nullable = false, columnDefinition = "TEXT")
    private String auctionSnapshot;

    @NotBlank
    @Column(name = "lot_snapshot", nullable = false, columnDefinition = "TEXT")
    private String lotSnapshot;

    @NotNull
    @PositiveOrZero
    @Column(name = "winning_amount", nullable = false)
    private Long winningAmount;

    @NotNull
    @PositiveOrZero
    @Column(name = "platform_fee", nullable = false)
    private Long platformFee;

    @NotNull
    @PositiveOrZero
    @Column(name = "tax_amount", nullable = false)
    private Long taxAmount;

    @NotNull
    @PositiveOrZero
    @Column(name = "payout_amount", nullable = false)
    private Long payoutAmount;

    @NotBlank
    @Size(max = 10)
    @Column(name = "currency", nullable = false, length = 10)
    private String currency;

    @NotBlank
    @Column(name = "tax_snapshot", nullable = false, columnDefinition = "TEXT")
    private String taxSnapshot;

    @NotNull
    @Column(name = "generated_timestamp", nullable = false)
    private Instant generatedTimestamp;

    @Column(name = "completed_by", length = 255)
    private String completedBy;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "completion_remarks", columnDefinition = "TEXT")
    private String completionRemarks;

    @Column(name = "cancelled_by", length = 255)
    private String cancelledBy;

    @Column(name = "cancelled_at")
    private Instant cancelledAt;

    @Column(name = "cancellation_reason", columnDefinition = "TEXT")
    private String cancellationReason;

    public Long getGrossAmount() {
        return Math.addExact(this.winningAmount != null ? this.winningAmount : 0L, this.taxAmount != null ? this.taxAmount : 0L);
    }
}
