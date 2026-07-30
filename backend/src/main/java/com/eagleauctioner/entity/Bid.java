package com.eagleauctioner.entity;

import com.eagleauctioner.enums.BidStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import jakarta.validation.constraints.Min;
import lombok.*;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.time.Instant;

@Entity
@Table(name = "bids")
@SQLDelete(sql = "UPDATE bids SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND version = ?")
@SQLRestriction("deleted_at IS NULL")

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Bid extends BaseEntity {

    @NotNull(message = "Auction lot is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "auction_lot_id", nullable = false)
    private AuctionLot auctionLot;

    @NotNull(message = "Bidder profile is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bidder_id", nullable = false)
    private BidderProfile bidderProfile;

    @NotNull(message = "Bid amount is required")
    @Min(value = 1, message = "Bid amount must be greater than 0")
    @Column(name = "bid_amount", nullable = false)
    private Long bidAmount;

    @NotNull(message = "Bid time is required")
    @Column(name = "bid_time", nullable = false)
    private Instant bidTime;

    @NotNull(message = "Bid status is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "bid_status", nullable = false, length = 50)
    private BidStatus bidStatus;

    @Size(max = 50)
    @Column(name = "anonymous_bidder_code", length = 50)
    private String anonymousBidderCode;

    @Size(max = 45)
    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Size(max = 255)
    @Column(name = "user_agent", length = 255)
    private String userAgent;

    @Column(name = "is_auto_bid", nullable = false)
    @Builder.Default
    private Boolean isAutoBid = false;

    @Column(name = "auto_bid_limit")
    private Long autoBidLimit;

}
