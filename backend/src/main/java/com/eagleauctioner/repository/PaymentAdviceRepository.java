package com.eagleauctioner.repository;

import com.eagleauctioner.entity.PaymentAdvice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

/**
 * Enterprise Repository for tracking Payment Advices.
 */
@Repository
public interface PaymentAdviceRepository extends JpaRepository<PaymentAdvice, UUID> {

    Optional<PaymentAdvice> findBySettlementId(UUID settlementId);

    Optional<PaymentAdvice> findByAdviceNumber(String adviceNumber);
}
