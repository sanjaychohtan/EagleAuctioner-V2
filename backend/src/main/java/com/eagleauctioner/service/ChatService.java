package com.eagleauctioner.service;

import com.eagleauctioner.entity.ChatMessage;
import com.eagleauctioner.repository.ChatMessageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.util.HtmlUtils;
import org.owasp.encoder.Encode;
import org.redisson.api.RRateLimiter;
import org.redisson.api.RateIntervalUnit;
import org.redisson.api.RateType;
import org.redisson.api.RedissonClient;

import java.time.Instant;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class ChatService {

    private final ChatMessageRepository chatMessageRepository;
    @org.springframework.context.annotation.Lazy
    private final RedissonClient redissonClient;

    @Transactional
    public ChatMessage sendMessage(UUID senderId, String rawMessage) {
        if (rawMessage == null || rawMessage.trim().isEmpty()) {
            throw new IllegalArgumentException("Message text cannot be empty");
        }
        
        if (rawMessage.length() > 500) {
            throw new IllegalArgumentException("Message text exceeds maximum allowed length of 500 characters");
        }

        // Spam/Flood protection using Redisson Rate Limiter (Max 5 messages per 10 seconds per user)
        RRateLimiter rateLimiter = redissonClient.getRateLimiter("chat:rate_limit:" + senderId);
        rateLimiter.trySetRate(RateType.OVERALL, 5, 10, RateIntervalUnit.SECONDS);
        if (!rateLimiter.tryAcquire(1)) {
            log.warn("[CHAT_RATE_LIMIT] Rate limit exceeded for user: {}", senderId);
            throw new IllegalStateException("Too many messages sent. Please wait before sending another.");
        }

        // Active defense: Reject explicitly dangerous tags or structures
        String lowerMessage = rawMessage.toLowerCase();
        if (lowerMessage.contains("<script") || lowerMessage.contains("javascript:") || lowerMessage.contains("onload=")) {
            log.error("[CHAT_XSS_ATTACK] Blocked high-risk script injection from user: {}", senderId);
            throw new SecurityException("Dangerous message content detected and rejected");
        }

        // Neutralization: Sanitize text using OWASP Encoder and Spring HTML escaping
        String sanitizedText = Encode.forHtml(rawMessage);
        sanitizedText = HtmlUtils.htmlEscape(sanitizedText);

        ChatMessage chatMessage = ChatMessage.builder()
                .senderId(senderId)
                .messageText(sanitizedText)
                .timestamp(Instant.now())
                .build();

        ChatMessage savedMessage = chatMessageRepository.save(chatMessage);
        log.info("[CHAT_SECURITY] Sanitized and stored chat message. ID: {}", savedMessage.getId());
        return savedMessage;
    }
}
