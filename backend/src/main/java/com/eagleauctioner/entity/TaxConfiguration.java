package com.eagleauctioner.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import org.hibernate.envers.Audited;
import com.eagleauctioner.enums.TaxType;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;
import java.math.BigDecimal;

/**
 * Region-specific and rule-specific tax configurations for configuration-driven tax calculation.
 */
@Entity
@Table(name = "tax_configurations", indexes = {
    @Index(name = "idx_tax_config_region", columnList = "region_code, tax_name"),
    @Index(name = "idx_tax_config_is_active", columnList = "is_active")
})
@SQLDelete(sql = "UPDATE tax_configurations SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND version = ?")
@SQLRestriction("deleted_at IS NULL")
@Audited
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaxConfiguration extends BaseEntity {

    @NotBlank
    @Size(max = 50)
    @Column(name = "region_code", nullable = false, length = 50)
    private String regionCode;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "tax_name", nullable = false, length = 100)
    private TaxType taxName;

    @NotNull
    @PositiveOrZero
    @Column(name = "rate", nullable = false, precision = 5, scale = 2)
    private BigDecimal rate; // Percentage, e.g., 18.00%

    @NotNull
    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean isActive = true;
}
