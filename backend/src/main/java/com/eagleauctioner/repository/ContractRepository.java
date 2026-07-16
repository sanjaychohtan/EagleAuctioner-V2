package com.eagleauctioner.repository;

import com.eagleauctioner.entity.Contract;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

/**
 * Enterprise Repository for Contract entity operations.
 * Optimized with batch fetches to avoid N+1 select performance pitfalls.
 */
@Repository
public interface ContractRepository extends JpaRepository<Contract, UUID> {

    @Query("SELECT c FROM Contract c " +
           "LEFT JOIN FETCH c.versions " +
           "LEFT JOIN FETCH c.winner w " +
           "LEFT JOIN FETCH w.bidderProfile bp " +
           "LEFT JOIN FETCH bp.user bpu " +
           "LEFT JOIN FETCH w.auctionLot al " +
           "LEFT JOIN FETCH al.auction a " +
           "LEFT JOIN FETCH a.sellerProfile sp " +
           "LEFT JOIN FETCH sp.user spu " +
           "LEFT JOIN FETCH sp.company " +
           "WHERE c.id = :id")
    Optional<Contract> findByIdWithRelations(@Param("id") UUID id);
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT c FROM Contract c " +
           "LEFT JOIN FETCH c.versions " +
           "LEFT JOIN FETCH c.winner w " +
           "LEFT JOIN FETCH w.bidderProfile bp " +
           "LEFT JOIN FETCH bp.user bpu " +
           "LEFT JOIN FETCH w.auctionLot al " +
           "LEFT JOIN FETCH al.auction a " +
           "LEFT JOIN FETCH a.sellerProfile sp " +
           "LEFT JOIN FETCH sp.user spu " +
           "LEFT JOIN FETCH sp.company " +
           "WHERE c.id = :id")
    Optional<Contract> findByIdWithRelationsForUpdate(@Param("id") UUID id);

    @Query("SELECT c FROM Contract c LEFT JOIN FETCH c.versions WHERE c.documentNumber = :docNum")
    Optional<Contract> findByDocumentNumber(@Param("docNum") String docNum);

    @Query("SELECT c FROM Contract c " +
           "LEFT JOIN FETCH c.versions " +
           "LEFT JOIN FETCH c.winner w " +
           "LEFT JOIN FETCH w.bidderProfile bp " +
           "LEFT JOIN FETCH bp.user bpu " +
           "LEFT JOIN FETCH w.auctionLot al " +
           "LEFT JOIN FETCH al.auction a " +
           "LEFT JOIN FETCH a.sellerProfile sp " +
           "LEFT JOIN FETCH sp.user spu " +
           "LEFT JOIN FETCH sp.company " +
           "WHERE w.id = :winnerId")
    Optional<Contract> findByWinnerId(@Param("winnerId") UUID winnerId);
}
