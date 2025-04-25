package com.secureops.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;

import com.secureops.dto.TextMessageDto;
import com.secureops.dto.TypingStatusDto;
import com.secureops.entity.User;
import com.secureops.repository.UserRepository;
import com.secureops.service.MessageService;
import com.secureops.service.WebSocketService;

@Controller
public class WebSocketMessageController {

    private final MessageService messageService;
    private final UserRepository userRepository;
    private final WebSocketService webSocketService;

    public WebSocketMessageController(MessageService messageService, UserRepository userRepository,
            WebSocketService webSocketService) {
        this.messageService = messageService;
        this.userRepository = userRepository;
        this.webSocketService = webSocketService;
    }

    /**
     * Handle text message sent via WebSocket
     */
    @MessageMapping("/chat/{chatId}/sendMessage")
    public void sendTextMessage(@DestinationVariable Long chatId,
            @Payload TextMessageDto messageDto,
            SimpMessageHeaderAccessor headerAccessor) {
        try {
            System.out.println("WebSocket message received for chat " + chatId + ": " + messageDto);

            // Get user from WebSocket session
            if (headerAccessor.getUser() != null) {
                String email = headerAccessor.getUser().getName();
                System.out.println("Message sent by user: " + email);

                // Find user by email
                User user = userRepository.findByEmail(email)
                        .orElseThrow(() -> new RuntimeException("User not found"));

                System.out.println("Found user ID: " + user.getId());

                // Call the message service with the user ID
                messageService.sendTextMessage(messageDto, chatId, user.getId());
            } else {
                System.err.println("Error: No user information in WebSocket session");
            }
        } catch (Exception e) {
            System.err.println("Error processing WebSocket message: " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * Handle typing status update
     */
    @MessageMapping("/chat/{chatId}/typing")
    public void updateTypingStatus(@DestinationVariable Long chatId,
            @Payload TypingStatusRequest request,
            SimpMessageHeaderAccessor headerAccessor) {
        try {
            if (headerAccessor.getUser() != null) {
                String email = headerAccessor.getUser().getName();
                User user = userRepository.findByEmail(email).orElse(null);

                if (user != null) {
                    // Create a typing status DTO
                    TypingStatusDto typingStatusDto = new TypingStatusDto();
                    typingStatusDto.setUserId(user.getId());
                    typingStatusDto.setTyping(request.isTyping());

                    // Broadcast the typing status to all users in the chat
                    webSocketService.broadcastTypingStatus(chatId, typingStatusDto);
                }
            }
        } catch (Exception e) {
            System.err.println("Error handling typing status: " + e.getMessage());
            e.printStackTrace();
        }
    }

    @MessageMapping("/chat/markAsRead")
    public void markMessageAsRead(@Payload ReadStatusRequest request,
            SimpMessageHeaderAccessor headerAccessor) {
        try {
            if (headerAccessor.getUser() != null) {
                String email = headerAccessor.getUser().getName();
                User user = userRepository.findByEmail(email).orElse(null);

                if (user != null && request.getMessageId() != null) {
                    // Mark the message as read
                    messageService.markAsRead(request.getMessageId());
                }
            }
        } catch (Exception e) {
            System.err.println("Error marking message as read: " + e.getMessage());
            e.printStackTrace();
        }
    }

    @PutMapping("/{messageId}/read")
    public ResponseEntity<Void> markMessageAsRead(@PathVariable Long messageId) {
        messageService.markAsRead(messageId);
        return ResponseEntity.ok().build();
    }

    // Helper class for typing status
    public static class TypingStatusRequest {
        private boolean typing;

        public boolean isTyping() {
            return typing;
        }

        public void setTyping(boolean typing) {
            this.typing = typing;
        }
    }

    // Add this inside your WebSocketMessageController class
    public static class ReadStatusRequest {
        private Long messageId;

        public Long getMessageId() {
            return messageId;
        }

        public void setMessageId(Long messageId) {
            this.messageId = messageId;
        }
    }
}