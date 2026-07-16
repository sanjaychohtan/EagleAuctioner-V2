package com.eagleauctioner.entity;

import com.eagleauctioner.entity.BaseEntity;
import com.eagleauctioner.entity.BidderProfile;
import com.eagleauctioner.entity.AuctionLot;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "bid_histories")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BidHistory extends BaseEntity {

    @NotNull(message = "Auction lot is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "auction_lot_id", nullable = false)
    private AuctionLot auctionLot;

    @Column(name = "old_highest_bid")
    private Long oldHighestBid;

    @NotNull(message = "New highest bid is required")
    @Column(name = "new_highest_bid", nullable = false)
    private Long newHighestBid;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "winner_before_id")
    private BidderProfile winnerBefore;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "winner_after_id")
    private BidderProfile winnerAfter;

    @NotNull(message = "Timestamp is required")
    @Column(name = "timestamp", nullable = false)
    private Instant timestamp;

    @NotBlank(message = "Event type is required")
    @Size(max = 100)
    @Column(name = "event_type", nullable = false, length = 100)
    private String eventType;
}
