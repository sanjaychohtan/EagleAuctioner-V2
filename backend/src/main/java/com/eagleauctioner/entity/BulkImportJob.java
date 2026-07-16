package com.eagleauctioner.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "bulk_import_jobs", indexes = {
    @Index(name = "idx_bulk_import_file_hash", columnList = "file_hash", unique = true)
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BulkImportJob {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "file_hash", nullable = false, unique = true, length = 64)
    private String fileHash;

    @Column(nullable = false, length = 50)
    private String status; // PENDING, PROCESSING, COMPLETED, FAILED

    @Column(name = "total_records")
    private Integer totalRecords;

    @Column(name = "processed_records")
    private Integer processedRecords;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;
}
