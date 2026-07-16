package com.eagleauctioner.repository;

import com.eagleauctioner.entity.DocumentSequence;
import com.eagleauctioner.entity.DocumentSequenceId;
import com.eagleauctioner.enums.DocumentType;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DocumentSequenceRepository extends JpaRepository<DocumentSequence, DocumentSequenceId> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT ds FROM DocumentSequence ds WHERE ds.tenantId = :tenantId AND ds.branchCode = :branchCode " +
           "AND ds.year = :year AND ds.regionCode = :regionCode AND ds.documentType = :type")
    Optional<DocumentSequence> findByCoordinatesForUpdate(
            @Param("tenantId") String tenantId,
            @Param("branchCode") String branchCode,
            @Param("year") Integer year,
            @Param("regionCode") String regionCode,
            @Param("type") DocumentType type);
}
