package com.eagleauctioner.dto;

import jakarta.validation.constraints.*;

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
