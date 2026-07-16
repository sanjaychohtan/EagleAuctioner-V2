package com.eagleauctioner.repository;

import com.eagleauctioner.entity.BulkImportJob;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BulkImportJobRepository extends JpaRepository<BulkImportJob, UUID> {
    Optional<BulkImportJob> findByFileHash(String fileHash);
}
