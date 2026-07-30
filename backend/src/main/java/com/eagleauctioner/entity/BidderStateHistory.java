package com.eagleauctioner.entity;

import com.eagleauctioner.enums.BidderState;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.time.Instant;

@Entity
@Table(name = "bidder_state_history")
@SQLDelete(sql = "UPDATE bidder_state_history SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND version = ?")
@SQLRestriction("deleted_at IS NULL")

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BidderStateHistory extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bidder_profile_id", nullable = false)
    private BidderProfile bidderProfile;

    @Enumerated(EnumType.STRING)
    @Column(name = "from_state", nullable = false, length = 50)
    private BidderState fromState;

    @Enumerated(EnumType.STRING)
    @Column(name = "to_state", nullable = false, length = 50)
    private BidderState toState;

    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "changed_by_user_id", nullable = false)
    private User changedBy;

    @Column(name = "transition_reason", columnDefinition = "TEXT")
    private String reason;

    @Column(name = "transitioned_at", nullable = false)
    private Instant transitionedAt;
}
