package com.eagleauctioner.dto;

import com.eagleauctioner.enums.*;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

public class NotificationDTOs {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class NotificationResponse {
        private UUID id;
        private UUID userId;
        private NotificationChannel channel;
        private NotificationPriority priority;
        private NotificationStatus status;
        private NotificationType notificationType;
        private String title;
        private String body;
        private Instant createdAt;
        private Instant readAt;
        private Instant archivedAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class NotificationPreferenceRequest {
        @NotNull(message = "Channel is required")
        private NotificationChannel channel;
        @NotNull(message = "Notification type is required")
        private NotificationType notificationType;
        @NotNull(message = "Enabled status is required")
        private Boolean isEnabled;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class NotificationPreferenceResponse {
        private UUID id;
        private NotificationChannel channel;
        private NotificationType notificationType;
        private boolean isEnabled;
    }
}
