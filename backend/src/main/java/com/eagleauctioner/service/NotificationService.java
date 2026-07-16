package com.eagleauctioner.service;

import com.eagleauctioner.dto.NotificationDTOs.*;
import com.eagleauctioner.enums.NotificationChannel;
import com.eagleauctioner.enums.NotificationStatus;
import com.eagleauctioner.enums.NotificationType;

import java.util.List;
import java.util.Map;
import java.util.UUID;

public interface NotificationService {
    void sendTemplatedNotification(UUID userId, NotificationType type, String templateName, Map<String, String> variables);
    void processDelivery(UUID notificationId);
    void markAsRead(UUID notificationId, UUID userId);
    void archiveNotification(UUID notificationId, UUID userId);
    void softDeleteNotification(UUID notificationId, UUID userId);
    long getUnreadCount(UUID userId);
    List<NotificationResponse> getNotificationHistory(UUID userId, NotificationChannel channel, NotificationStatus status);
    
    // Preferences
    List<NotificationPreferenceResponse> getUserPreferences(UUID userId);
    void updatePreference(UUID userId, NotificationPreferenceRequest request);

    // Maintenance
    void retryFailedDeliveries();
}
