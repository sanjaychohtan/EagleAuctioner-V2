package com.eagleauctioner.controller;

import com.eagleauctioner.dto.NotificationDTOs.*;
import com.eagleauctioner.entity.User;
import com.eagleauctioner.enums.NotificationChannel;
import com.eagleauctioner.enums.NotificationStatus;
import com.eagleauctioner.exception.ResourceNotFoundException;
import com.eagleauctioner.repository.UserRepository;
import com.eagleauctioner.service.NotificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

import com.eagleauctioner.aspect.EnforceDataScope;
import com.eagleauctioner.enums.DataScopeType;

@RestController
@RequestMapping({"/api/v1/notifications", "/api/notifications"})
@RequiredArgsConstructor
@Slf4j
public class NotificationController {

    private final NotificationService notificationService;
    private final UserRepository userRepository;

    @GetMapping
    @PreAuthorize("hasAuthority('notification.view') or isAuthenticated()")
    @EnforceDataScope(DataScopeType.BUYER)
    public ResponseEntity<List<NotificationResponse>> getMyNotifications(
            @RequestParam(required = false) NotificationChannel channel,
            @RequestParam(required = false) NotificationStatus status) {
        UUID userId = getCurrentUserId();
        return ResponseEntity.ok(notificationService.getNotificationHistory(userId, channel, status));
    }

    @GetMapping("/unread-count")
    @PreAuthorize("hasAuthority('notification.view') or isAuthenticated()")
    @EnforceDataScope(DataScopeType.BUYER)
    public ResponseEntity<Long> getUnreadCount() {
        return ResponseEntity.ok(notificationService.getUnreadCount(getCurrentUserId()));
    }

    @PostMapping("/{id}/read")
    @PreAuthorize("hasAuthority('notification.view') or isAuthenticated()")
    @EnforceDataScope(DataScopeType.BUYER)
    public ResponseEntity<Void> markAsRead(@PathVariable UUID id) {
        notificationService.markAsRead(id, getCurrentUserId());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/archive")
    @PreAuthorize("hasAuthority('notification.manage') or isAuthenticated()")
    @EnforceDataScope(DataScopeType.BUYER)
    public ResponseEntity<Void> archive(@PathVariable UUID id) {
        notificationService.archiveNotification(id, getCurrentUserId());
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('notification.manage') or isAuthenticated()")
    @EnforceDataScope(DataScopeType.BUYER)
    public ResponseEntity<Void> softDelete(@PathVariable UUID id) {
        notificationService.softDeleteNotification(id, getCurrentUserId());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/preferences")
    @PreAuthorize("hasAuthority('notification.view') or isAuthenticated()")
    @EnforceDataScope(DataScopeType.BUYER)
    public ResponseEntity<List<NotificationPreferenceResponse>> getMyPreferences() {
        return ResponseEntity.ok(notificationService.getUserPreferences(getCurrentUserId()));
    }

    @PutMapping("/preferences")
    @PreAuthorize("hasAuthority('notification.manage') or isAuthenticated()")
    @EnforceDataScope(DataScopeType.BUYER)
    public ResponseEntity<Void> updatePreference(@Valid @RequestBody NotificationPreferenceRequest request) {
        notificationService.updatePreference(getCurrentUserId(), request);
        return ResponseEntity.ok().build();
    }

    private UUID getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) throw new ResourceNotFoundException("Not authenticated");
        String email = auth.getName();
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
        return user.getId();
    }
}
