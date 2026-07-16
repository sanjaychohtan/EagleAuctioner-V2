package com.eagleauctioner.repository;

import com.eagleauctioner.entity.SellerDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SellerDocumentRepository extends JpaRepository<SellerDocument, UUID> {
    List<SellerDocument> findBySellerProfileId(UUID sellerProfileId);
    boolean existsBySellerProfileIdAndDocumentHash(
        UUID sellerProfileId,
        String documentHash
    );
}
