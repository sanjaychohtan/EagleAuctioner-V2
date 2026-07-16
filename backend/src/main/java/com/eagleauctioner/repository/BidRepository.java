package com.eagleauctioner.repository;

import com.eagleauctioner.entity.Bid;
import com.eagleauctioner.entity.AuctionLot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import jakarta.persistence.LockModeType;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BidRepository extends JpaRepository<Bid, UUID> {

    @Query("SELECT b FROM Bid b WHERE b.auctionLot.id = :lotId AND b.bidStatus = 'WINNING'")
    Optional<Bid> findWinningBid(@Param("lotId") UUID lotId);

    Optional<Bid> findFirstByAuctionLotIdOrderByBidAmountDescBidTimeAsc(UUID auctionLotId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT al FROM AuctionLot al WHERE al.id = :lotId")
    Optional<AuctionLot> lockLotForUpdate(@Param("lotId") UUID lotId);

    @Query("SELECT DISTINCT b FROM Bid b JOIN FETCH b.bidderProfile bp WHERE b.auctionLot.id = :lotId AND b.bidStatus <> com.eagleauctioner.enums.BidStatus.REJECTED")
    List<Bid> findActiveBidsByLotIdWithBidderProfile(@Param("lotId") UUID lotId);

    @Query("SELECT b FROM Bid b WHERE b.auctionLot.id = :lotId AND b.bidderProfile.id = :bidderId")
    List<Bid> findByLotIdAndBidderId(@Param("lotId") UUID lotId, @Param("bidderId") UUID bidderId);
}
