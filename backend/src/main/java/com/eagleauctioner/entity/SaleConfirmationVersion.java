package com.eagleauctioner.entity;

import com.eagleauctioner.enums.SaleConfirmationStatus;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "sale_confirmation_versions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SaleConfirmationVersion extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sale_confirmation_id", nullable = false)
    private SaleConfirmation saleConfirmation;

    @Column(name = "version_number", nullable = false)
    private Integer versionNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50)
    private SaleConfirmationStatus status;

    @Column(name = "sale_amount", nullable = false)
    private Long saleAmount;

    @Column(name = "terms_and_conditions", length = 2000)
    private String termsAndConditions;

    @Column(name = "changed_by", nullable = false)
    private String changedBy;

    @Column(name = "change_reason", length = 1000)
    private String changeReason;
}
