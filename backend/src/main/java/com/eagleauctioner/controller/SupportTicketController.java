package com.eagleauctioner.controller;

import com.eagleauctioner.aspect.EnforceDataScope;
import com.eagleauctioner.entity.SupportTicket;
import com.eagleauctioner.entity.User;
import com.eagleauctioner.enums.DataScopeType;
import com.eagleauctioner.exception.ResourceNotFoundException;
import com.eagleauctioner.repository.SupportTicketRepository;
import com.eagleauctioner.repository.UserRepository;
import com.eagleauctioner.service.AdminOperationsService;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping({"/api/v1/support/tickets", "/api/support/tickets"})
@RequiredArgsConstructor
@Slf4j
public class SupportTicketController {

    private final AdminOperationsService adminOperationsService;
    private final SupportTicketRepository supportTicketRepository;
    private final UserRepository userRepository;

    @PostMapping
    @PreAuthorize("hasAuthority('support.ticket.create') or hasRole('BIDDER') or hasRole('SELLER') or hasRole('ADMIN') or hasRole('SUPPORT')")
    @EnforceDataScope(DataScopeType.BUYER)
    public ResponseEntity<SupportTicket> createTicket(
            @RequestParam @NotBlank(message = "Title is required") @Size(max = 200) String title,
            @RequestParam @NotBlank(message = "Description is required") String description,
            @RequestParam @NotBlank(message = "Category is required") String category,
            @RequestParam(defaultValue = "MEDIUM") String priority) {
        UUID userId = getCurrentUserId();
        log.info("Creating support ticket for user: {}", userId);
        return ResponseEntity.ok(adminOperationsService.createSupportTicket(userId, title, description, category, priority));
    }

    @GetMapping
    @PreAuthorize("hasAuthority('support.ticket.view') or hasRole('SUPPORT') or hasRole('ADMIN') or hasRole('BIDDER') or hasRole('SELLER')")
    @EnforceDataScope(DataScopeType.COMPANY)
    public ResponseEntity<List<SupportTicket>> getTickets(
            @RequestParam(required = false) String status) {
        if (status != null && !status.isBlank()) {
            return ResponseEntity.ok(supportTicketRepository.findByStatus(status.toUpperCase().trim()));
        }
        UUID userId = getCurrentUserId();
        return ResponseEntity.ok(supportTicketRepository.findByUserId(userId));
    }

    @GetMapping("/{ticketId}")
    @PreAuthorize("hasAuthority('support.ticket.view') or hasRole('SUPPORT') or hasRole('ADMIN') or hasRole('BIDDER') or hasRole('SELLER')")
    @EnforceDataScope(DataScopeType.COMPANY)
    public ResponseEntity<SupportTicket> getTicketById(@PathVariable UUID ticketId) {
        return ResponseEntity.ok(supportTicketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Support Ticket not found: " + ticketId)));
    }

    @PostMapping("/{ticketId}/status")
    @PreAuthorize("hasAuthority('support.ticket.update') or hasAuthority('support.ticket.close') or hasRole('SUPPORT') or hasRole('ADMIN')")
    @EnforceDataScope(DataScopeType.COMPANY)
    public ResponseEntity<SupportTicket> updateTicketStatus(
            @PathVariable UUID ticketId,
            @RequestParam @NotBlank @Pattern(regexp = "^(OPEN|IN_PROGRESS|RESOLVED|CLOSED)$", message = "Invalid support ticket status") String status) {
        UUID agentId = getCurrentUserId();
        log.info("Updating support ticket {} status to {} by agent {}", ticketId, status, agentId);
        return ResponseEntity.ok(adminOperationsService.updateTicketStatus(ticketId, status, agentId));
    }

    private UUID getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) throw new ResourceNotFoundException("Not authenticated");
        String email = auth.getName();
        try {
            return UUID.fromString(email);
        } catch (Exception ex) {
            User user = userRepository.findByEmailIgnoreCase(email)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
            return user.getId();
        }
    }
}
