package com.eagleauctioner.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.envers.Audited;

/**
 * Entity for system feature toggles.
 */
@Entity
@Table(name = "feature_flags")
@Audited
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FeatureFlag extends BaseEntity {

    @Column(name = "flag_key", nullable = false, unique = true, length = 100)
    private String flagKey;

    @Column(name = "description", length = 500)
    private String description;

    @Column(name = "is_enabled", nullable = false)
    @Builder.Default
    private boolean isEnabled = false;
}
