package com.eagleauctioner.test;

import com.eagleauctioner.entity.ChatMessage;
import com.eagleauctioner.repository.ChatMessageRepository;
import com.eagleauctioner.service.ChatService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.redisson.api.RRateLimiter;
import org.redisson.api.RedissonClient;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ChatServiceTest {

    @Mock
    private ChatMessageRepository chatMessageRepository;
    
    @Mock
    private RedissonClient redissonClient;
    
    @Mock
    private RRateLimiter rateLimiter;

    @InjectMocks
    private ChatService chatService;

    @BeforeEach
    void setUp() {
        lenient().when(redissonClient.getRateLimiter(anyString())).thenReturn(rateLimiter);
        lenient().when(rateLimiter.tryAcquire(1)).thenReturn(true);
    }

    @Test
    void testSendMessage_Normal_SucceedsWithEscaping() {
        UUID senderId = UUID.randomUUID();
        String messageText = "Hello guys! <Greetings>";

        when(chatMessageRepository.save(any(ChatMessage.class))).thenAnswer(inv -> inv.getArgument(0));

        ChatMessage result = chatService.sendMessage(senderId, messageText);

        assertNotNull(result);
        assertTrue(result.getMessageText().contains("&amp;lt;Greetings&amp;gt;"));
        verify(chatMessageRepository, times(1)).save(any(ChatMessage.class));
    }

    @Test
    void testSendMessage_MaliciousScript_ShouldBeRejected() {
        UUID senderId = UUID.randomUUID();
        String maliciousMessage = "<script>alert('XSS')</script>";

        assertThrows(SecurityException.class, () -> {
            chatService.sendMessage(senderId, maliciousMessage);
        });

        verify(chatMessageRepository, never()).save(any(ChatMessage.class));
    }

    @Test
    void testSendMessage_MaliciousOnload_ShouldBeRejected() {
        UUID senderId = UUID.randomUUID();
        String maliciousMessage = "<img src='x' onload='alert(1)'>";

        assertThrows(SecurityException.class, () -> {
            chatService.sendMessage(senderId, maliciousMessage);
        });

        verify(chatMessageRepository, never()).save(any(ChatMessage.class));
    }

    @Test
    void testSendMessage_LengthLimit_ShouldBeRejected() {
        UUID senderId = UUID.randomUUID();
        String longMessage = "a".repeat(501);

        assertThrows(IllegalArgumentException.class, () -> {
            chatService.sendMessage(senderId, longMessage);
        });

        verify(chatMessageRepository, never()).save(any(ChatMessage.class));
    }

    @Test
    void testSendMessage_RateLimitExceeded_ShouldBeRejected() {
        UUID senderId = UUID.randomUUID();
        String messageText = "Hello guys!";
        
        when(rateLimiter.tryAcquire(1)).thenReturn(false);

        assertThrows(IllegalStateException.class, () -> {
            chatService.sendMessage(senderId, messageText);
        });

        verify(chatMessageRepository, never()).save(any(ChatMessage.class));
    }
}
