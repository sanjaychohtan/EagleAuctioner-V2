package com.eagleauctioner.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "chat_messages")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "sender_id", nullable = false)
    private UUID senderId;

    @Column(name = "message_text", nullable = false, length = 1000)
    private String messageText;

    @Column(name = "timestamp", nullable = false)
    private Instant timestamp;
}
