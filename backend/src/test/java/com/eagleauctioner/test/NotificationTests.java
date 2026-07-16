package com.eagleauctioner.test;

import com.eagleauctioner.dto.NotificationDTOs.*;
import com.eagleauctioner.entity.*;
import com.eagleauctioner.enums.*;
import com.eagleauctioner.notification.provider.EmailProvider;
import com.eagleauctioner.repository.*;
import com.eagleauctioner.service.impl.NotificationServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class NotificationTests {

    @Mock
    private NotificationRepository notificationRepository;
    @Mock
    private NotificationTemplateRepository templateRepository;
    @Mock
    private NotificationPreferenceRepository preferenceRepository;
    @Mock
    private NotificationDeliveryRepository deliveryRepository;
    @Mock
    private OutboxEventRepository outboxRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private EmailProvider emailProvider;

    @InjectMocks
    private NotificationServiceImpl notificationService;

    private UUID userId;
    private NotificationTemplate template;
    private User user;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        template = NotificationTemplate.builder()
                .name("TEST_TEMPLATE")
                .channel(NotificationChannel.EMAIL)
                .notificationType(NotificationType.AUCTION_ALERT)
                .subjectTemplate("Subject {{name}}")
                .bodyTemplate("Body {{val}}")
                .isActive(true)
                .templateVersion(1)
                .build();
        user = User.builder()
                .id(userId)
                .email("test@example.com")
                .build();
    }

    @Test
    void testSendTemplatedNotification_Success() {
        when(templateRepository.findByNameAndIsActiveTrue("TEST_TEMPLATE")).thenReturn(Optional.of(template));
        when(preferenceRepository.findByUserIdAndChannelAndNotificationType(any(), any(), any())).thenReturn(Optional.empty());
        when(notificationRepository.save(any())).thenAnswer(i -> i.getArguments()[0]);

        Map<String, String> vars = new HashMap<>();
        vars.put("name", "John");
        vars.put("val", "123");

        notificationService.sendTemplatedNotification(userId, NotificationType.AUCTION_ALERT, "TEST_TEMPLATE", vars);

        verify(notificationRepository).save(argThat(n -> 
            "Subject John".equals(n.getTitle()) && 
            "Body 123".equals(n.getBody()) &&
            n.getUserId().equals(userId)
        ));
        verify(outboxRepository).save(any());
    }

    @Test
    void testSendTemplatedNotification_PreferenceDisabled() {
        when(templateRepository.findByNameAndIsActiveTrue("TEST_TEMPLATE")).thenReturn(Optional.of(template));
        NotificationPreference pref = NotificationPreference.builder().isEnabled(false).build();
        when(preferenceRepository.findByUserIdAndChannelAndNotificationType(any(), any(), any())).thenReturn(Optional.of(pref));

        notificationService.sendTemplatedNotification(userId, NotificationType.AUCTION_ALERT, "TEST_TEMPLATE", new HashMap<>());

        verify(notificationRepository, never()).save(any());
    }

    @Test
    void testProcessDelivery_Idempotency() {
        Notification notification = Notification.builder()
                .status(NotificationStatus.SENT)
                .channel(NotificationChannel.EMAIL)
                .build();
        when(notificationRepository.findByIdForUpdate(any())).thenReturn(Optional.of(notification));

        notificationService.processDelivery(UUID.randomUUID());

        verify(emailProvider, never()).sendEmail(any(), any(), any());
    }

    @Test
    void testProcessDelivery_FailureAndRetry() throws Exception {
        Notification notification = Notification.builder()
                .userId(userId)
                .status(NotificationStatus.PENDING)
                .channel(NotificationChannel.EMAIL)
                .build();
        when(notificationRepository.findByIdForUpdate(any())).thenReturn(Optional.of(notification));
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        doThrow(new RuntimeException("API Down")).when(emailProvider).sendEmail(any(), any(), any());
        when(deliveryRepository.findFirstByNotificationIdOrderByCreatedAtDesc(any())).thenReturn(Optional.empty());

        notificationService.processDelivery(UUID.randomUUID());

        assertEquals(NotificationStatus.RETRYING, notification.getStatus());
        verify(deliveryRepository).save(argThat(d -> d.getStatus() == NotificationStatus.RETRYING));
    }

    @Test
    void testProcessDelivery_RetryExhausted() throws Exception {
        Notification notification = Notification.builder()
                .userId(userId)
                .status(NotificationStatus.RETRYING)
                .channel(NotificationChannel.EMAIL)
                .build();
        when(notificationRepository.findByIdForUpdate(any())).thenReturn(Optional.of(notification));
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        doThrow(new RuntimeException("API Still Down")).when(emailProvider).sendEmail(any(), any(), any());
        
        // Mock 5 previous failures (MAX_RETRIES is 5)
        NotificationDelivery lastDelivery = NotificationDelivery.builder().retryCount(5).build();
        when(deliveryRepository.findFirstByNotificationIdOrderByCreatedAtDesc(any())).thenReturn(Optional.of(lastDelivery));

        notificationService.processDelivery(UUID.randomUUID());

        assertEquals(NotificationStatus.FAILED, notification.getStatus());
        verify(deliveryRepository).save(argThat(d -> d.getStatus() == NotificationStatus.FAILED));
    }

    @Test
    void testProcessDelivery_ProviderTimeout() throws Exception {
        Notification notification = Notification.builder()
                .userId(userId)
                .status(NotificationStatus.PENDING)
                .channel(NotificationChannel.EMAIL)
                .build();
        when(notificationRepository.findByIdForUpdate(any())).thenReturn(Optional.of(notification));
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        
        // Simulate timeout
        doThrow(new RuntimeException("Timeout")).when(emailProvider).sendEmail(any(), any(), any());
        when(deliveryRepository.findFirstByNotificationIdOrderByCreatedAtDesc(any())).thenReturn(Optional.empty());

        notificationService.processDelivery(UUID.randomUUID());

        assertEquals(NotificationStatus.RETRYING, notification.getStatus());
        verify(deliveryRepository).save(argThat(d -> d.getErrorMessage().contains("Timeout")));
    }

    @Test
    void testOwnershipVerification_MarkAsRead() {
        Notification notification = Notification.builder()
                .userId(UUID.randomUUID()) // Different user
                .build();
        when(notificationRepository.findById(any())).thenReturn(Optional.of(notification));

        assertThrows(AccessDeniedException.class, () -> 
            notificationService.markAsRead(UUID.randomUUID(), userId)
        );
    }
}
