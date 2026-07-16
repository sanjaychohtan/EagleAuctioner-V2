package com.eagleauctioner.entity;

import com.eagleauctioner.entity.BaseEntity;
import com.eagleauctioner.entity.AuctionWinner;
import com.eagleauctioner.enums.WinnerStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import org.hibernate.annotations.Immutable;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.time.Instant;
import java.util.UUID;

/**
 * Immutable audit table for tracking winner lifecycle changes and manual overrides.
 * Hardened with full security actor context and trace IDs.
 */
@Entity
@Table(name = "winner_histories")
@SQLDelete(sql = "UPDATE winner_histories SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND version = ?")
@SQLRestriction("deleted_at IS NULL")
@Immutable
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class WinnerHistory extends BaseEntity {

    @NotNull(message = "Auction winner is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "winner_id", nullable = false, updatable = false)
    private AuctionWinner winner;

    @Enumerated(EnumType.STRING)
    @Column(name = "previous_status", length = 50, updatable = false)
    private WinnerStatus previousStatus;

    @NotNull(message = "New status is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "new_status", nullable = false, length = 50, updatable = false)
    private WinnerStatus newStatus;

    @NotBlank(message = "Action executor is required")
    @Size(max = 100)
    @Column(name = "action_by", nullable = false, length = 100, updatable = false)
    private String actionBy;

    @NotNull(message = "Action timestamp is required")
    @Column(name = "action_at", nullable = false, updatable = false)
    private Instant actionAt;

    @Size(max = 1000)
    @Column(name = "remarks", length = 1000, updatable = false)
    private String remarks;

    // --- HARDENED AUDIT & SECURITY FIELDS (String-5.1.1) ---

    @Column(name = "actor_id", updatable = false)
    private UUID actorId;

    @Size(max = 50)
    @Column(name = "actor_type", length = 50, updatable = false)
    private String actorType;

    @Size(max = 255)
    @Column(name = "reason", length = 255, updatable = false)
    private String reason;

    @Size(max = 1000)
    @Column(name = "comments", length = 1000, updatable = false)
    private String comments;

    @Size(max = 100)
    @Column(name = "correlation_id", length = 100, updatable = false)
    private String correlationId;

    @Size(max = 45)
    @Column(name = "ip_address", length = 45, updatable = false)
    private String ipAddress;

    @Size(max = 500)
    @Column(name = "user_agent", length = 500, updatable = false)
    private String userAgent;

    @NotNull(message = "Action timestamp is required")
    @Column(name = "action_timestamp", nullable = false, updatable = false)
    private Instant actionTimestamp;
}
