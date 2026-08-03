package com.eagleauctioner.service.impl;

import com.eagleauctioner.service.AuctionWebSocketService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.listener.ChannelTopic;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;
import org.springframework.data.redis.listener.adapter.MessageListenerAdapter;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * Enterprise WebSocket message broker implementation consolidated within a single file.
 * Handles distributed broadcasts across scaled nodes using safe-fallback Redis Pub/Sub.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class AuctionWebSocketServiceImpl implements AuctionWebSocketService {

    private final WebSocketMessageDistributor distributor;
    private final ObjectMapper objectMapper;

    @Override
    public void broadcastLotUpdate(UUID lotId, Object message) {
        String destination = "/topic/lot/" + lotId;
        log.info("Requesting distributed broadcast update to lot {}", lotId);
        distribute("BROADCAST", destination, message, null);
    }

    @Override
    public void broadcastAuctionUpdate(UUID auctionId, Object message) {
        String destination = "/topic/auction/" + auctionId;
        log.info("Requesting distributed broadcast update to auction {}", auctionId);
        distribute("BROADCAST", destination, message, null);
    }

    @Override
    public void sendUserNotification(String username, Object notification) {
        String destination = "/queue/notifications";
        log.info("Requesting distributed notification to user {}", username);
        distribute("USER", destination, notification, username);
    }

    private void distribute(String type, String destination, Object payload, String targetUser) {
        try {
            String jsonPayload = objectMapper.writeValueAsString(payload);
            RedisWebSocketMessage msg = new RedisWebSocketMessage(type, destination, jsonPayload, targetUser);
            distributor.distributeMessage(msg);
        } catch (Exception e) {
            log.error("Failed to serialize WebSocket message payload for distribution", e);
        }
    }
}

/**
 * Data transfer object representing WebSocket broadcast payloads distributed across nodes.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
class RedisWebSocketMessage {
    private String type; // "BROADCAST" | "USER"
    private String destination;
    private String payload;
    private String targetUser;
}

/**
 * Distributes WebSocket updates to other replica nodes using Redis Pub/Sub.
 * If Redis is not configured (e.g., in unit tests), it falls back to direct local distribution.
 */
@Service
@Slf4j
class WebSocketMessageDistributor {

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

/**
 * Configure Redis Message Listener Container and Topic definitions for WebSocket distribution.
 * Conditional on RedisConnectionFactory to prevent context failures when Redis is excluded (e.g. in unit tests).
 */
@Configuration
@ConditionalOnBean(RedisConnectionFactory.class)
class RedisPubSubConfig {

    public static final String WEBSOCKET_TOPIC = "websocket-broadcasts";

    @Bean
    public RedisMessageListenerContainer redisContainer(RedisConnectionFactory connectionFactory,
                                                         MessageListenerAdapter listenerAdapter) {
        RedisMessageListenerContainer container = new RedisMessageListenerContainer();
        container.setConnectionFactory(connectionFactory);
        container.addMessageListener(listenerAdapter, new ChannelTopic(WEBSOCKET_TOPIC));
        return container;
    }

    @Bean
    public MessageListenerAdapter listenerAdapter(WebSocketMessageDistributor receiver) {
        return new MessageListenerAdapter(receiver, "receiveMessage");
    }
}
