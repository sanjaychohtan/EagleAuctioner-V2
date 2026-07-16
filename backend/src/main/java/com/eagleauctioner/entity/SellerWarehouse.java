package com.eagleauctioner.entity;

import com.eagleauctioner.enums.VerificationStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.envers.Audited;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.time.Instant;

@Entity
@Table(name = "seller_warehouses")
@SQLDelete(sql = "UPDATE seller_warehouses SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND version = ?")
@SQLRestriction("deleted_at IS NULL")
@Audited
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SellerWarehouse extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seller_profile_id", nullable = false)
    private SellerProfile sellerProfile;

    @Column(name = "warehouse_name", nullable = false, length = 150)
    private String warehouseName;

    @Column(name = "address", columnDefinition = "TEXT", nullable = false)
    private String address;

    @Column(name = "city", nullable = false, length = 100)
    private String city;

    @Column(name = "state", nullable = false, length = 100)
    private String state;

    @Column(name = "postal_code", nullable = false, length = 20)
    private String postalCode;

    @Column(name = "contact_person", nullable = false, length = 150)
    private String contactPerson;

    @jakarta.validation.constraints.Pattern(
        regexp = "^[0-9]{10,15}$",
        message = "Invalid contact number"
    )
    @Column(name = "contact_number", nullable = false, length = 20)
    private String contactNumber;

    @Column(name = "is_primary", nullable = false)
    private boolean isPrimary;

    @Enumerated(EnumType.STRING)
    @Column(name = "verification_status", nullable = false, length = 50)
    @Builder.Default
    private VerificationStatus verificationStatus = VerificationStatus.PENDING;

    @Column(name = "verified_at")
    private Instant verifiedAt;
}
