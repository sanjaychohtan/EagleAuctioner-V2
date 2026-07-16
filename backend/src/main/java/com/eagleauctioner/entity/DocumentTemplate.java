package com.eagleauctioner.entity;

import com.eagleauctioner.enums.DocumentType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.envers.Audited;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

/**
 * Enterprise entity representing dynamic templates for commercial documents.
 * Supports versioning and lifecycle management.
 */
@Entity
@Table(name = "document_templates")
@SQLDelete(sql = "UPDATE document_templates SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND version = ?")
@SQLRestriction("deleted_at IS NULL")
@Audited
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentTemplate extends BaseEntity {

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "document_type", nullable = false, length = 50)
    private DocumentType documentType;

    @Column(name = "template_version", nullable = false)
    @Builder.Default
    private Integer templateVersion = 1;

    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "description", length = 500)
    private String description;
}
