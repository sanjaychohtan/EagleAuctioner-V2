package com.eagleauctioner.repository;

import com.eagleauctioner.entity.Dispute;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface DisputeRepository extends JpaRepository<Dispute, UUID> {
    List<Dispute> findBySettlementId(UUID settlementId);
    List<Dispute> findByStatus(String status);
}
