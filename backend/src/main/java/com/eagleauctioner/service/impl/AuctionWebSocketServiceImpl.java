package com.eagleauctioner.service.impl;

import com.eagleauctioner.dto.RedisWebSocketMessage;
import com.eagleauctioner.service.AuctionWebSocketService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.UUID;

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

