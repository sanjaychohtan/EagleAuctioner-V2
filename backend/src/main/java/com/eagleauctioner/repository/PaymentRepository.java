package com.eagleauctioner.repository;

import com.eagleauctioner.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Enterprise Repository for Payments, including batch allocations and transaction history.
 */
@Repository
public interface PaymentRepository extends JpaRepository<Payment, UUID> {

    @Query("SELECT p FROM Payment p LEFT JOIN FETCH p.allocations WHERE p.id = :id")
    Optional<Payment> findByIdWithRelations(@Param("id") UUID id);

    @Query("SELECT p FROM Payment p WHERE p.settlement.id = :settlementId AND p.status = com.eagleauctioner.enums.PaymentStatus.COMPLETED")
    List<Payment> findCompletedBySettlementId(@Param("settlementId") UUID settlementId);

    @Query("SELECT p FROM Payment p WHERE p.settlement.id = :settlementId")
    Optional<Payment> findBySettlementId(@Param("settlementId") UUID settlementId);

    boolean existsByReferenceNumber(String referenceNumber);
}
