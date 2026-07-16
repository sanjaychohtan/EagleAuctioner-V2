package com.eagleauctioner.repository;

import com.eagleauctioner.entity.AuctionResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface AuctionResultRepository extends JpaRepository<AuctionResult, UUID> {

    @Query("SELECT DISTINCT ar FROM AuctionResult ar JOIN FETCH ar.auctionLot al LEFT JOIN FETCH ar.winner w LEFT JOIN FETCH w.bidderProfile bp WHERE ar.auctionLot.id = :auctionLotId")
    Optional<AuctionResult> findByAuctionLotId(@Param("auctionLotId") UUID auctionLotId);
}
