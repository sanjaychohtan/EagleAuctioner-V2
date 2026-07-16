package com.eagleauctioner.repository;

import com.eagleauctioner.entity.FeeInvoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface FeeInvoiceRepository extends JpaRepository<FeeInvoice, UUID> {
    Optional<FeeInvoice> findByDocumentNumber(String documentNumber);
    Optional<FeeInvoice> findByPurchaseOrderId(UUID purchaseOrderId);

    @Query("SELECT fi FROM FeeInvoice fi LEFT JOIN FETCH fi.items WHERE fi.id = :id")
    Optional<FeeInvoice> findByIdWithRelations(@Param("id") UUID id);
}
