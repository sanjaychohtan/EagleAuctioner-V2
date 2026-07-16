package com.eagleauctioner.repository;

import com.eagleauctioner.entity.BidderAuthorization;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface BidderAuthorizationRepository extends JpaRepository<BidderAuthorization, UUID> {
    Optional<BidderAuthorization> findByAuctionIdAndBidderProfileId(UUID auctionId, UUID bidderProfileId);
    boolean existsByAuctionIdAndBidderProfileIdAndIsAuthorizedTrue(UUID auctionId, UUID bidderProfileId);
}
