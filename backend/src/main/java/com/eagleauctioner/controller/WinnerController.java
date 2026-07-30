package com.eagleauctioner.controller;

import com.eagleauctioner.dto.ApiResponse;
import com.eagleauctioner.dto.WinnerDTOs.WinnerRequest;
import com.eagleauctioner.dto.WinnerDTOs.WinnerResponse;
import com.eagleauctioner.security.CurrentUser;
import com.eagleauctioner.security.UserPrincipal;
import com.eagleauctioner.service.WinnerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

import com.eagleauctioner.aspect.EnforceDataScope;
import com.eagleauctioner.enums.DataScopeType;

@RestController
@RequestMapping("/api/v1/winners")
@RequiredArgsConstructor
public class WinnerController {

    private final WinnerService winnerService;

    @PostMapping("/{winnerId}/approve")
    @PreAuthorize("hasAuthority('auction.publish')")
    @EnforceDataScope(DataScopeType.AUCTION)
    public ResponseEntity<ApiResponse<WinnerResponse>> approveWinner(
            @CurrentUser UserPrincipal currentUser,
            @PathVariable UUID winnerId,
            @RequestParam(required = false, defaultValue = "Approved under-reserve bid.") String remarks) {

        boolean isAdmin = currentUser.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ADMIN") || a.getAuthority().equals("auction.publish"));

        WinnerResponse response = winnerService.approveUnderReserveWinner(
                winnerId, 
                remarks, 
                currentUser.getId(), 
                currentUser.getUsername() != null ? currentUser.getUsername() : "SYSTEM_USER", 
                isAdmin
        );
        return ResponseEntity.ok(ApiResponse.success("Winner approved successfully", response));
    }

    @PostMapping("/{winnerId}/reject")
    @PreAuthorize("hasAuthority('auction.publish')")
    @EnforceDataScope(DataScopeType.AUCTION)
    public ResponseEntity<ApiResponse<WinnerResponse>> rejectWinner(
            @CurrentUser UserPrincipal currentUser,
            @PathVariable UUID winnerId,
            @RequestParam(required = false, defaultValue = "Rejected under-reserve bid.") String remarks) {

        boolean isAdmin = currentUser.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ADMIN") || a.getAuthority().equals("auction.publish"));

        WinnerResponse response = winnerService.rejectUnderReserveWinner(
                winnerId, 
                remarks, 
                currentUser.getId(), 
                currentUser.getUsername() != null ? currentUser.getUsername() : "SYSTEM_USER", 
                isAdmin
        );
        return ResponseEntity.ok(ApiResponse.success("Winner rejected successfully", response));
    }

    @PostMapping("/override")
    @PreAuthorize("hasAuthority('auction.publish')")
    @EnforceDataScope(DataScopeType.AUCTION)
    public ResponseEntity<ApiResponse<WinnerResponse>> manualOverride(
            @CurrentUser UserPrincipal currentUser,
            @Valid @RequestBody WinnerRequest request) {

        WinnerResponse response = winnerService.manualOverrideWinner(
                request, 
                currentUser.getUsername() != null ? currentUser.getUsername() : "ADMIN_USER",
                currentUser.getId()
        );
        return ResponseEntity.ok(ApiResponse.success("Winner manually overridden successfully", response));
    }
}
