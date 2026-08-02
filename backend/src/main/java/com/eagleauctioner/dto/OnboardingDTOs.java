package com.eagleauctioner.dto;

import com.eagleauctioner.enums.BidderState;
import com.eagleauctioner.enums.SellerState;
import jakarta.validation.constraints.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public final class OnboardingDTOs {

    private OnboardingDTOs() {}

    public record BankAccountDto(
            UUID id,
            String accountHolderName,
            String maskedAccountNumber,
            String ifscCode,
            String bankName,
            String branchName,
            boolean isVerified,
            String pennyDropTransactionId
    ) {}

    public record KycDocumentDto(
            UUID id,
            String documentType,
            String storagePath,
            String verificationStatus,
            String rejectionReason
    ) {}

    public record KycDocumentRequest(
            @NotBlank String documentType,
            @NotBlank String storagePath,
            @NotBlank String documentHash,
            long fileSize,
            String mimeType,
            boolean malwareDetected
    ) {}

    public record KycReviewRequest(
            @NotBlank @Pattern(regexp = "APPROVED|REJECTED") String decision,
            @NotBlank @Size(min = 10, max = 1000) String reviewNotes
    ) {}

    public record OrganizationDto(
            UUID id,
            String organizationName,
            String registrationNumber,
            String gstin,
            String registeredAddress
    ) {}

    public record BidderRegistrationRequest(
            @NotBlank @Size(max = 50) String bidderType, // INDIVIDUAL or CORPORATE
            @NotBlank @Pattern(regexp = "[A-Z]{5}[0-9]{4}[A-Z]{1}", message = "Invalid PAN format") String panNumber,
            @NotBlank @Pattern(regexp = "^\\d{4}-\\d{4}-\\d{4}$", message = "Invalid Aadhaar format") String rawAadhaar,
            
            // Organization Details (Required if CORPORATE)
            String organizationName,
            String registrationNumber,
            String gstin,
            String registeredAddress,
            
            // Bank Details
            @NotBlank String accountHolderName,
            @NotBlank @Size(min = 9, max = 18) String accountNumber,
            @NotBlank @Pattern(regexp = "^[A-Z]{4}0[A-Z0-9]{6}$", message = "Invalid IFSC code") String ifscCode,
            @NotBlank String bankName,
            @NotBlank String branchName
    ) {}

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

    public record SellerRegistrationRequest(
            @NotBlank String sellerType, // INDIVIDUAL or CORPORATE
            @NotBlank String panNumber,
            String companyName,
            String registrationNumber,
            String gstin,
            String registeredAddress
    ) {}

    public record SellerProfileResponse(
            UUID id,
            UUID userId,
            SellerState state,
            String sellerType,
            String maskedPan,
            Instant onboardedAt,
            Instant createdAt
    ) {}
}
