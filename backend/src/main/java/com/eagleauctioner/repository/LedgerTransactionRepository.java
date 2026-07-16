package com.eagleauctioner.repository;

import com.eagleauctioner.entity.LedgerTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface LedgerTransactionRepository extends JpaRepository<LedgerTransaction, UUID> {
    boolean existsByTransactionReference(String transactionReference);
    
    @Query("SELECT t FROM LedgerTransaction t LEFT JOIN FETCH t.entries WHERE t.settlementId = :settlementId")
    List<LedgerTransaction> findBySettlementId(@Param("settlementId") UUID settlementId);
    
    @Query("SELECT t FROM LedgerTransaction t LEFT JOIN FETCH t.entries WHERE t.paymentId = :paymentId")
    Optional<LedgerTransaction> findByPaymentId(@Param("paymentId") UUID paymentId);
    
    @Query("SELECT t FROM LedgerTransaction t LEFT JOIN FETCH t.entries WHERE t.transactionReference = :transactionReference")
    Optional<LedgerTransaction> findByTransactionReference(@Param("transactionReference") String transactionReference);
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT l FROM LedgerTransaction l WHERE l.transactionReference = :transactionReference")
    Optional<LedgerTransaction> findByTransactionReferenceForUpdate(@Param("transactionReference") String transactionReference);
}
