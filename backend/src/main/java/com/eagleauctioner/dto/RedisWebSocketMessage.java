package com.eagleauctioner.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Data transfer object representing WebSocket broadcast payloads distributed across nodes via Redis Pub/Sub.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RedisWebSocketMessage {
    private String type; // "BROADCAST" | "USER"
    private String destination;
    private String payload;
    private String targetUser; // Used only when type is "USER"
}
