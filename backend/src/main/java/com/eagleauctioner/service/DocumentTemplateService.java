package com.eagleauctioner.service;

import com.eagleauctioner.entity.DocumentTemplate;
import com.eagleauctioner.enums.DocumentType;
import com.eagleauctioner.repository.DocumentTemplateRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class DocumentTemplateService {

    private final DocumentTemplateRepository documentTemplateRepository;

    public DocumentTemplate getActiveTemplate(DocumentType type) {
        return documentTemplateRepository.findByDocumentTypeAndIsActiveTrue(type)
                .orElseThrow(() -> new IllegalArgumentException("No active template found for document type: " + type));
    }

    public List<DocumentTemplate> getAllTemplates() {
        return documentTemplateRepository.findAll();
    }

    @Transactional
    public DocumentTemplate createTemplate(DocumentTemplate template) {
        log.info("Creating new document template for: {}", template.getDocumentType());
        
        // Deactivate previous active template for the same type if necessary
        if (Boolean.TRUE.equals(template.getIsActive())) {
            documentTemplateRepository.findByDocumentTypeAndIsActiveTrue(template.getDocumentType())
                    .ifPresent(existing -> {
                        existing.setIsActive(false);
                        documentTemplateRepository.save(existing);
                    });
        }
        
        return documentTemplateRepository.save(template);
    }

    public DocumentTemplate getById(UUID id) {
        return documentTemplateRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Document template not found: " + id));
    }
}
