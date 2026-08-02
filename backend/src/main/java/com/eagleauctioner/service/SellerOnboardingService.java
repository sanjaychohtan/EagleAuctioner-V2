package com.eagleauctioner.service;

import com.eagleauctioner.dto.OnboardingDTOs.*;
import com.eagleauctioner.enums.SellerState;
import java.util.List;
import java.util.UUID;

public interface SellerOnboardingService {
    SellerProfileResponse registerSeller(UUID userId, SellerRegistrationRequest request);
    void submitDocuments(UUID profileId, UUID userId, List<KycDocumentRequest> documents);
    void reviewSeller(UUID profileId, UUID reviewerId, KycReviewRequest request);
    List<SellerProfileResponse> searchSellers(SellerState state, String query);
}
