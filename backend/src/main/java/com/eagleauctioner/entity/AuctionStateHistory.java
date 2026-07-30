package com.eagleauctioner.entity;

import com.eagleauctioner.enums.AuctionState;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.time.Instant;
import java.util.UUID;

/**
 * Audit entity tracking the history of state changes for an auction.
 */
@Entity
@Table(name = "auction_state_history")
@SQLDelete(sql = "UPDATE auction_state_history SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND version = ?")
@SQLRestriction("deleted_at IS NULL")

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuctionStateHistory extends BaseEntity {

    @NotNull(message = "Auction ID is required")
    @Column(name = "auction_id", nullable = false)
    private UUID auctionId;

    @NotNull(message = "From state is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "from_state", nullable = false, length = 50)
    private AuctionState fromState;

    @NotNull(message = "To state is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "to_state", nullable = false, length = 50)
    private AuctionState toState;

    @Column(name = "reason", length = 1000)
    private String reason;

    @Column(name = "changed_by")
    private String changedBy;

    @NotNull(message = "Timestamp is required")
    @Column(name = "timestamp", nullable = false)
    private Instant timestamp;
}
