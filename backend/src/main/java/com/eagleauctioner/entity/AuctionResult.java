package com.eagleauctioner.entity;

import com.eagleauctioner.entity.BaseEntity;
import com.eagleauctioner.entity.AuctionLot;
import com.eagleauctioner.entity.AuctionWinner;
import com.eagleauctioner.enums.AuctionResultStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import org.hibernate.envers.Audited;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;


/**
 * Entity tracking the final post-auction evaluation outcome of a lot.
 */
@Entity
@Table(name = "auction_results")
@SQLDelete(sql = "UPDATE auction_results SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND version = ?")
@SQLRestriction("deleted_at IS NULL")
@Audited
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuctionResult extends BaseEntity {

    @NotNull(message = "Auction lot is required")
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "auction_lot_id", nullable = false, unique = true)
    private AuctionLot auctionLot;

    @NotNull(message = "Auction result status is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50)
    private AuctionResultStatus status;

    @Column(name = "highest_bid_amount")
    private Long highestBidAmount;

    @Column(name = "reserve_price")
    private Long reservePrice;

    @NotNull(message = "Reserve met status is required")
    @Column(name = "reserve_met", nullable = false)
    @Builder.Default
    private Boolean reserveMet = false;

    @OneToOne(fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    @JoinColumn(name = "winner_id")
    private AuctionWinner winner;
}
