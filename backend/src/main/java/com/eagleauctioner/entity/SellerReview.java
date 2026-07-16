package com.eagleauctioner.entity;

import com.eagleauctioner.enums.SellerState;
import com.eagleauctioner.enums.ReviewDecision;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.envers.Audited;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.time.Instant;

@Entity
@Table(name = "seller_reviews")
@SQLDelete(sql = "UPDATE seller_reviews SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND version = ?")
@SQLRestriction("deleted_at IS NULL")
@Audited
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SellerReview extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seller_profile_id", nullable = false)
    private SellerProfile sellerProfile;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewer_user_id", nullable = false)
    private User reviewer;

    @Enumerated(EnumType.STRING)
    @Column(name = "previous_state", nullable = false, length = 50)
    private SellerState previousState;

    @Enumerated(EnumType.STRING)
    @Column(name = "new_state", nullable = false, length = 50)
    private SellerState newState;

    @Enumerated(EnumType.STRING)
    @Column(name = "decision", nullable = false, length = 50)
    private ReviewDecision decision;

    @Column(name = "review_notes", columnDefinition = "TEXT", nullable = false)
    private String reviewNotes;

    @Column(name = "reviewed_at", nullable = false)
    @Builder.Default
    private Instant reviewedAt = Instant.now();
}
