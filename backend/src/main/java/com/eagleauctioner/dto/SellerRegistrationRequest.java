package com.eagleauctioner.dto;

import jakarta.validation.constraints.*;

public record SellerRegistrationRequest(
        @NotBlank String sellerType, // INDIVIDUAL or CORPORATE
        @NotBlank String panNumber,
        String companyName,
        String registrationNumber,
        String gstin,
        String registeredAddress
) {}
