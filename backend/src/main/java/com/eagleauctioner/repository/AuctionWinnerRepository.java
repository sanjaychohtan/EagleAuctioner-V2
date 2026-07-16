package com.eagleauctioner.repository;

import com.eagleauctioner.entity.AuctionWinner;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface AuctionWinnerRepository extends JpaRepository<AuctionWinner, UUID> {

    @Query("SELECT DISTINCT aw FROM AuctionWinner aw JOIN FETCH aw.auctionLot al JOIN FETCH aw.bidderProfile bp LEFT JOIN FETCH aw.bid b WHERE aw.auctionLot.id = :auctionLotId")
    Optional<AuctionWinner> findByAuctionLotId(@Param("auctionLotId") UUID auctionLotId);

    @Query("SELECT DISTINCT aw FROM AuctionWinner aw JOIN FETCH aw.auctionLot al JOIN FETCH aw.bidderProfile bp LEFT JOIN FETCH aw.bid b WHERE aw.id = :id")
    Optional<AuctionWinner> findByIdWithRelations(@Param("id") UUID id);
}
