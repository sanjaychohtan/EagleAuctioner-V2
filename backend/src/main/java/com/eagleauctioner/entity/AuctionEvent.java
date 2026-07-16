package com.eagleauctioner.entity;

import com.eagleauctioner.enums.AuctionEventType;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import org.hibernate.envers.Audited;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.time.Instant;
import java.util.UUID;

/**
 * Audit and messaging log representing every real-time auction action.
 */
@Entity
@Table(name = "auction_events")
@SQLDelete(sql = "UPDATE auction_events SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND version = ?")
@SQLRestriction("deleted_at IS NULL")
@Audited
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuctionEvent extends BaseEntity {

    @Column(name = "auction_id")
    private UUID auctionId;

    @Column(name = "lot_id")
    private UUID lotId;

    @NotNull(message = "Event type is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false, length = 50)
    private AuctionEventType eventType;

    @Column(name = "payload", columnDefinition = "TEXT")
    private String payload;

    @NotNull(message = "Timestamp is required")
    @Column(name = "timestamp", nullable = false)
    private Instant timestamp;

    @Column(name = "triggered_by")
    private String triggeredBy;
}
