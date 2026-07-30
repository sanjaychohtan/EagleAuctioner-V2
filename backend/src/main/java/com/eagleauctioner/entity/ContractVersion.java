package com.eagleauctioner.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import com.eagleauctioner.enums.ContractStatus;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

/**
 * Immutable snapshot of a Contract version for change auditing.
 */
@Entity
@Table(name = "contract_versions", indexes = {
    @Index(name = "idx_contract_version_contract", columnList = "contract_id"),
    @Index(name = "idx_contract_version_created_at", columnList = "created_at")
})
@SQLDelete(sql = "UPDATE contract_versions SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND version = ?")
@SQLRestriction("deleted_at IS NULL")

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class ContractVersion extends BaseEntity {

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contract_id", nullable = false)
    @Setter(AccessLevel.PROTECTED) // Allowed only for relationship mapping
    private Contract contract;

    @NotNull
    @Column(name = "version_number", nullable = false, updatable = false)
    private Integer versionNumber;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50, updatable = false)
    private ContractStatus status;

    @NotNull
    @PositiveOrZero
    @Column(name = "total_amount", nullable = false, updatable = false)
    private Long totalAmount;

    @Size(max = 2000)
    @Column(name = "terms_and_conditions", length = 2000, updatable = false)
    private String termsAndConditions;

    @NotBlank
    @Size(max = 255)
    @Column(name = "changed_by", nullable = false, length = 255, updatable = false)
    private String changedBy;

    @Size(max = 1000)
    @Column(name = "change_reason", length = 1000, updatable = false)
    private String changeReason;
}
