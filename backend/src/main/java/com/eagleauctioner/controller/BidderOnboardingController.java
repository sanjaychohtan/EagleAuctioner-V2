package com.eagleauctioner.controller;

import com.eagleauctioner.dto.OnboardingDTOs.*;
import com.eagleauctioner.security.CurrentUser;
import com.eagleauctioner.security.UserPrincipal;
import com.eagleauctioner.service.BidderOnboardingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

import com.eagleauctioner.aspect.EnforceDataScope;
import com.eagleauctioner.enums.DataScopeType;

@RestController
@RequestMapping({"/api/v1/onboarding", "/api/onboarding"})
@RequiredArgsConstructor
public class BidderOnboardingController {

    private final BidderOnboardingService onboardingService;

    @PostMapping("/register")
    @PreAuthorize("hasAuthority('bidder.create') or hasAuthority('buyer.create') or hasRole('BIDDER') or hasRole('BUYER')")
    @EnforceDataScope(DataScopeType.BUYER)
    public ResponseEntity<BidderProfileResponse> registerBidder(
            @CurrentUser UserPrincipal currentUser,
            @Valid @RequestBody BidderRegistrationRequest request) {
        
        BidderProfileResponse response = onboardingService.registerBidder(currentUser.getId(), request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<BidderProfileResponse> getMyProfile(@CurrentUser UserPrincipal currentUser) {
        BidderProfileResponse response = onboardingService.getBidderProfileByUserId(currentUser.getId());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{profileId}/documents")
    @PreAuthorize("hasAuthority('bidder.create') or hasAuthority('kyc.submit') or hasRole('BIDDER') or hasRole('BUYER')")
    @EnforceDataScope(DataScopeType.BUYER)
    public ResponseEntity<Void> submitDocuments(
            @CurrentUser UserPrincipal currentUser,
            @PathVariable UUID profileId,
            @Valid @RequestBody List<KycDocumentRequest> documentRequests) {
        
        onboardingService.submitKycDocuments(profileId, currentUser.getId(), documentRequests);
        return ResponseEntity.accepted().build();
    }

    @PostMapping("/{profileId}/bank/verify")
    @PreAuthorize("hasAuthority('bidder.create') or hasAuthority('bidder.manage') or hasRole('BIDDER') or hasRole('BUYER')")
    @EnforceDataScope(DataScopeType.BUYER)
    public ResponseEntity<Void> verifyBankAccount(
            @CurrentUser UserPrincipal currentUser,
            @PathVariable UUID profileId) {
        onboardingService.verifyBankAccountPennyDrop(profileId, currentUser.getId());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/admin/review/{profileId}")
    @PreAuthorize("hasAuthority('kyc.review') or hasRole('ADMIN') or hasRole('SUPER_ADMIN') or hasRole('OPERATIONS') or hasRole('OPS_HEAD')")
    @EnforceDataScope(DataScopeType.COMPANY)
    public ResponseEntity<Void> reviewKyc(
            @CurrentUser UserPrincipal currentUser,
            @PathVariable UUID profileId,
            @Valid @RequestBody KycReviewRequest request) {
        
        onboardingService.reviewKyc(profileId, currentUser.getId(), request);
        return ResponseEntity.ok().build();
    }
}
