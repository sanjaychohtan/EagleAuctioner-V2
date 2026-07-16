package com.eagleauctioner.repository;

import com.eagleauctioner.entity.SettlementReconciliation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface SettlementReconciliationRepository extends JpaRepository<SettlementReconciliation, UUID> {
    Optional<SettlementReconciliation> findBySettlementId(UUID settlementId);
}
