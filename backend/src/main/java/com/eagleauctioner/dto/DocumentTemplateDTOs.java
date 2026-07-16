package com.eagleauctioner.dto;

import com.eagleauctioner.enums.DocumentType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.UUID;

/**
 * DTOs for Document Template management.
 */
public class DocumentTemplateDTOs {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TemplateRequest {
        @NotBlank(message = "Name is required")
        private String name;

        @NotNull(message = "Document type is required")
        private DocumentType documentType;

        @NotBlank(message = "Content is required")
        private String content;

        private String description;

        @Builder.Default
        private Boolean isActive = true;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TemplateResponse {
        private UUID id;
        private String name;
        private DocumentType documentType;
        private Integer templateVersion;
        private String content;
        private Boolean isActive;
        private String description;
    }
}
