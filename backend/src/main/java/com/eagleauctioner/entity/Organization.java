package com.eagleauctioner.entity;

import com.eagleauctioner.enums.OrganizationType;
import com.eagleauctioner.enums.VerificationStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;
import java.time.Instant;
import java.util.List;
import java.util.ArrayList;

@Entity
@Table(name = "organizations")
@SQLDelete(sql = "UPDATE organizations SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND version = ?")
@SQLRestriction("deleted_at IS NULL")

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Organization extends BaseEntity {

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bidder_profile_id", nullable = false, unique = true)
    private BidderProfile bidderProfile;

    @Column(name = "organization_name", nullable = false, length = 255)
    private String organizationName;

    @Enumerated(EnumType.STRING)
    @Column(name = "organization_type", nullable = false, length = 50)
    private OrganizationType organizationType;

    @Column(name = "registration_number", nullable = false, length = 100)
    private String registrationNumber;

    @Column(name = "cin", length = 21)
    private String cin;

    // Partial Unique Index enforced in DB/Flyway: LOWER(gstin) unique where deleted_at IS NULL
    @Column(name = "gstin", length = 15)
    private String gstin;

    @Enumerated(EnumType.STRING)
    @Column(name = "gst_verification_status", nullable = false, length = 50)
    private VerificationStatus gstVerificationStatus;

    @Column(name = "gst_verified_at")
    private Instant gstVerifiedAt;

    @Column(name = "registration_authority", length = 150)
    private String registrationAuthority;

    @Column(name = "registered_address", nullable = false, columnDefinition = "TEXT")
    private String registeredAddress;

    @OneToMany(mappedBy = "organization", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    @Builder.Default
    private List<KycDocument> organizationDocuments = new ArrayList<>();
}
