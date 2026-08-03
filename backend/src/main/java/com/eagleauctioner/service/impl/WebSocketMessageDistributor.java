package com.eagleauctioner.service.impl;

import com.eagleauctioner.dto.RedisWebSocketMessage;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

/**
 * Distributes WebSocket updates to other replica nodes using Redis Pub/Sub.
 * If Redis is not configured (e.g., in unit tests), it falls back to direct local distribution.
 */
@Service
@Slf4j
public class WebSocketMessageDistributor {

    private final StringRedisTemplate redisTemplate;
    private final SimpMessagingTemplate messagingTemplate;
    private final ObjectMapper objectMapper;

    private static final String TOPIC_NAME = "websocket-broadcasts";

    @Autowired
    public WebSocketMessageDistributor(
            @Autowired(required = false) StringRedisTemplate redisTemplate,
            SimpMessagingTemplate messagingTemplate,
            ObjectMapper objectMapper) {
        this.redisTemplate = redisTemplate;
        this.messagingTemplate = messagingTemplate;
        this.objectMapper = objectMapper;
    }

    /**
     * Publish the message to Redis Pub/Sub. If Redis is unavailable, fall back to local distribution.
     */
    public void distributeMessage(RedisWebSocketMessage message) {
        if (redisTemplate != null) {
            try {
                String json = objectMapper.writeValueAsString(message);
                redisTemplate.convertAndSend(TOPIC_NAME, json);
                log.debug("Distributed message to Redis topic {}: {}", TOPIC_NAME, json);
            } catch (Exception e) {
                log.error("Failed to distribute WebSocket message via Redis Pub/Sub", e);
                fallbackLocal(message);
            }
        } else {
            log.trace("Redis not available; falling back to direct local WebSocket routing.");
            fallbackLocal(message);
        }
    }

    /**
     * Receiver callback invoked by Redis MessageListenerAdapter.
     */
    public void receiveMessage(String messageBody) {
        try {
            log.debug("Received distributed message via Redis Pub/Sub: {}", messageBody);
            RedisWebSocketMessage msg = objectMapper.readValue(messageBody, RedisWebSocketMessage.class);
            
            if ("BROADCAST".equals(msg.getType())) {
                messagingTemplate.convertAndSend(msg.getDestination(), msg.getPayload());
            } else if ("USER".equals(msg.getType())) {
                messagingTemplate.convertAndSendToUser(msg.getTargetUser(), msg.getDestination(), msg.getPayload());
            }
        } catch (Exception e) {
            log.error("Failed to parse and route Redis Pub/Sub distributed message", e);
        }
    }

    private void fallbackLocal(RedisWebSocketMessage message) {
        try {
            if ("BROADCAST".equals(message.getType())) {
                messagingTemplate.convertAndSend(message.getDestination(), message.getPayload());
            } else if ("USER".equals(message.getType())) {
                messagingTemplate.convertAndSendToUser(message.getTargetUser(), message.getDestination(), message.getPayload());
            }
        } catch (Exception e) {
            log.error("Failed local fallback routing of WebSocket message", e);
        }
    }
}
