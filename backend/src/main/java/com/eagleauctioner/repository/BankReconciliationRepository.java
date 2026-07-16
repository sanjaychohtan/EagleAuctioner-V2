package com.eagleauctioner.repository;

import com.eagleauctioner.entity.BankReconciliation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface BankReconciliationRepository extends JpaRepository<BankReconciliation, UUID> {
    Optional<BankReconciliation> findByPaymentId(UUID paymentId);
    Optional<BankReconciliation> findByBankTransactionId(String bankTransactionId);
}
