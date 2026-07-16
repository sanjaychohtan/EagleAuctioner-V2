package com.eagleauctioner.repository;

import com.eagleauctioner.entity.DocumentTemplate;
import com.eagleauctioner.enums.DocumentType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface DocumentTemplateRepository extends JpaRepository<DocumentTemplate, UUID> {
    Optional<DocumentTemplate> findByDocumentTypeAndIsActiveTrue(DocumentType documentType);
    Optional<DocumentTemplate> findByDocumentTypeAndTemplateVersion(DocumentType documentType, Integer version);
}
