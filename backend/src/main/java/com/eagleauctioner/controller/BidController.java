package com.eagleauctioner.controller;

import com.eagleauctioner.dto.ApiResponse;
import com.eagleauctioner.entity.BidderProfile;
import com.eagleauctioner.repository.BidderProfileRepository;
import com.eagleauctioner.security.CurrentUser;
import com.eagleauctioner.security.UserPrincipal;
import com.eagleauctioner.entity.Bid;
import com.eagleauctioner.entity.BidHistory;
import com.eagleauctioner.service.BidService;
import com.eagleauctioner.dto.BidDTOs.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/lots")
@RequiredArgsConstructor
public class BidController {

    private final BidService bidService;
    private final BidderProfileRepository bidderProfileRepository;

    @PostMapping("/{lotId}/bid")
    @PreAuthorize("hasRole('BIDDER')")
    public ResponseEntity<ApiResponse<BidResponse>> placeBid(
            @CurrentUser UserPrincipal currentUser,
            @PathVariable UUID lotId,
            @Valid @RequestBody PlaceBidRequest request,
            HttpServletRequest servletRequest) {
        BidderProfile bidder = resolveBidderProfile(currentUser.getId());
        String ipAddress = resolveClientIp(servletRequest);
        String userAgent = servletRequest.getHeader("User-Agent");

        Bid bid = bidService.placeBid(
                lotId,
                bidder.getId(),
                request.getBidAmount(),
                ipAddress,
                userAgent
        );
        BidResponse response = mapToBidResponse(bid);
        return ResponseEntity.ok(ApiResponse.success("Bid placed successfully", response));
    }

    @PostMapping("/{lotId}/bid/sealed")
    @PreAuthorize("hasRole('BIDDER')")
    public ResponseEntity<ApiResponse<BidResponse>> placeSealedBid(
            @CurrentUser UserPrincipal currentUser,
            @PathVariable UUID lotId,
            @Valid @RequestBody PlaceSealedBidRequest request,
            HttpServletRequest servletRequest) {
        BidderProfile bidder = resolveBidderProfile(currentUser.getId());
        String ipAddress = resolveClientIp(servletRequest);
        String userAgent = servletRequest.getHeader("User-Agent");

        Bid bid = bidService.placeBid(
                lotId,
                bidder.getId(),
                request.getBidAmount(),
                ipAddress,
                userAgent
        );
        BidResponse response = mapToBidResponse(bid);
        return ResponseEntity.ok(ApiResponse.success("Sealed bid placed successfully", response));
    }

    @GetMapping("/{lotId}/highest")
    @PreAuthorize("hasAnyRole('BIDDER', 'SELLER', 'ADMIN')")
    public ResponseEntity<ApiResponse<BidResponse>> getHighestBid(@PathVariable UUID lotId) {
        Bid bid = bidService.findHighestBid(lotId).orElse(null);
        BidResponse response = bid != null ? mapToBidResponse(bid) : null;
        return ResponseEntity.ok(ApiResponse.success("Highest bid retrieved", response));
    }

    @GetMapping("/{lotId}/history")
    @PreAuthorize("hasAnyRole('BIDDER', 'SELLER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<BidHistoryResponse>>> getBidHistory(@PathVariable UUID lotId) {
        List<BidHistory> history = bidService.getBidHistory(lotId);
        List<BidHistoryResponse> response = history.stream().map(this::mapToHistoryResponse).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success("Bid history retrieved", response));
    }

    @GetMapping("/{lotId}/rank")
    @PreAuthorize("hasRole('BIDDER')")
    public ResponseEntity<ApiResponse<RankStatusResponse>> getMyRank(
            @CurrentUser UserPrincipal currentUser,
            @PathVariable UUID lotId) {
        BidderProfile bidder = resolveBidderProfile(currentUser.getId());
        RankStatusResponse response = bidService.getMyRank(lotId, bidder.getId());
        return ResponseEntity.ok(ApiResponse.success("Rank status retrieved", response));
    }

    @PostMapping("/{lotId}/sealed/open")
    @PreAuthorize("hasAnyRole('SELLER', 'ADMIN')")
    public ResponseEntity<ApiResponse<SealedBidOpeningResponse>> openSealedBids(
            @CurrentUser UserPrincipal currentUser,
            @PathVariable UUID lotId) {
        SealedBidOpeningResponse response = bidService.openSealedBids(lotId, currentUser.getId().toString());
        return ResponseEntity.ok(ApiResponse.success("Sealed bids opened successfully", response));
    }

    private BidderProfile resolveBidderProfile(UUID userId) {
        return bidderProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalStateException("User does not have an active bidder profile"));
    }

    private String resolveClientIp(HttpServletRequest request) {
        String ipForwarded = request.getHeader("X-Forwarded-For");
        if (ipForwarded != null && !ipForwarded.isEmpty()) {
            return ipForwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
    
    private BidResponse mapToBidResponse(Bid bid) {
        return BidResponse.builder()
            .id(bid.getId())
            .lotId(bid.getAuctionLot().getId())
            .bidAmount(bid.getBidAmount())
            .bidTime(bid.getBidTime())
            .bidStatus(bid.getBidStatus().name())
            .isAutoBid(bid.getIsAutoBid())
            .anonymousCode(bid.getAnonymousBidderCode())
            .build();
    }
    
    private BidHistoryResponse mapToHistoryResponse(BidHistory history) {
        return BidHistoryResponse.builder()
            .id(history.getId())
            .lotId(history.getAuctionLot().getId())
            .amount(history.getNewHighestBid())
            .timestamp(history.getTimestamp())
            .anonymousCode(history.getWinnerAfter() != null ? "BIDDER-" + history.getWinnerAfter().getId().toString().substring(0, 8).toUpperCase() : null)
            .isAutoBid(false)
            .build();
    }
}
