package com.eagleauctioner.controller;

import com.eagleauctioner.dto.FinanceDTOs.LedgerAdjustmentRequest;
import com.eagleauctioner.dto.FinanceDTOs.LedgerResponse;
import com.eagleauctioner.dto.FinanceDTOs.WalletResponse;
import com.eagleauctioner.entity.User;
import com.eagleauctioner.exception.ResourceNotFoundException;
import com.eagleauctioner.repository.UserRepository;
import com.eagleauctioner.service.LedgerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/finance")
@RequiredArgsConstructor
@Slf4j
@Validated
public class FinanceController {

    private final LedgerService ledgerService;
    private final UserRepository userRepository;

    // --- WALLET ENDPOINTS ---

    @GetMapping("/wallet")
    @PreAuthorize("hasAnyRole('BIDDER', 'SELLER', 'ADMIN', 'FINANCE')")
    public ResponseEntity<WalletResponse> getWallet() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) {
            throw new ResourceNotFoundException("Authentication not found");
        }
        
        String email = auth.getName();
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
                
        log.info("Fetching wallet for user: {}", user.getId());
        return ResponseEntity.ok(ledgerService.getWallet(user.getId()));
    }

    // --- LEDGER ENDPOINTS ---

    @GetMapping("/ledger")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE')")
    public ResponseEntity<List<LedgerResponse>> getLedger() {
        log.info("Fetching ledger entries");
        return ResponseEntity.ok(ledgerService.getLedger());
    }

    @PostMapping("/ledger")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE')")
    public ResponseEntity<LedgerResponse> addLedgerEntry(@Valid @RequestBody LedgerAdjustmentRequest request) {
        log.info("Adding manual ledger entry: {}", request);
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String actor = auth != null ? auth.getName() : "SYSTEM";
        return ResponseEntity.ok(ledgerService.addLedgerEntry(request, actor));
    }
}
