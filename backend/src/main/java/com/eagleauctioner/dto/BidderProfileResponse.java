package com.eagleauctioner.dto;

import com.eagleauctioner.enums.BidderState;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record BidderProfileResponse(
        UUID id,
        UUID userId,
        String email,
        BidderState state,
        String bidderType,
        String maskedPan,
        String maskedAadhaar,
        String panVerificationStatus,
        String aadhaarVerificationStatus,
        OrganizationDto organization,
        BankAccountDto bankAccount,
        List<KycDocumentDto> documents,
        String rejectionReason,
        Instant createdAt,
        Instant updatedAt
) {}
