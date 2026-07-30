package com.eagleauctioner.entity;

import com.eagleauctioner.enums.SellerState;
import com.eagleauctioner.enums.SellerType;
import com.eagleauctioner.enums.VerificationStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.time.Instant;
import java.util.List;
import java.util.ArrayList;

@Entity
@Table(name = "seller_profiles")
@SQLDelete(sql = "UPDATE seller_profiles SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND version = ?")
@SQLRestriction("deleted_at IS NULL")

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SellerProfile extends BaseEntity {

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "state", nullable = false, length = 50)
    private SellerState state;

    @Enumerated(EnumType.STRING)
    @Column(name = "seller_type", nullable = false, length = 50)
    private SellerType sellerType;

    @jakarta.validation.constraints.Pattern(
        regexp = "^[A-Z]{5}[0-9]{4}[A-Z]{1}$",
        message = "Invalid PAN format"
    )
    @Convert(converter = PanEncryptionConverter.class)
    @Column(name = "encrypted_pan", length = 255)
    private String panNumber;

    @Column(name = "pan_hash", length = 64)
    private String panHash;

    @Enumerated(EnumType.STRING)
    @Column(name = "pan_verification_status", nullable = false, length = 50)
    @Builder.Default
    private VerificationStatus panVerificationStatus = VerificationStatus.PENDING;

    @Column(name = "pan_verified_at")
    private Instant panVerifiedAt;

    @OneToOne(mappedBy = "sellerProfile", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    private SellerCompany company;

    @OneToMany(mappedBy = "sellerProfile", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    @Builder.Default
    private List<SellerWarehouse> warehouses = new ArrayList<>();

    @OneToMany(mappedBy = "sellerProfile", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    @Builder.Default
    private List<SellerDocument> documents = new ArrayList<>();

    @OneToMany(mappedBy = "sellerProfile", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    @Builder.Default
    private List<SellerReview> reviews = new ArrayList<>();

    @OneToMany(mappedBy = "sellerProfile", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    @Builder.Default
    private List<SellerStateHistory> stateHistories = new ArrayList<>();

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(name = "suspension_reason", columnDefinition = "TEXT")
    private String suspensionReason;

    @Column(name = "blacklist_reason", columnDefinition = "TEXT")
    private String blacklistReason;

    @Column(name = "onboarded_at")
    private Instant onboardedAt;

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
