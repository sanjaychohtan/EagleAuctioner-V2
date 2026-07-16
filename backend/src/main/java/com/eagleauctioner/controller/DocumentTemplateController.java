package com.eagleauctioner.controller;

import com.eagleauctioner.dto.ApiResponse;
import com.eagleauctioner.dto.DocumentTemplateDTOs.TemplateRequest;
import com.eagleauctioner.dto.DocumentTemplateDTOs.TemplateResponse;
import com.eagleauctioner.entity.DocumentTemplate;
import com.eagleauctioner.service.DocumentTemplateService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/document-templates")
@RequiredArgsConstructor
public class DocumentTemplateController {

    private final DocumentTemplateService documentTemplateService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<TemplateResponse>> createTemplate(@Valid @RequestBody TemplateRequest request) {
        DocumentTemplate template = DocumentTemplate.builder()
                .name(request.getName())
                .documentType(request.getDocumentType())
                .content(request.getContent())
                .description(request.getDescription())
                .isActive(request.getIsActive())
                .build();
        
        DocumentTemplate saved = documentTemplateService.createTemplate(template);
        return ResponseEntity.ok(ApiResponse.success("Template created", mapToResponse(saved)));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE')")
    public ResponseEntity<ApiResponse<List<TemplateResponse>>> getAllTemplates() {
        List<TemplateResponse> responses = documentTemplateService.getAllTemplates()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success("Templates retrieved", responses));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE')")
    public ResponseEntity<ApiResponse<TemplateResponse>> getById(@PathVariable UUID id) {
        DocumentTemplate template = documentTemplateService.getById(id);
        return ResponseEntity.ok(ApiResponse.success("Template retrieved", mapToResponse(template)));
    }

    private TemplateResponse mapToResponse(DocumentTemplate template) {
        return TemplateResponse.builder()
                .id(template.getId())
                .name(template.getName())
                .documentType(template.getDocumentType())
                .templateVersion(template.getTemplateVersion())
                .content(template.getContent())
                .isActive(template.getIsActive())
                .description(template.getDescription())
                .build();
    }
}
