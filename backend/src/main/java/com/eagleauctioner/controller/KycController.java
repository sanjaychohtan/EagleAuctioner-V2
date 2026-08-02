package com.eagleauctioner.controller;

import com.eagleauctioner.dto.OnboardingDTOs.*;
import com.eagleauctioner.security.CurrentUser;
import com.eagleauctioner.security.UserPrincipal;
import com.eagleauctioner.service.KycService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

import com.eagleauctioner.aspect.EnforceDataScope;
import com.eagleauctioner.enums.DataScopeType;

@RestController
@RequestMapping({"/api/v1/kyc", "/api/kyc"})
@RequiredArgsConstructor
public class KycController {

    private final KycService kycService;

    @PostMapping("/bidder/{profileId}/review")
    @PreAuthorize("hasAuthority('kyc.review')")
    @EnforceDataScope(DataScopeType.COMPANY)
    public ResponseEntity<Void> reviewBidderKyc(
            @CurrentUser UserPrincipal currentUser,
            @PathVariable UUID profileId,
            @Valid @RequestBody KycReviewRequest request) {
        kycService.reviewBidderKyc(profileId, currentUser.getId(), request);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/seller/{profileId}/review")
    @PreAuthorize("hasAuthority('kyc.review') or hasAuthority('seller.review')")
    @EnforceDataScope(DataScopeType.COMPANY)
    public ResponseEntity<Void> reviewSellerKyc(
            @CurrentUser UserPrincipal currentUser,
            @PathVariable UUID profileId,
            @Valid @RequestBody KycReviewRequest request) {
        kycService.reviewSellerKyc(profileId, currentUser.getId(), request);
        return ResponseEntity.ok().build();
    }
}
