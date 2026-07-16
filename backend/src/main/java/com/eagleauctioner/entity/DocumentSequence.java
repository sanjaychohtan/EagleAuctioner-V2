package com.eagleauctioner.entity;

import com.eagleauctioner.enums.DocumentType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.io.Serializable;
import java.time.Instant;

@Entity
@Table(name = "document_sequences")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@IdClass(DocumentSequenceId.class)
public class DocumentSequence {

    @Id
    @Column(name = "tenant_id", length = 50)
    private String tenantId;

    @Id
    @Column(name = "branch_code", length = 50)
    private String branchCode;

    @Id
    @Column(name = "year")
    private Integer year;

    @Id
    @Column(name = "region_code", length = 50)
    private String regionCode;

    @Id
    @Enumerated(EnumType.STRING)
    @Column(name = "document_type", length = 50)
    private DocumentType documentType;

    @Column(name = "next_value", nullable = false)
    private Long nextValue;

    @Version
    @Column(nullable = false)
    private Long version;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}
