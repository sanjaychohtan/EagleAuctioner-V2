package com.eagleauctioner.entity;

import com.eagleauctioner.enums.AuctionLotStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

/**
 * Entity representing an individual lot (asset) within an auction.
 */
@Entity
@Table(name = "auction_lots")
@SQLDelete(sql = "UPDATE auction_lots SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND version = ?")
@SQLRestriction("deleted_at IS NULL")

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuctionLot extends BaseEntity {

    @NotNull(message = "Auction reference is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "auction_id", nullable = false)
    private Auction auction;

    @NotBlank(message = "Lot number is required")
    @Column(name = "lot_number", nullable = false, length = 50)
    private String lotNumber;

    @NotBlank(message = "Title is required")
    @Column(name = "title", nullable = false, length = 255)
    private String title;

    @Column(name = "description", length = 2000)
    private String description;

    @NotBlank(message = "Material category is required")
    @Column(name = "material_category", nullable = false, length = 100)
    private String materialCategory;

    @NotNull(message = "Quantity is required")
    @Column(name = "quantity", nullable = false)
    private Long quantity; // Stored as scaled integer (e.g., * 10000)

    @NotBlank(message = "Unit of measure is required")
    @Column(name = "unit_of_measure", nullable = false, length = 20)
    private String unitOfMeasure;

    @NotNull(message = "Starting price is required")
    @Column(name = "starting_price", nullable = false)
    private Long startingPrice;

    @Column(name = "reserve_price")
    private Long reservePrice;

    @Column(name = "current_highest_bid")
    private Long currentHighestBid;

    @NotNull(message = "Minimum increment is required")
    @Column(name = "minimum_increment", nullable = false)
    private Long minimumIncrement;

    @NotBlank(message = "Currency is required")
    @Column(name = "currency", nullable = false, length = 3)
    private String currency;

    @NotNull(message = "Lot status is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "lot_status", nullable = false, length = 50)
    private AuctionLotStatus lotStatus;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "winner_bidder_id")
    private BidderProfile winnerBidder;

    @Column(name = "display_order", nullable = false)
    @Builder.Default
    private Integer displayOrder = 0;

    @PrePersist
    @PreUpdate
    public void validateLotBusinessRules() {
        if (quantity != null && quantity <= 0L) {
            throw new IllegalStateException("Quantity must be greater than zero");
        }
        if (startingPrice != null && startingPrice.compareTo(0L) < 0) {
            throw new IllegalStateException("Starting price cannot be negative");
        }
        if (reservePrice != null && startingPrice != null && reservePrice.compareTo(startingPrice) < 0) {
            throw new IllegalStateException("Reserve price cannot be lower than starting price");
        }
        if (minimumIncrement != null && minimumIncrement.compareTo(0L) <= 0) {
            throw new IllegalStateException("Minimum increment must be greater than zero");
        }
    }
}
