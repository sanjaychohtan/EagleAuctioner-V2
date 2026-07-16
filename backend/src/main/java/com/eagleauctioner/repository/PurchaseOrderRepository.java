package com.eagleauctioner.repository;

import com.eagleauctioner.entity.PurchaseOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PurchaseOrderRepository extends JpaRepository<PurchaseOrder, UUID> {
    Optional<PurchaseOrder> findByDocumentNumber(String documentNumber);
    Optional<PurchaseOrder> findBySaleConfirmationId(UUID saleConfirmationId);

    @Query("SELECT po FROM PurchaseOrder po LEFT JOIN FETCH po.items WHERE po.id = :id")
    Optional<PurchaseOrder> findByIdWithRelations(@Param("id") UUID id);
}
