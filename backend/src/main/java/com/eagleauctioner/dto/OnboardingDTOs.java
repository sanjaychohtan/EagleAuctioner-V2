package com.eagleauctioner.dto;

import com.eagleauctioner.enums.BidderState;
import com.eagleauctioner.enums.SellerState;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
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
            String documentNumber,
            String storagePath,
            String verificationStatus,
            String rejectionReason,
            String actionRequiredReason,
            Instant uploadedAt,
            UUID verifiedBy,
            Instant verifiedAt
    ) {}

    public record KycDocumentRequest(
            @NotBlank String documentType,
            String documentNumber,
            @NotBlank String storagePath,
            @NotBlank String documentHash,
            long fileSize,
            String mimeType,
            boolean malwareDetected
    ) {
        public KycDocumentRequest(String documentType, String storagePath, String documentHash, long fileSize, String mimeType, boolean malwareDetected) {
            this(documentType, null, storagePath, documentHash, fileSize, mimeType, malwareDetected);
        }

        public KycDocumentRequest(String documentType, String storagePath, String documentHash, String mimeType, long fileSize, boolean malwareDetected) {
            this(documentType, null, storagePath, documentHash, fileSize, mimeType, malwareDetected);
        }
    }

    public record SingleDocumentReviewItem(
            @NotBlank String documentId,
            @NotBlank @Pattern(regexp = "APPROVED|REJECTED|ACTION_REQUIRED") String status,
            String rejectionReason
    ) {}

    public record KycReviewRequest(
            @NotBlank @Pattern(regexp = "APPROVED|REJECTED|ACTION_REQUIRED") String decision,
            @NotBlank @Size(min = 5, max = 1000) String reviewNotes,
            List<SingleDocumentReviewItem> documentReviews
    ) {
        public KycReviewRequest(String decision, String reviewNotes) {
            this(decision, reviewNotes, List.of());
        }
    }

    public record OrganizationDto(
            UUID id,
            String organizationName,
            String registrationNumber,
            String gstin,
            String registeredAddress
    ) {}

    public record BidderRegistrationRequest(
            @NotBlank @Size(max = 50) String accountType, // PERSONAL, PROPRIETORSHIP, PARTNERSHIP, PRIVATE_LIMITED, PUBLIC_LIMITED, LLP, OTHER
            String applicantName,
            String panNumber,
            String rawAadhaar,
            String stateName,
            String cityName,
            
            // Organization Details
            String organizationName,
            String registrationNumber,
            String gstin,
            String registeredAddress,
            
            // Bank Details
            String accountHolderName,
            String accountNumber,
            String ifscCode,
            String bankName,
            String branchName,

            // Account Plan
            String planType, // FREE or PAID
            BigDecimal paymentAmount,
            Instant paymentDate,
            String paymentReference,
            String paymentMode,
            String paymentProofUrl
    ) {
        public BidderRegistrationRequest(
                String bidderType,
                String panNumber,
                String rawAadhaar,
                String organizationName,
                String registrationNumber,
                String gstin,
                String registeredAddress,
                String accountHolderName,
                String accountNumber,
                String ifscCode,
                String bankName,
                String branchName
        ) {
            this(
                "CORPORATE".equalsIgnoreCase(bidderType) ? "PRIVATE_LIMITED" : "PERSONAL",
                accountHolderName,
                panNumber,
                rawAadhaar,
                "Rajasthan",
                "Jaipur",
                organizationName,
                registrationNumber,
                gstin,
                registeredAddress,
                accountHolderName,
                accountNumber,
                ifscCode,
                bankName,
                branchName,
                "FREE",
                BigDecimal.ZERO,
                null,
                null,
                null,
                null
            );
        }
    }

    public record BidderProfileResponse(
            UUID id,
            UUID userId,
            String email,
            BidderState state,
            String bidderType,
            String accountType,
            String tempCustomerId,
            String permanentCustomerId,
            String bidderId,
            String stateName,
            String cityName,
            String planType,
            String paymentStatus,
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

    public record InternalSellerCreateRequest(
            @NotBlank String email,
            @NotBlank String mobile,
            @NotBlank String companyName,
            @NotBlank String sellerType,
            String panNumber,
            String gstin,
            String registeredAddress
    ) {}

    public record SellerProfileResponse(
            UUID id,
            UUID userId,
            SellerState state,
            String sellerType,
            String sellerCode,
            String tempSellerId,
            String companyName,
            String maskedPan,
            Instant onboardedAt,
            Instant createdAt
    ) {}
}
