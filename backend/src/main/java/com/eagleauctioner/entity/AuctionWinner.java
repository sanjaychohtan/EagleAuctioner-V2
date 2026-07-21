package com.eagleauctioner.entity;

import com.eagleauctioner.entity.BaseEntity;
import com.eagleauctioner.entity.AuctionLot;
import com.eagleauctioner.entity.BidderProfile;
import com.eagleauctioner.entity.Bid;
import com.eagleauctioner.enums.WinnerStatus;
import com.eagleauctioner.enums.WinnerSelectionType;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import org.hibernate.envers.Audited;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.time.Instant;

/**
 * Entity tracking the validated lot winners and manual overrides.
 * Hardened with immutable snapshots of buyer, seller, and financial metadata at evaluation time.
 */
@Entity
@Table(name = "auction_winners")
@SQLDelete(sql = "UPDATE auction_winners SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND version = ?")
@SQLRestriction("deleted_at IS NULL")
@Audited
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuctionWinner extends BaseEntity {

    @NotNull(message = "Auction lot is required")
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "auction_lot_id", nullable = false, unique = true)
    private AuctionLot auctionLot;

    @NotNull(message = "Winning bidder profile is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bidder_id", nullable = false)
    private BidderProfile bidderProfile;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bid_id")
    private Bid bid;

    @NotNull(message = "Winner status is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50)
    private WinnerStatus status;

    @NotNull(message = "Winner selection type is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "selection_type", nullable = false, length = 50)
    private WinnerSelectionType selectionType;

    @NotNull(message = "Winning amount is required")
    @DecimalMin(value = "0.0", message = "Winning amount must be non-negative")
    @Column(name = "winning_amount", nullable = false)
    private Long winningAmount;

    @Column(name = "seller_decision_at")
    private Instant sellerDecisionAt;

    @Size(max = 1000)
    @Column(name = "notes", length = 1000)
    private String notes;

    // --- IMMUTABLE SNAPSHOT VALUE OBJECT FIELDS (Hardened String-5.1.1) ---

    @Size(max = 255)
    @Column(name = "winner_company_name", length = 255, updatable = false)
    private String winnerCompanyName;

    @Size(max = 255)
    @Column(name = "winner_display_name", length = 255, updatable = false)
    private String winnerDisplayName;

    @Size(max = 100)
    @Column(name = "winner_anonymous_code", length = 100, updatable = false)
    private String winnerAnonymousCode;

    @Column(name = "winner_bid_amount_snapshot", updatable = false)
    private Long winnerBidAmountSnapshot;

    @Column(name = "winner_bid_time_snapshot", updatable = false)
    private Instant winnerBidTimeSnapshot;

    @Size(max = 255)
    @Column(name = "seller_company_snapshot", length = 255, updatable = false)
    private String sellerCompanySnapshot;

    @Column(name = "reserve_price_snapshot", updatable = false)
    private Long reservePriceSnapshot;

    @Size(max = 10)
    @Column(name = "currency_snapshot", length = 10, updatable = false)
    private String currencySnapshot;

    @Size(max = 100)
    @Column(name = "tax_profile_snapshot", length = 100, updatable = false)
    private String taxProfileSnapshot;
}
