package com.eagleauctioner.repository;

import com.eagleauctioner.entity.GSTInvoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface GSTInvoiceRepository extends JpaRepository<GSTInvoice, UUID> {
    Optional<GSTInvoice> findByInvoiceNumber(String invoiceNumber);
    Optional<GSTInvoice> findBySettlementId(UUID settlementId);
    List<GSTInvoice> findBySellerId(UUID sellerId);
    List<GSTInvoice> findByBuyerId(UUID buyerId);
}
