package com.eagleauctioner.controller;

import com.eagleauctioner.enums.ClosingStatus;
import com.eagleauctioner.dto.FinancialClosingDTOs.ClosePeriodRequest;
import com.eagleauctioner.dto.FinancialClosingDTOs.ClosingPeriodResponse;
import com.eagleauctioner.entity.User;
import com.eagleauctioner.exception.ResourceNotFoundException;
import com.eagleauctioner.repository.UserRepository;
import com.eagleauctioner.service.FinancialClosingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/financial-closing")
@RequiredArgsConstructor
public class FinancialClosingController {

    private final FinancialClosingService closingService;
    private final UserRepository userRepository;

    @PostMapping("/initiate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ClosingPeriodResponse> initiatePeriod(
            @RequestParam Integer year, 
            @RequestParam Integer month) {
        UUID userId = getAuthenticatedUserId();
        return ResponseEntity.ok(closingService.initiatePeriod(year, month, userId));
    }

    @PostMapping("/{id}/close")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ClosingPeriodResponse> closePeriod(
            @PathVariable UUID id,
            @RequestBody ClosePeriodRequest request) {
        UUID userId = getAuthenticatedUserId();
        return ResponseEntity.ok(closingService.closePeriod(id, userId));
    }

    @PostMapping("/{id}/transition")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ClosingPeriodResponse> transitionPeriod(
            @PathVariable UUID id,
            @RequestParam ClosingStatus targetStatus) {
        UUID userId = getAuthenticatedUserId();
        return ResponseEntity.ok(closingService.transitionTo(id, targetStatus, userId, "ADMIN"));
    }

    private UUID getAuthenticatedUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) {
            return UUID.randomUUID(); // Fallback for testing, but should be authenticated
        }
        String email = auth.getName();
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
        return user.getId();
    }
}
