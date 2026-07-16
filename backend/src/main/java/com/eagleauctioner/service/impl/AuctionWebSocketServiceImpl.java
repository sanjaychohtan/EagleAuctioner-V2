package com.eagleauctioner.service.impl;

import com.eagleauctioner.service.AuctionWebSocketService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class AuctionWebSocketServiceImpl implements AuctionWebSocketService {

    private final SimpMessagingTemplate messagingTemplate;

    @Override
    public void broadcastLotUpdate(UUID lotId, Object message) {
        String destination = "/topic/lot/" + lotId;
        log.info("Broadcasting update to lot {}", lotId);
        log.debug("Broadcasting update to lot {}: {}", lotId, message);
        messagingTemplate.convertAndSend(destination, message);
    }

    @Override
    public void broadcastAuctionUpdate(UUID auctionId, Object message) {
        String destination = "/topic/auction/" + auctionId;
        log.info("Broadcasting update to auction {}", auctionId);
        log.debug("Broadcasting update to auction {}: {}", auctionId, message);
        messagingTemplate.convertAndSend(destination, message);
    }

    @Override
    public void sendUserNotification(String username, Object notification) {
        String destination = "/queue/notifications";
        log.info("Sending notification to user {}", username);
        log.debug("Sending notification to user {}: {}", username, notification);
        messagingTemplate.convertAndSendToUser(username, destination, notification);
    }
}
