package com.eagleauctioner.repository;

import com.eagleauctioner.entity.Auction;
import com.eagleauctioner.enums.AuctionState;
import com.eagleauctioner.enums.AuctionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository interface for managing core Auction entity persistence.
 */
@Repository
public interface AuctionRepository extends JpaRepository<Auction, UUID> {

    @EntityGraph(attributePaths = {"sellerProfile", "sellerProfile.user"})
    Optional<Auction> findByAuctionNumber(String auctionNumber);

    @EntityGraph(attributePaths = {"sellerProfile"})
    List<Auction> findByState(AuctionState state);

    @Query("SELECT a FROM Auction a JOIN FETCH a.sellerProfile sp JOIN FETCH sp.user u WHERE a.id = :id")
    Optional<Auction> findByIdWithSellerAndUser(@Param("id") UUID id);

    @Query("SELECT a FROM Auction a WHERE a.sellerProfile.id = :sellerProfileId")
    @EntityGraph(attributePaths = {"sellerProfile"})
    List<Auction> findBySellerProfileId(@Param("sellerProfileId") UUID sellerProfileId);

    @EntityGraph(attributePaths = {"lots"})
    @Query("SELECT a FROM Auction a WHERE a.id = :id")
    Optional<Auction> findWithLotsById(@Param("id") UUID id);

    @EntityGraph(attributePaths = {"lots"})
    List<Auction> findByStateAndAuctionStartLessThanEqual(AuctionState state, Instant time);

    @EntityGraph(attributePaths = {"lots"})
    List<Auction> findByStateAndAuctionEndLessThanEqual(AuctionState state, Instant time);

    @EntityGraph(attributePaths = {"lots", "sellerProfile"})
    Page<Auction> findByStateAndAuctionType(AuctionState state, AuctionType auctionType, Pageable pageable);

    @EntityGraph(attributePaths = {"lots", "sellerProfile"})
    Page<Auction> findByState(AuctionState state, Pageable pageable);

    @EntityGraph(attributePaths = {"lots", "sellerProfile"})
    Page<Auction> findByAuctionType(AuctionType auctionType, Pageable pageable);

    @EntityGraph(attributePaths = {"lots", "sellerProfile"})
    @Query("SELECT a FROM Auction a WHERE a.state IN (com.eagleauctioner.enums.AuctionState.PUBLISHED, com.eagleauctioner.enums.AuctionState.APPROVED, com.eagleauctioner.enums.AuctionState.DRAFT) AND a.auctionStart > :now")
    Page<Auction> findUpcomingAuctions(@Param("now") Instant now, Pageable pageable);

    @EntityGraph(attributePaths = {"lots", "sellerProfile"})
    @Query("SELECT a FROM Auction a WHERE a.state IN (com.eagleauctioner.enums.AuctionState.PUBLISHED, com.eagleauctioner.enums.AuctionState.APPROVED, com.eagleauctioner.enums.AuctionState.DRAFT) AND a.auctionType = :type AND a.auctionStart > :now")
    Page<Auction> findUpcomingAuctionsByType(@Param("type") AuctionType type, @Param("now") Instant now, Pageable pageable);

    @EntityGraph(attributePaths = {"lots", "sellerProfile"})
    Page<Auction> findAll(Pageable pageable);

    long countByState(AuctionState state);
}
