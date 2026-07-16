package com.eagleauctioner.entity;

import com.eagleauctioner.enums.LedgerAccountType;
import com.eagleauctioner.enums.LedgerEntryType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.envers.Audited;

import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;


@Entity
@Table(name = "ledger_entries")
@SQLDelete(sql = "UPDATE ledger_entries SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND version = ?")
@SQLRestriction("deleted_at IS NULL")
@Audited
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LedgerEntry extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ledger_transaction_id", nullable = false)
    private LedgerTransaction transaction;

    @Enumerated(EnumType.STRING)
    @Column(name = "account_type", nullable = false)
    private LedgerAccountType accountType;

    @Enumerated(EnumType.STRING)
    @Column(name = "entry_type", nullable = false)
    private LedgerEntryType entryType;

    @Column(name = "amount", nullable = false)
    private Long amount;

    @Column(name = "currency", nullable = false, length = 10)
    private String currency;

    public LedgerTransaction getTransaction() {
        return transaction;
    }

    public void setTransaction(LedgerTransaction transaction) {
        this.transaction = transaction;
    }

    public LedgerAccountType getAccountType() {
        return accountType;
    }

    public void setAccountType(LedgerAccountType accountType) {
        this.accountType = accountType;
    }

    public LedgerEntryType getEntryType() {
        return entryType;
    }

    public void setEntryType(LedgerEntryType entryType) {
        this.entryType = entryType;
    }

    public Long getAmount() {
        return amount;
    }

    public void setAmount(Long amount) {
        this.amount = amount;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }
}
