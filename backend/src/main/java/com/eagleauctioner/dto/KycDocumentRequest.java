package com.eagleauctioner.dto;

import jakarta.validation.constraints.NotBlank;

public record KycDocumentRequest(
        @NotBlank String documentType,
        @NotBlank String storagePath,
        @NotBlank String documentHash,
        long fileSize,
        String mimeType,
        boolean malwareDetected
) {}
