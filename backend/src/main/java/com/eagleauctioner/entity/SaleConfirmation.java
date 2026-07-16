package com.eagleauctioner.entity;

import com.eagleauctioner.enums.SaleConfirmationStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.BatchSize;

import java.util.ArrayList;
import java.util.List;

/**
 * Commercial Sale Confirmation generated when a lot winner is approved.
 * This is the legal draft contract binding the seller and the buyer.
 */
@Entity
@Table(name = "sale_confirmations", indexes = {
    @Index(name = "idx_sc_document_number", columnList = "document_number", unique = true),
    @Index(name = "idx_sc_winner", columnList = "winner_id"),
    @Index(name = "idx_sc_status", columnList = "status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SaleConfirmation extends BaseEntity {

    @Column(name = "document_number", nullable = false, unique = true, length = 100)
    private String documentNumber;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "winner_id", nullable = false)
    private AuctionWinner winner;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50)
    private SaleConfirmationStatus status;

    @Column(name = "sale_amount", nullable = false)
    private Long saleAmount;

    @Column(name = "terms_and_conditions", length = 2000)
    private String termsAndConditions;

    @Builder.Default
    @OneToMany(mappedBy = "saleConfirmation", cascade = CascadeType.ALL, orphanRemoval = true)
    @BatchSize(size = 20)
    private List<SaleConfirmationVersion> versions = new ArrayList<>();

    public void addVersion(SaleConfirmationVersion version) {
        versions.add(version);
        version.setSaleConfirmation(this);
    }
}
