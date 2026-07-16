package com.eagleauctioner.entity;

import com.eagleauctioner.enums.VerificationStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.Pattern;
import lombok.*;
import org.hibernate.envers.Audited;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.time.Instant;

@Entity
@Table(name = "seller_companies")
@SQLDelete(sql = "UPDATE seller_companies SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND version = ?")
@SQLRestriction("deleted_at IS NULL")
@Audited
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SellerCompany extends BaseEntity {

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seller_profile_id", nullable = false, unique = true)
    private SellerProfile sellerProfile;

    @Column(name = "company_name", nullable = false)
    private String companyName;

    @Column(name = "registration_number", nullable = false, length = 100)
    private String registrationNumber;

    @Pattern(
        regexp = "^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$",
        message = "Invalid GSTIN format. It must be a valid 15-digit Indian GSTIN."
    )
    @Column(name = "gstin", length = 15)
    private String gstin;

    @Enumerated(EnumType.STRING)
    @Column(name = "gst_verification_status", nullable = false, length = 50)
    @Builder.Default
    private VerificationStatus gstVerificationStatus = VerificationStatus.PENDING;

    @Column(name = "gst_verified_at")
    private Instant gstVerifiedAt;

    @Column(name = "registered_address", columnDefinition = "TEXT", nullable = false)
    private String registeredAddress;
}
