package com.eagleauctioner.entity;

import com.eagleauctioner.enums.LedgerTransactionStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.envers.Audited;

import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "ledger_transactions")
@SQLDelete(sql = "UPDATE ledger_transactions SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND version = ?")
@SQLRestriction("deleted_at IS NULL")
@Audited
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LedgerTransaction extends BaseEntity {

    @Column(name = "transaction_reference", nullable = false, unique = true)
    private String transactionReference;

    @Column(name = "description", nullable = false)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private LedgerTransactionStatus status;

    @Column(name = "settlement_id")
    private UUID settlementId;

    @Column(name = "payment_id")
    private UUID paymentId;

    @Column(name = "posted_at", nullable = false)
    @Builder.Default
    private Instant postedAt = Instant.now();

    @Column(name = "posted_by", nullable = false)
    private String postedBy;

    @OneToMany(mappedBy = "transaction", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<LedgerEntry> entries = new ArrayList<>();

    public void addEntry(LedgerEntry entry) {
        if (entries == null) {
            entries = new ArrayList<>();
        }
        entries.add(entry);
        entry.setTransaction(this);
    }
}
