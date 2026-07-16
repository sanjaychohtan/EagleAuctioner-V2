package com.eagleauctioner.repository;

import com.eagleauctioner.entity.LedgerEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface LedgerRepository extends JpaRepository<LedgerEntry, UUID> {

    @Query("SELECT e FROM LedgerEntry e WHERE e.transaction.settlementId = :settlementId")
    List<LedgerEntry> findBySettlementId(@Param("settlementId") UUID settlementId);
}
