package com.eagleauctioner.dto;

import java.util.UUID;

public record KycDocumentDto(
        UUID id,
        String documentType,
        String storagePath,
        String verificationStatus,
        String rejectionReason
) {}
