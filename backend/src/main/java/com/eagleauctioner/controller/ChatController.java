package com.eagleauctioner.controller;

import com.eagleauctioner.dto.ApiResponse;
import com.eagleauctioner.entity.ChatMessage;
import com.eagleauctioner.service.ChatService;
import com.eagleauctioner.repository.ChatMessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;
    private final ChatMessageRepository chatMessageRepository;

    @PostMapping("/send")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<ChatMessage>> sendChatMessage(
            @RequestParam("senderId") UUID senderId,
            @RequestBody String messageBody) {
        
        ChatMessage chatMessage = chatService.sendMessage(senderId, messageBody);
        return ResponseEntity.ok(ApiResponse.success("Message sent and secured successfully", chatMessage));
    }

    @GetMapping("/history")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<ChatMessage>>> getChatHistory() {
        List<ChatMessage> history = chatMessageRepository.findAllByOrderByTimestampAsc();
        return ResponseEntity.ok(ApiResponse.success("Chat history retrieved successfully", history));
    }
}
