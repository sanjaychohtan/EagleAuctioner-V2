package com.eagleauctioner.controller;

import com.eagleauctioner.dto.AuctionDTOs.*;
import com.eagleauctioner.security.CurrentUser;
import com.eagleauctioner.security.UserPrincipal;
import com.eagleauctioner.service.AuctionLotService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/auctions/{auctionId}/lots")
@RequiredArgsConstructor
@Slf4j
public class AuctionLotController {

    private final AuctionLotService auctionLotService;

    @PostMapping
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<AuctionLotResponse> createLot(
            @CurrentUser UserPrincipal currentUser,
            @PathVariable UUID auctionId,
            @Valid @RequestBody CreateLotRequest request,
            @RequestParam UUID sellerProfileId) {
        return ResponseEntity.ok(auctionLotService.createLot(auctionId, request, sellerProfileId, currentUser.getId()));
    }

    @PutMapping("/{lotId}")
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<AuctionLotResponse> updateLot(
            @CurrentUser UserPrincipal currentUser,
            @PathVariable UUID auctionId,
            @PathVariable UUID lotId,
            @Valid @RequestBody UpdateLotRequest request,
            @RequestParam UUID sellerProfileId) {
        return ResponseEntity.ok(auctionLotService.updateLot(lotId, request, sellerProfileId, currentUser.getId()));
    }

    @DeleteMapping("/{lotId}")
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<Void> deleteLot(
            @CurrentUser UserPrincipal currentUser,
            @PathVariable UUID auctionId,
            @PathVariable UUID lotId,
            @RequestParam UUID sellerProfileId) {
        auctionLotService.deleteDraftLot(lotId, sellerProfileId, currentUser.getId());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{lotId}/publish")
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<AuctionLotResponse> publishLot(
            @CurrentUser UserPrincipal currentUser,
            @PathVariable UUID auctionId,
            @PathVariable UUID lotId,
            @RequestParam UUID sellerProfileId) {
        return ResponseEntity.ok(auctionLotService.publishLot(lotId, sellerProfileId, currentUser.getId()));
    }

    @PostMapping("/sort")
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<Void> sortLots(
            @CurrentUser UserPrincipal currentUser,
            @PathVariable UUID auctionId,
            @Valid @RequestBody LotSortRequest request,
            @RequestParam UUID sellerProfileId) {
        auctionLotService.sortLots(auctionId, request, sellerProfileId, currentUser.getId());
        return ResponseEntity.ok().build();
    }
}
