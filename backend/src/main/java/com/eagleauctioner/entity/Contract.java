package com.eagleauctioner.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import com.eagleauctioner.enums.ContractStatus;
import org.hibernate.annotations.BatchSize;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;
import java.util.ArrayList;
import java.util.List;

/**
 * Legal Contract generated when a lot winner is approved.
 * Fully indexed and optimized for performance.
 */
@Entity
@Table(name = "contracts", indexes = {
    @Index(name = "idx_contract_document_number", columnList = "document_number", unique = true),
    @Index(name = "idx_contract_winner", columnList = "winner_id"),
    @Index(name = "idx_contract_status", columnList = "status"),
    @Index(name = "idx_contract_created_at", columnList = "created_at")
})
@SQLDelete(sql = "UPDATE contracts SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND version = ?")
@SQLRestriction("deleted_at IS NULL")

@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Contract extends BaseEntity {

    @NotBlank
    @Size(max = 100)
    @Column(name = "document_number", nullable = false, unique = true, length = 100)
    private String documentNumber;

    @NotNull
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "winner_id", nullable = false)
    private AuctionWinner winner;

    
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sale_confirmation_id")
    private SaleConfirmation saleConfirmation;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50)
    private ContractStatus status;

    @NotNull
    @PositiveOrZero
    @Column(name = "total_amount", nullable = false)
    private Long totalAmount;

    @Size(max = 2000)
    @Column(name = "terms_and_conditions", length = 2000)
    private String termsAndConditions;

    @Builder.Default
    @OneToMany(mappedBy = "contract", cascade = CascadeType.ALL, orphanRemoval = true)
    @BatchSize(size = 20)
    @OrderBy("versionNumber DESC")
    private List<ContractVersion> versions = new ArrayList<>();

    public void addVersion(ContractVersion version) {
        versions.add(version);
        version.setContract(this);
    }
}
