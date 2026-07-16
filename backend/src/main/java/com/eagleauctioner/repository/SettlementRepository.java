package com.eagleauctioner.repository;

import com.eagleauctioner.entity.Settlement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface SettlementRepository extends JpaRepository<Settlement, UUID> {

    @Query("SELECT s FROM Settlement s " +
           "LEFT JOIN FETCH s.contract c " +
           "LEFT JOIN FETCH c.winner w " +
           "LEFT JOIN FETCH w.bidderProfile bp " +
           "LEFT JOIN FETCH bp.user bpu " +
           "LEFT JOIN FETCH w.auctionLot al " +
           "LEFT JOIN FETCH al.auction a " +
           "LEFT JOIN FETCH a.sellerProfile sp " +
           "LEFT JOIN FETCH sp.user spu " +
           "LEFT JOIN FETCH sp.company " +
           "WHERE s.id = :id")
    Optional<Settlement> findByIdWithRelations(@Param("id") UUID id);

    @Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM Settlement s " +
           "LEFT JOIN FETCH s.contract c " +
           "LEFT JOIN FETCH c.winner w " +
           "LEFT JOIN FETCH w.bidderProfile bp " +
           "LEFT JOIN FETCH bp.user bpu " +
           "LEFT JOIN FETCH w.auctionLot al " +
           "LEFT JOIN FETCH al.auction a " +
           "LEFT JOIN FETCH a.sellerProfile sp " +
           "LEFT JOIN FETCH sp.user spu " +
           "LEFT JOIN FETCH sp.company " +
           "WHERE s.id = :id")
    Optional<Settlement> findByIdWithRelationsForUpdate(@Param("id") UUID id);

    @Query("SELECT s FROM Settlement s " +
           "LEFT JOIN FETCH s.contract c " +
           "LEFT JOIN FETCH c.winner w " +
           "LEFT JOIN FETCH w.bidderProfile bp " +
           "LEFT JOIN FETCH bp.user bpu " +
           "LEFT JOIN FETCH w.auctionLot al " +
           "LEFT JOIN FETCH al.auction a " +
           "LEFT JOIN FETCH a.sellerProfile sp " +
           "LEFT JOIN FETCH sp.user spu " +
           "LEFT JOIN FETCH sp.company " +
           "WHERE s.contract.id = :contractId")
    Optional<Settlement> findByContractId(@Param("contractId") UUID contractId);
}
