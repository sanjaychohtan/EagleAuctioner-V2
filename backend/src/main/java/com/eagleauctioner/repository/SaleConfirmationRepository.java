package com.eagleauctioner.repository;

import com.eagleauctioner.entity.SaleConfirmation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface SaleConfirmationRepository extends JpaRepository<SaleConfirmation, UUID> {
    Optional<SaleConfirmation> findByDocumentNumber(String documentNumber);
    Optional<SaleConfirmation> findByWinnerId(UUID winnerId);

    @Query("SELECT sc FROM SaleConfirmation sc JOIN FETCH sc.winner w JOIN FETCH w.auctionLot l WHERE sc.id = :id")
    Optional<SaleConfirmation> findByIdWithRelations(@Param("id") UUID id);
}
