package com.eagleauctioner.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SQLDelete; // GitHub Build Fix: Ensure SQLDelete is imported
import org.hibernate.annotations.SQLRestriction; // GitHub Build Fix: Ensure SQLRestriction is imported
import org.hibernate.envers.Audited;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "wallets")
@SQLDelete(sql = "UPDATE wallets SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND version = ?")
@SQLRestriction("deleted_at IS NULL")
@Audited
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Wallet extends BaseEntity {

    @Column(name = "user_id", nullable = false, unique = true)
    private UUID userId;

    @Column(name = "available_balance", nullable = false)
    private Long availableBalance;

    @Column(name = "locked_balance", nullable = false)
    private Long lockedBalance;

    @Column(name = "currency", nullable = false, length = 10)
    private String currency;

    @Column(name = "last_updated", nullable = false)
    @Builder.Default
    private Instant lastUpdated = Instant.now();

    @Column(name = "permanent_emd")
    @Builder.Default
    private Long permanentEmd = 0L;

    @Column(name = "refund_pending")
    @Builder.Default
    private Long refundPending = 0L;

    @Column(name = "settlement_pending")
    @Builder.Default
    private Long settlementPending = 0L;

    @PreUpdate
    protected void onUpdate() {
        this.lastUpdated = Instant.now();
    }
    
    public void credit(Long amount) {
        if (amount == null || amount < 0) {
            throw new IllegalArgumentException("Credit amount must be positive");
        }
        this.availableBalance = Math.addExact(this.availableBalance, amount);
    }
    
    public void debit(Long amount) {
        if (amount == null || amount < 0) {
            throw new IllegalArgumentException("Debit amount must be positive");
        }
        if (this.availableBalance < amount) {
            throw new IllegalStateException("Insufficient funds in wallet");
        }
        this.availableBalance = Math.subtractExact(this.availableBalance, amount);
    }
}
