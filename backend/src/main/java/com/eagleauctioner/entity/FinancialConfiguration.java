package com.eagleauctioner.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Enterprise JPA entity representing dynamic financial, tax, and regulatory configuration rules.
 */
@Entity
@Table(name = "financial_configurations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FinancialConfiguration {

    @Id
    @Column(name = "config_key", length = 100)
    private String configKey;

    @Column(name = "config_value", nullable = false, length = 255)
    private String configValue;

    @Column(name = "description", length = 500)
    private String description;

    @Column(name = "tolerance_value", precision = 19, scale = 2)
    private Long toleranceValue;

    @Column(name = "effective_from")
    private LocalDateTime effectiveFrom;

    @Column(name = "effective_to")
    private LocalDateTime effectiveTo;

    @Version
    @Column(name = "version", nullable = false)
    @Builder.Default
    private Long version = 0L;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
