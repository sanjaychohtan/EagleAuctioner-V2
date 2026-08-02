package com.eagleauctioner.controller;

import com.eagleauctioner.dto.*;
import com.eagleauctioner.dto.OnboardingDTOs.*;
import com.eagleauctioner.security.CurrentUser;
import com.eagleauctioner.security.UserPrincipal;
import com.eagleauctioner.service.SellerOnboardingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

import com.eagleauctioner.aspect.EnforceDataScope;
import com.eagleauctioner.enums.DataScopeType;

@RestController
@RequestMapping({"/api/v1/sellers", "/api/seller"})
@RequiredArgsConstructor
public class SellerOnboardingController {

    private final SellerOnboardingService sellerService;

    @PostMapping("/register")
    @PreAuthorize("hasAuthority('seller.create') or hasAuthority('seller.manage') or hasRole('SELLER')")
    @EnforceDataScope(DataScopeType.COMPANY)
    public ResponseEntity<SellerProfileResponse> registerSeller(
            @CurrentUser UserPrincipal currentUser,
            @Valid @RequestBody SellerRegistrationRequest request) {
        return ResponseEntity.ok(sellerService.registerSeller(currentUser.getId(), request));
    }

    @PostMapping("/{profileId}/documents")
    @PreAuthorize("hasAuthority('seller.create') or hasAuthority('kyc.submit') or hasRole('SELLER')")
    @EnforceDataScope(DataScopeType.COMPANY)
    public ResponseEntity<Void> submitDocuments(
            @CurrentUser UserPrincipal currentUser,
            @PathVariable UUID profileId,
            @Valid @RequestBody List<KycDocumentRequest> documents) {
        sellerService.submitDocuments(profileId, currentUser.getId(), documents);
        return ResponseEntity.accepted().build();
    }

    @PostMapping("/admin/review/{profileId}")
    @PreAuthorize("hasAuthority('seller.review') or hasAuthority('kyc.review')")
    @EnforceDataScope(DataScopeType.COMPANY)
    public ResponseEntity<Void> reviewSeller(
            @CurrentUser UserPrincipal currentUser,
            @PathVariable UUID profileId,
            @Valid @RequestBody KycReviewRequest request) {
        sellerService.reviewSeller(profileId, currentUser.getId(), request);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/admin/search")
    @PreAuthorize("hasAuthority('seller.view') or hasAuthority('kyc.review')")
    @EnforceDataScope(DataScopeType.COMPANY)
    public ResponseEntity<List<SellerProfileResponse>> searchSellers(
            @RequestParam(required = false) com.eagleauctioner.enums.SellerState state,
            @RequestParam(required = false) String query) {
        return ResponseEntity.ok(sellerService.searchSellers(state, query));
    }
}
