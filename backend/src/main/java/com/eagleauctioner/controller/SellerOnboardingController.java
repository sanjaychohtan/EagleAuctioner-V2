package com.eagleauctioner.controller;

import com.eagleauctioner.dto.*;
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

@RestController
@RequestMapping("/api/seller")
@RequiredArgsConstructor
public class SellerOnboardingController {

    private final SellerOnboardingService sellerService;

    @PostMapping("/register")
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<SellerProfileResponse> registerSeller(
            @CurrentUser UserPrincipal currentUser,
            @Valid @RequestBody SellerRegistrationRequest request) {
        return ResponseEntity.ok(sellerService.registerSeller(currentUser.getId(), request));
    }

    @PostMapping("/{profileId}/documents")
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<Void> submitDocuments(
            @CurrentUser UserPrincipal currentUser,
            @PathVariable UUID profileId,
            @Valid @RequestBody List<KycDocumentRequest> documents) {
        sellerService.submitDocuments(profileId, currentUser.getId(), documents);
        return ResponseEntity.accepted().build();
    }

    @PostMapping("/admin/review/{profileId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> reviewSeller(
            @CurrentUser UserPrincipal currentUser,
            @PathVariable UUID profileId,
            @Valid @RequestBody KycReviewRequest request) {
        sellerService.reviewSeller(profileId, currentUser.getId(), request);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/admin/search")
    @PreAuthorize("hasRole('ADMIN') or hasRole('OPS')")
    public ResponseEntity<List<SellerProfileResponse>> searchSellers(
            @RequestParam(required = false) com.eagleauctioner.enums.SellerState state,
            @RequestParam(required = false) String query) {
        return ResponseEntity.ok(sellerService.searchSellers(state, query));
    }
}
