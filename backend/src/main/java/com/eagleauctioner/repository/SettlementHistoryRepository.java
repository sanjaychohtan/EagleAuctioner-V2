package com.eagleauctioner.repository;

import com.eagleauctioner.entity.SettlementHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SettlementHistoryRepository extends JpaRepository<SettlementHistory, UUID> {

    @Query("SELECT sh FROM SettlementHistory sh " +
           "LEFT JOIN FETCH sh.settlement s " +
           "WHERE s.id = :settlementId " +
           "ORDER BY sh.actionTimestamp ASC")
    List<SettlementHistory> findBySettlementIdOrderByActionTimestampAsc(@Param("settlementId") UUID settlementId);
}
