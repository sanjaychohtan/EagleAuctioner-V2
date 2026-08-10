package com.eagleauctioner.entity;

import com.eagleauctioner.enums.VerificationStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;
import java.time.Instant;

@Entity
@Table(name = "kyc_documents")
@SQLDelete(sql = "UPDATE kyc_documents SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND version = ?")
@SQLRestriction("deleted_at IS NULL")

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KycDocument extends BaseEntity {

    public enum DocumentType {
        PAN, AADHAAR_FRONT, AADHAAR_BACK, GST_CERTIFICATE, CIN_CERTIFICATE, PARTNERSHIP_DEED, BOARD_RESOLUTION, CANCELLED_CHEQUE, OTHER
    }

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bidder_profile_id", nullable = false)
    private BidderProfile bidderProfile;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id")
    private Organization organization;

    @Enumerated(EnumType.STRING)
    @Column(name = "document_type", nullable = false, length = 50)
    private DocumentType documentType;

    @Column(name = "storage_path", nullable = false, length = 512)
    private String storagePath;

    @Column(name = "document_hash", nullable = false, length = 64)
    private String documentHash;

    @Enumerated(EnumType.STRING)
    @Column(name = "verification_status", nullable = false, length = 50)
    private VerificationStatus verificationStatus;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(name = "mime_type", nullable = false, length = 100)
    private String mimeType;

    @Column(name = "file_size", nullable = false)
    private Long fileSize;

    @Column(name = "document_number", length = 100)
    private String documentNumber;

    @Column(name = "uploaded_at")
    private Instant uploadedAt;

    @Column(name = "verified_by")
    private java.util.UUID verifiedBy;

    @Column(name = "verified_at")
    private Instant verifiedAt;

    @Column(name = "action_required_reason", columnDefinition = "TEXT")
    private String actionRequiredReason;
}
