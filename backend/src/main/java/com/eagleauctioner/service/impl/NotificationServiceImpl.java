package com.eagleauctioner.service.impl;

import com.eagleauctioner.dto.NotificationDTOs.*;
import com.eagleauctioner.entity.*;
import com.eagleauctioner.enums.*;
import com.eagleauctioner.notification.provider.*;
import com.eagleauctioner.repository.*;
import com.eagleauctioner.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final NotificationTemplateRepository templateRepository;
    private final NotificationPreferenceRepository preferenceRepository;
    private final NotificationDeliveryRepository deliveryRepository;
    private final OutboxEventRepository outboxRepository;
    private final UserRepository userRepository;

    private final EmailProvider emailProvider;
    private final SmsProvider smsProvider;
    private final WhatsAppProvider whatsAppProvider;

    private static final int MAX_RETRIES = 5;

    private final Map<NotificationChannel, CircuitBreaker> circuitBreakers = new ConcurrentHashMap<>();
    private final Map<NotificationChannel, TokenBucket> rateLimiters = new ConcurrentHashMap<>();

    // Circuit Breaker helper
    private static class CircuitBreaker {
        private final AtomicInteger failures = new AtomicInteger(0);
        private final AtomicLong lastFailureTime = new AtomicLong(0);
        private final int threshold = 5;
        private final long cooldownMs = 30000;

        public boolean isAllowed() {
            if (failures.get() < threshold) return true;
            return (System.currentTimeMillis() - lastFailureTime.get()) > cooldownMs;
        }

        public void recordSuccess() {
            failures.set(0);
        }

        public void recordFailure() {
            failures.incrementAndGet();
            lastFailureTime.set(System.currentTimeMillis());
        }
    }

    // Token Bucket for rate limiting
    private static class TokenBucket {
        private final double capacity;
        private final double refillRate;
        private double tokens;
        private long lastRefill;

        public TokenBucket(double capacity, double refillRate) {
            this.capacity = capacity;
            this.refillRate = refillRate;
            this.tokens = capacity;
            this.lastRefill = System.currentTimeMillis();
        }

        public synchronized boolean tryAcquire() {
            long now = System.currentTimeMillis();
            double delta = (now - lastRefill) / 1000.0;
            tokens = Math.min(capacity, tokens + delta * refillRate);
            lastRefill = now;
            if (tokens >= 1.0) {
                tokens -= 1.0;
                return true;
            }
            return false;
        }
    }

    @Override
    @Transactional
    public void sendTemplatedNotification(UUID userId, NotificationType type, String templateName, Map<String, String> variables) {
        log.info("Preparing notification: type={}, template={}, userId={}", type, templateName, userId);

        NotificationTemplate template = templateRepository.findByNameAndIsActiveTrue(templateName)
                .orElseThrow(() -> new IllegalArgumentException("No active template found: " + templateName));

        // Preference check
        Optional<NotificationPreference> pref = preferenceRepository.findByUserIdAndChannelAndNotificationType(userId, template.getChannel(), type);
        if (pref.isPresent() && !pref.get().isEnabled()) {
            if (type != NotificationType.OTP && type != NotificationType.SYSTEM_ALERT) {
                log.info("Notification skipped due to user preference: user={}, type={}, channel={}", userId, type, template.getChannel());
                return;
            }
        }

        String title = parseTemplate(template.getSubjectTemplate(), variables);
        String body = parseTemplate(template.getBodyTemplate(), variables);

        Notification notification = Notification.builder()
                .userId(userId)
                .channel(template.getChannel())
                .priority(determinePriority(type))
                .status(NotificationStatus.PENDING)
                .notificationType(type)
                .templateVersion(template.getTemplateVersion())
                .title(title)
                .body(body)
                .build();

        Notification saved = notificationRepository.save(notification);

        // Outbox event for async delivery
        outboxRepository.save(OutboxEvent.builder()
                .aggregateId(saved.getId())
                .aggregateType("Notification")
                .eventType("SEND_NOTIFICATION")
                .payload("{\"notificationId\":\"" + saved.getId() + "\"}")
                .createdAt(Instant.now())
                .processed(false)
                .status("PENDING")
                .build());
    }

    @Override
    @Transactional
    public void processDelivery(UUID notificationId) {
        Notification notification = notificationRepository.findByIdForUpdate(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found: " + notificationId));

        if (notification.getStatus() == NotificationStatus.SENT) return;

        NotificationChannel channel = notification.getChannel();
        CircuitBreaker cb = circuitBreakers.computeIfAbsent(channel, k -> new CircuitBreaker());
        if (!cb.isAllowed()) {
            log.warn("Circuit OPEN for channel: {}", channel);
            notification.setStatus(NotificationStatus.FAILED);
            notificationRepository.save(notification);
            return;
        }

        TokenBucket limiter = rateLimiters.computeIfAbsent(channel, k -> new TokenBucket(10, 1));
        if (!limiter.tryAcquire() && notification.getPriority() != NotificationPriority.CRITICAL) {
            log.warn("Rate limit exceeded for channel: {}", channel);
            notification.setStatus(NotificationStatus.RETRYING);
            notificationRepository.save(notification);
            return;
        }

        User user = userRepository.findById(notification.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + notification.getUserId()));

        NotificationDelivery delivery = NotificationDelivery.builder()
                .notificationId(notificationId)
                .channel(channel)
                .status(NotificationStatus.PENDING)
                .build();

        try {
            switch (channel) {
                case EMAIL -> {
                    emailProvider.sendEmail(user.getEmail(), notification.getTitle(), notification.getBody());
                    delivery.setProviderName(emailProvider.getProviderName());
                }
                case SMS -> {
                    if (user.getMobile() != null) {
                        smsProvider.sendSms(user.getMobile(), notification.getBody());
                        delivery.setProviderName(smsProvider.getProviderName());
                    } else {
                        throw new IllegalStateException("User has no mobile number");
                    }
                }
                case WHATSAPP -> {
                    if (user.getMobile() != null) {
                        whatsAppProvider.sendWhatsApp(user.getMobile(), notification.getBody());
                        delivery.setProviderName(whatsAppProvider.getProviderName());
                    } else {
                        throw new IllegalStateException("User has no mobile number");
                    }
                }
                default -> log.info("Channel {} not yet implemented with external provider", channel);
            }

            delivery.setStatus(NotificationStatus.SENT);
            delivery.setSentAt(Instant.now());
            notification.setStatus(NotificationStatus.SENT);
            cb.recordSuccess();
        } catch (Exception e) {
            log.error("Delivery failed for notification: " + notificationId, e);
            cb.recordFailure();
            delivery.setStatus(NotificationStatus.FAILED);
            delivery.setErrorMessage(e.getMessage());
            notification.setStatus(NotificationStatus.FAILED);
            
            // Logic for retry with exponential backoff
            int retries = deliveryRepository.findFirstByNotificationIdOrderByCreatedAtDesc(notificationId)
                    .map(NotificationDelivery::getRetryCount).orElse(0) + 1;
            delivery.setRetryCount(retries);
            if (retries < MAX_RETRIES) {
                delivery.setStatus(NotificationStatus.RETRYING);
                // Exponential backoff: 2^retries * 60 seconds
                long delay = (long) Math.pow(2, retries) * 60;
                delivery.setNextRetryAt(Instant.now().plusSeconds(delay));
                notification.setStatus(NotificationStatus.RETRYING);
            } else {
                log.error("Max retries exhausted for notification: {}", notificationId);
                notification.setStatus(NotificationStatus.FAILED);
            }
        }

        deliveryRepository.save(delivery);
        notificationRepository.save(notification);
    }

    @Override
    @Transactional
    public void markAsRead(UUID notificationId, UUID userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found"));
        if (!notification.getUserId().equals(userId)) {
            throw new AccessDeniedException("Unauthorized: Notification does not belong to user");
        }
        notification.setReadAt(Instant.now());
        notificationRepository.save(notification);
    }

    @Override
    @Transactional
    public void archiveNotification(UUID notificationId, UUID userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found"));
        if (!notification.getUserId().equals(userId)) {
            throw new AccessDeniedException("Unauthorized: Notification does not belong to user");
        }
        notification.setArchivedAt(Instant.now());
        notification.setStatus(NotificationStatus.ARCHIVED);
        notificationRepository.save(notification);
    }

    @Override
    @Transactional
    public void softDeleteNotification(UUID notificationId, UUID userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found"));
        if (!notification.getUserId().equals(userId)) {
            throw new AccessDeniedException("Unauthorized: Notification does not belong to user");
        }
        notification.setDeletedAt(Instant.now());
        notificationRepository.save(notification);
    }

    @Override
    @Transactional(readOnly = true)
    public long getUnreadCount(UUID userId) {
        return notificationRepository.countUnreadNotifications(userId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<NotificationResponse> getNotificationHistory(UUID userId, NotificationChannel channel, NotificationStatus status) {
        return notificationRepository.searchNotifications(userId, channel, status).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<NotificationPreferenceResponse> getUserPreferences(UUID userId) {
        return preferenceRepository.findByUserId(userId).stream()
                .map(p -> NotificationPreferenceResponse.builder()
                        .id(p.getId())
                        .channel(p.getChannel())
                        .notificationType(p.getNotificationType())
                        .isEnabled(p.isEnabled())
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void updatePreference(UUID userId, NotificationPreferenceRequest request) {
        NotificationPreference pref = preferenceRepository.findByUserIdAndChannelAndNotificationType(userId, request.getChannel(), request.getNotificationType())
                .orElse(NotificationPreference.builder()
                        .userId(userId)
                        .channel(request.getChannel())
                        .notificationType(request.getNotificationType())
                        .build());
        pref.setEnabled(request.getIsEnabled());
        preferenceRepository.save(pref);
    }

    @Scheduled(fixedDelay = 60000)
    @Override
    @Transactional
    public void retryFailedDeliveries() {
        log.debug("Checking for notifications to retry...");
        List<NotificationDelivery> retries = deliveryRepository.findDeliveriesToRetry(Instant.now());
        for (NotificationDelivery delivery : retries) {
            log.info("Retrying delivery for notification: {}", delivery.getNotificationId());
            processDelivery(delivery.getNotificationId());
        }
    }

    private String parseTemplate(String template, Map<String, String> variables) {
        if (template == null) return "";
        if (variables == null) return template;
        String parsed = template;
        for (Map.Entry<String, String> entry : variables.entrySet()) {
            parsed = parsed.replace("{{" + entry.getKey() + "}}", entry.getValue() != null ? entry.getValue() : "");
        }
        return parsed;
    }

    private NotificationPriority determinePriority(NotificationType type) {
        return switch (type) {
            case OTP -> NotificationPriority.CRITICAL;
            case WINNER_NOTIFICATION, PAYMENT_NOTIFICATION -> NotificationPriority.HIGH;
            case AUCTION_ALERT, OUTBID_ALERT -> NotificationPriority.MEDIUM;
            default -> NotificationPriority.LOW;
        };
    }

    private NotificationResponse mapToResponse(Notification n) {
        return NotificationResponse.builder()
                .id(n.getId())
                .userId(n.getUserId())
                .channel(n.getChannel())
                .priority(n.getPriority())
                .status(n.getStatus())
                .notificationType(n.getNotificationType())
                .title(n.getTitle())
                .body(n.getBody())
                .createdAt(n.getCreatedAt())
                .readAt(n.getReadAt())
                .archivedAt(n.getArchivedAt())
                .build();
    }
}
