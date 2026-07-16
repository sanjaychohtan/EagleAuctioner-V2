package com.eagleauctioner.dto;

import com.eagleauctioner.enums.SellerState;
import java.time.Instant;
import java.util.UUID;

public record SellerProfileResponse(
        UUID id,
        UUID userId,
        SellerState state,
        String sellerType,
        String maskedPan,
        Instant onboardedAt,
        Instant createdAt
) {}
