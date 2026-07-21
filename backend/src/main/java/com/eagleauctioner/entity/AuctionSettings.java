package com.eagleauctioner.entity;

import com.eagleauctioner.enums.BidIncrementType;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import org.hibernate.envers.Audited;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;


/**
 * Configuration entity holding specific rules and behaviors for an auction.
 */
@Entity
@Table(name = "auction_settings")
@SQLDelete(sql = "UPDATE auction_settings SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND version = ?")
@SQLRestriction("deleted_at IS NULL")
@Audited
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuctionSettings extends BaseEntity {

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "auction_id", nullable = false, unique = true)
    private Auction auction;

    @Column(name = "anonymous_bidding", nullable = false)
    @Builder.Default
    private boolean anonymousBidding = false;

    @Column(name = "allow_auto_extension", nullable = false)
    @Builder.Default
    private boolean allowAutoExtension = false;

    @Column(name = "extension_minutes")
    private Integer extensionMinutes;

    @Column(name = "max_extensions")
    private Integer maxExtensions;

    @Enumerated(EnumType.STRING)
    @Column(name = "bid_increment_type", length = 50)
    private BidIncrementType bidIncrementType;

    @Column(name = "minimum_increment")
    private Long minimumIncrement;

    @Column(name = "reserve_price_enabled", nullable = false)
    @Builder.Default
    private boolean reservePriceEnabled = false;

    @Column(name = "allow_proxy_bid", nullable = false)
    @Builder.Default
    private boolean allowProxyBid = false;

    @Column(name = "allow_manual_winner", nullable = false)
    @Builder.Default
    private boolean allowManualWinner = false;

    @Column(name = "allow_seller_approval", nullable = false)
    @Builder.Default
    private boolean allowSellerApproval = false;

    @Column(name = "allow_bid_withdrawal", nullable = false)
    @Builder.Default
    private boolean allowBidWithdrawal = false;

    @Column(name = "allow_rank_display", nullable = false)
    @Builder.Default
    private boolean allowRankDisplay = false;

    @Column(name = "show_bidder_names", nullable = false)
    @Builder.Default
    private boolean showBidderNames = false;

    @Column(name = "registration_required", nullable = false)
    @Builder.Default
    private boolean registrationRequired = false;

    @Column(name = "emd_required", nullable = false)
    @Builder.Default
    private boolean emdRequired = false;

    @NotBlank(message = "Timezone is required")
    @Column(name = "timezone", nullable = false, length = 100)
    private String timezone;
}
