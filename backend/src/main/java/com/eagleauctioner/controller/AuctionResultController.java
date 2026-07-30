package com.eagleauctioner.controller;

import com.eagleauctioner.dto.ApiResponse;
import com.eagleauctioner.dto.WinnerDTOs.AuctionResultResponse;
import com.eagleauctioner.service.AuctionResultService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

import com.eagleauctioner.aspect.EnforceDataScope;
import com.eagleauctioner.enums.DataScopeType;

@RestController
@RequestMapping("/api/v1/results")
@RequiredArgsConstructor
public class AuctionResultController {

    private final AuctionResultService auctionResultService;

    @PostMapping("/lots/{id}/evaluate")
    @PreAuthorize("hasAuthority('auction.publish')")
    @EnforceDataScope(DataScopeType.AUCTION)
    public ResponseEntity<ApiResponse<AuctionResultResponse>> evaluateLot(@PathVariable("id") UUID lotId) {
        AuctionResultResponse response = auctionResultService.evaluateLotOutcome(lotId);
        return ResponseEntity.ok(ApiResponse.success("Lot outcome evaluated successfully", response));
    }

    @GetMapping("/lots/{id}")
    @PreAuthorize("hasAuthority('auction.view') or hasAuthority('bid.create')")
    @EnforceDataScope(DataScopeType.AUCTION)
    public ResponseEntity<ApiResponse<AuctionResultResponse>> getLotResult(@PathVariable("id") UUID lotId) {
        return auctionResultService.findResultByLot(lotId)
                .map(res -> ResponseEntity.ok(ApiResponse.success("Result retrieved successfully", res)))
                .orElseGet(() -> ResponseEntity.ok(ApiResponse.success("No result found/evaluated yet for this lot", null)));
    }
}
