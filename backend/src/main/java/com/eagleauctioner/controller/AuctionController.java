package com.eagleauctioner.controller;

import com.eagleauctioner.dto.AuctionDTOs.*;
import com.eagleauctioner.entity.User;
import com.eagleauctioner.repository.UserRepository;
import com.eagleauctioner.service.AuctionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/auctions")
@RequiredArgsConstructor
@Slf4j
public class AuctionController {

    private final AuctionService auctionService;
    private final UserRepository userRepository;

    private UUID getAuthenticatedUserId() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmailIgnoreCaseAndDeletedAtIsNull(email)
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"));
        return user.getId();
    }

    @PostMapping
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<AuctionResponse> createAuction(@Valid @RequestBody CreateAuctionRequest request) {
        return ResponseEntity.ok(auctionService.createAuction(request, getAuthenticatedUserId()));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<AuctionResponse> updateAuction(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateAuctionRequest request,
            @RequestParam UUID sellerProfileId) {
        return ResponseEntity.ok(auctionService.updateAuction(id, request, sellerProfileId, getAuthenticatedUserId()));
    }

    @PutMapping("/{id}/settings")
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<AuctionResponse> updateSettings(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateSettingsRequest request,
            @RequestParam UUID sellerProfileId) {
        return ResponseEntity.ok(auctionService.updateSettings(id, request, sellerProfileId, getAuthenticatedUserId()));
    }

    @PostMapping("/{id}/submit")
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<AuctionResponse> submitForReview(
            @PathVariable UUID id,
            @RequestParam UUID sellerProfileId) {
        return ResponseEntity.ok(auctionService.submitForReview(id, sellerProfileId, getAuthenticatedUserId()));
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AuctionResponse> approveAuction(@PathVariable UUID id) {
        return ResponseEntity.ok(auctionService.approveAuction(id, getAuthenticatedUserId().toString()));
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AuctionResponse> rejectAuction(@PathVariable UUID id) {
        return ResponseEntity.ok(auctionService.rejectAuction(id, getAuthenticatedUserId().toString()));
    }

    @PostMapping("/{id}/publish")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AuctionResponse> publishAuction(@PathVariable UUID id) {
        return ResponseEntity.ok(auctionService.publishAuction(id, getAuthenticatedUserId().toString()));
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SELLER')")
    public ResponseEntity<AuctionResponse> cancelAuction(@PathVariable UUID id) {
        return ResponseEntity.ok(auctionService.cancelAuction(id, getAuthenticatedUserId().toString()));
    }

    @PostMapping("/{id}/archive")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AuctionResponse> archiveAuction(@PathVariable UUID id) {
        return ResponseEntity.ok(auctionService.archiveAuction(id, getAuthenticatedUserId().toString()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AuctionResponse> getAuction(@PathVariable UUID id) {
        return ResponseEntity.ok(auctionService.getAuctionDetails(id));
    }

    @GetMapping
    public ResponseEntity<PaginatedAuctionResponse> listAuctions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @RequestParam(required = false) String state,
            @RequestParam(required = false) String type) {
        return ResponseEntity.ok(auctionService.listAuctions(page, size, sortBy, sortDir, state, type));
    }
}
