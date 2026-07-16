package com.eagleauctioner.entity;

import com.eagleauctioner.entity.BaseEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import org.hibernate.envers.Audited;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.util.UUID;

@Entity
@Table(name = "auction_bidder_authorizations")
@SQLDelete(sql = "UPDATE auction_bidder_authorizations SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND version = ?")
@SQLRestriction("deleted_at IS NULL")
@Audited
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BidderAuthorization extends BaseEntity {

    @NotNull(message = "Auction is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "auction_id", nullable = false)
    private Auction auction;

    @NotNull(message = "Bidder profile is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bidder_id", nullable = false)
    private BidderProfile bidderProfile;

    @NotNull(message = "Authorization status is required")
    @Column(name = "is_authorized", nullable = false)
    private Boolean isAuthorized;

    @Size(max = 255)
    @Column(name = "authorization_reason", length = 255)
    private String authorizationReason;
}
