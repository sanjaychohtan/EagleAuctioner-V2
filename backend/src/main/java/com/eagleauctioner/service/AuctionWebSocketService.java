package com.eagleauctioner.service;

import java.util.UUID;

public interface AuctionWebSocketService {
    void broadcastLotUpdate(UUID lotId, Object message);
    void broadcastAuctionUpdate(UUID auctionId, Object message);
    void sendUserNotification(String username, Object notification);
}
