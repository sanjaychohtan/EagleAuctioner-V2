package com.eagleauctioner.entity;

import com.eagleauctioner.enums.BidderState;
import com.eagleauctioner.enums.ReviewDecision;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.envers.Audited;
import org.hibernate.envers.RelationTargetAuditMode;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.time.Instant;

@Entity
@Table(name = "kyc_reviews")
@SQLDelete(sql = "UPDATE kyc_reviews SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND version = ?")
@SQLRestriction("deleted_at IS NULL")
@Audited
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KycReview extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bidder_profile_id", nullable = false)
    private BidderProfile bidderProfile;

    @Audited(targetAuditMode = RelationTargetAuditMode.NOT_AUDITED)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewer_user_id", nullable = false)
    private User reviewer;

    @Enumerated(EnumType.STRING)
    @Column(name = "previous_state", nullable = false, length = 50)
    private BidderState previousState;

    @Enumerated(EnumType.STRING)
    @Column(name = "new_state", nullable = false, length = 50)
    private BidderState newState;

    @Enumerated(EnumType.STRING)
    @Column(name = "decision", nullable = false, length = 50)
    private ReviewDecision decision;

    @Column(name = "review_notes", nullable = false, columnDefinition = "TEXT")
    private String reviewNotes;

    @Column(name = "rejection_code", length = 50)
    private String rejectionCode;

    @Column(name = "reviewer_ip", length = 45)
    private String reviewerIp;

    @Column(name = "review_duration_ms")
    private Long reviewDurationMs;

    @Column(name = "reviewed_at", nullable = false)
    private Instant reviewedAt;
}
