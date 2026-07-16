package com.eagleauctioner.repository;

import com.eagleauctioner.entity.KycDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface KycDocumentRepository extends JpaRepository<KycDocument, UUID> {
    List<KycDocument> findByBidderProfileId(UUID bidderProfileId);
    boolean existsByDocumentHash(String documentHash);
}
