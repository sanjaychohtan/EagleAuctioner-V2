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
@Table(name = "bank_accounts")
@SQLDelete(sql = "UPDATE bank_accounts SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND version = ?")
@SQLRestriction("deleted_at IS NULL")
@Audited
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BankAccount extends BaseEntity {

    public enum BankAccountType {
        SAVINGS, CURRENT
    }

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bidder_profile_id", nullable = false)
    private BidderProfile bidderProfile;

    @Column(name = "account_holder_name", nullable = false, length = 150)
    private String accountHolderName;

    @Convert(converter = BankAccountEncryptionConverter.class)
    @Column(name = "encrypted_account_number", nullable = false, length = 255)
    private String accountNumber;

    @Column(name = "account_hash", nullable = false, length = 64)
    private String accountHash;

    @Pattern(regexp = "^[A-Z]{4}0[A-Z0-9]{6}$", message = "Invalid IFSC code")
    @Column(name = "ifsc_code", nullable = false, length = 11)
    private String ifscCode;

    @Column(name = "bank_name", nullable = false, length = 150)
    private String bankName;

    @Column(name = "branch_name", nullable = false, length = 150)
    private String branchName;

    @Enumerated(EnumType.STRING)
    @Column(name = "verification_status", nullable = false, length = 50)
    private VerificationStatus verificationStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "bank_account_type", nullable = false, length = 50)
    private BankAccountType bankAccountType;

    @Column(name = "is_primary", nullable = false)
    private boolean isPrimary;

    @Column(name = "verified_at")
    private Instant verifiedAt;

    @Column(name = "verification_provider", length = 100)
    private String verificationProvider;

    @Column(name = "penny_drop_status", length = 50)
    private String pennyDropStatus;

    @Column(name = "penny_drop_reference", length = 100)
    private String pennyDropReference;

    @Column(name = "is_verified", nullable = false)
    private boolean isVerified;

    @Column(name = "penny_drop_transaction_id", length = 100)
    private String pennyDropTransactionId;

    /**
     * JPA Attribute Converter for encrypting bank account numbers using KMS.
     */
    @Converter
    @org.springframework.stereotype.Component
    public static class BankAccountEncryptionConverter implements AttributeConverter<String, String> {

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
