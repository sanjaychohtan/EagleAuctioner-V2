package com.eagleauctioner.entity;

import com.eagleauctioner.enums.AuctionState;
import com.eagleauctioner.enums.AuctionType;
import com.eagleauctioner.enums.AuctionVisibility;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Core domain entity representing an Auction session.
 */
@Entity
@Table(name = "auctions")
@SQLDelete(sql = "UPDATE auctions SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND version = ?")
@SQLRestriction("deleted_at IS NULL")

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Auction extends BaseEntity {

    @NotBlank(message = "Auction number is required")
    @Size(max = 50, message = "Auction number must not exceed 50 characters")
    @Column(name = "auction_number", nullable = false, length = 50)
    private String auctionNumber;

    @NotBlank(message = "Title is required")
    @Size(max = 255, message = "Title must not exceed 255 characters")
    @Column(name = "title", nullable = false, length = 255)
    private String title;

    @Size(max = 2000, message = "Description must not exceed 2000 characters")
    @Column(name = "description", length = 2000)
    private String description;

    @NotNull(message = "Seller profile is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seller_profile_id", nullable = false)
    private SellerProfile sellerProfile;

    @NotNull(message = "State is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "state", nullable = false, length = 50)
    private AuctionState state;

    @NotNull(message = "Auction type is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "auction_type", nullable = false, length = 50)
    private AuctionType auctionType;

    @NotNull(message = "Visibility is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "visibility", nullable = false, length = 50)
    private AuctionVisibility visibility;

    @NotBlank(message = "Currency is required")
    @Size(min = 3, max = 3, message = "Currency must be a 3-letter ISO code")
    @Column(name = "currency", nullable = false, length = 3)
    private String currency;

    @NotBlank(message = "Timezone is required")
    @Size(max = 100, message = "Timezone must not exceed 100 characters")
    @Column(name = "timezone", nullable = false, length = 100)
    private String timezone;

    @NotNull(message = "Registration start time is required")
    @Column(name = "registration_start", nullable = false)
    private Instant registrationStart;

    @NotNull(message = "Registration end time is required")
    @Column(name = "registration_end", nullable = false)
    private Instant registrationEnd;

    @Column(name = "inspection_start")
    private Instant inspectionStart;

    @Column(name = "inspection_end")
    private Instant inspectionEnd;

    @NotNull(message = "Auction start time is required")
    @Column(name = "auction_start", nullable = false)
    private Instant auctionStart;

    @NotNull(message = "Auction end time is required")
    @Column(name = "auction_end", nullable = false)
    private Instant auctionEnd;

    @Column(name = "reserve_price_enabled", nullable = false)
    @Builder.Default
    private boolean reservePriceEnabled = false;

    @Column(name = "auto_extension_enabled", nullable = false)
    @Builder.Default
    private boolean autoExtensionEnabled = false;

    @Min(value = 1, message = "Extension minutes must be at least 1")
    @Max(value = 1440, message = "Extension minutes must not exceed 1440 (24 hours)")
    @Column(name = "extension_minutes")
    private Integer extensionMinutes;

    @Column(name = "extension_count")
    @Builder.Default
    private Integer extensionCount = 0;

    @OneToOne(mappedBy = "auction", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private AuctionSettings settings;

    @OneToMany(mappedBy = "auction", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<AuctionLot> lots = new ArrayList<>();

    @PrePersist
    @PreUpdate
    public void validateSchedulingAndConfiguration() {
        if (registrationStart != null && registrationEnd != null && !registrationStart.isBefore(registrationEnd)) {
            throw new IllegalStateException("Registration start must be before registration end");
        }
        if (inspectionStart != null && inspectionEnd != null && !inspectionStart.isBefore(inspectionEnd)) {
            throw new IllegalStateException("Inspection start must be before inspection end");
        }
        if (auctionStart != null && auctionEnd != null && !auctionStart.isBefore(auctionEnd)) {
            throw new IllegalStateException("Auction start must be before auction end");
        }
        if (registrationEnd != null && auctionStart != null && registrationEnd.isAfter(auctionStart)) {
            throw new IllegalStateException("Registration end must be before or equal to auction start");
        }
        if (autoExtensionEnabled && (extensionMinutes == null || extensionMinutes <= 0)) {
            throw new IllegalStateException("Extension minutes must be positive if auto-extension is enabled");
        }
    }
}
