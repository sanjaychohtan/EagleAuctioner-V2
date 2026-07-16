package com.eagleauctioner.repository;

import com.eagleauctioner.entity.AuctionLot;
import com.eagleauctioner.enums.AuctionLotStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository interface for managing AuctionLot entity persistence.
 */
@Repository
public interface AuctionLotRepository extends JpaRepository<AuctionLot, UUID> {

    @EntityGraph(attributePaths = {"auction"})
    List<AuctionLot> findByAuctionId(UUID auctionId);

    @Query("SELECT al FROM AuctionLot al JOIN FETCH al.auction a LEFT JOIN FETCH al.winnerBidder wb WHERE al.id = :id")
    Optional<AuctionLot> findByIdWithDetails(@Param("id") UUID id);

    boolean existsByAuctionIdAndLotNumber(UUID auctionId, String lotNumber);

    List<AuctionLot> findByLotStatus(AuctionLotStatus status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT al FROM AuctionLot al WHERE al.id = :id")
    Optional<AuctionLot> findByIdForUpdate(@Param("id") UUID id);
}
