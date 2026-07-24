package com.eagleauctioner.entity;

import com.eagleauctioner.enums.BidderState;
import com.eagleauctioner.enums.BidderType;
import com.eagleauctioner.enums.VerificationStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.envers.Audited;
import org.hibernate.envers.RelationTargetAuditMode;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.time.Instant;
import java.util.List;
import java.util.ArrayList;

@Entity
@Table(name = "bidder_profiles")
@SQLDelete(sql = "UPDATE bidder_profiles SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND version = ?")
@SQLRestriction("deleted_at IS NULL")
@Audited
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BidderProfile extends BaseEntity {

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    @Audited(targetAuditMode = RelationTargetAuditMode.NOT_AUDITED)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "state", nullable = false, length = 50)
    private BidderState state;

    @Enumerated(EnumType.STRING)
    @Column(name = "bidder_type", nullable = false, length = 50)
    private BidderType bidderType;

    @Convert(converter = PanEncryptionConverter.class)
    @Column(name = "encrypted_pan", nullable = false, length = 255)
    private String panNumber;

    @Column(name = "pan_hash", nullable = false, length = 64)
    private String panHash;

    @Enumerated(EnumType.STRING)
    @Column(name = "pan_verification_status", nullable = false, length = 50)
    private VerificationStatus panVerificationStatus;

    @Column(name = "pan_verified_at")
    private Instant panVerifiedAt;

    // Aadhaar Compliance: NEVER store raw Aadhaar card numbers.
    // Only store masked Aadhaar (e.g., XXXX-XXXX-1234) and a secure cryptographic SHA-256 hash for deduplication.
    @Column(name = "masked_aadhaar", length = 20)
    private String maskedAadhaar;

    @Column(name = "aadhaar_hash", length = 64)
    private String aadhaarHash;

    @Enumerated(EnumType.STRING)
    @Column(name = "aadhaar_verification_status", nullable = false, length = 50)
    private VerificationStatus aadhaarVerificationStatus;

    @Column(name = "aadhaar_verified_at")
    private Instant aadhaarVerifiedAt;

    @OneToOne(mappedBy = "bidderProfile", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    private Organization organization;

    @OneToMany(mappedBy = "bidderProfile", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    @Builder.Default
    private List<BankAccount> bankAccounts = new ArrayList<>();

    @OneToMany(mappedBy = "bidderProfile", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    @Builder.Default
    private List<KycDocument> kycDocuments = new ArrayList<>();

    @OneToMany(mappedBy = "bidderProfile", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    @Builder.Default
    private List<KycReview> kycReviews = new ArrayList<>();

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    /**
     * JPA Attribute Converter for encrypting PAN numbers before saving to the database
     * and decrypting them on retrieval. Uses standard AES-256 GCM encryption.
     */
    @Converter
    @org.springframework.stereotype.Component
    public static class PanEncryptionConverter implements AttributeConverter<String, String> {

        @org.springframework.beans.factory.annotation.Autowired
        private com.eagleauctioner.service.KmsEncryptionService service;

        @Override
        public String convertToDatabaseColumn(String attribute) {
            if (attribute == null) return null;
            if (service != null) {
                return service.encrypt(attribute);
            }
            throw new IllegalStateException("KMS Encryption Service is unavailable. Fixed-key fallback is forbidden.");
        }

        @Override
        public String convertToEntityAttribute(String dbData) {
            if (dbData == null) return null;
            if (service != null) {
                return service.decrypt(dbData);
            }
            throw new IllegalStateException("KMS Decryption Service is unavailable. Fixed-key fallback is forbidden.");
        }
    }
}
