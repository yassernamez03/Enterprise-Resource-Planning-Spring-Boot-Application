package com.secureops.service;

import com.secureops.dto.MessageDto;
import com.secureops.dto.TypingStatusDto;
import com.secureops.entity.Message;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
public class WebSocketService {

    private final SimpMessagingTemplate messagingTemplate;

    public WebSocketService(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    /**
     * Broadcast a message to all users subscribed to a chat
     * 
     * @param chatId     The chat ID
     * @param message    The message entity
     * @param messageDto The message DTO to broadcast
     */
    public void broadcastMessage(Long chatId, Message message, MessageDto messageDto) {
        messagingTemplate.convertAndSend("/topic/chat/" + chatId, messageDto);
    }

    /**
     * Broadcast a message read status update
     * 
     * @param chatId     The chat ID
     * @param messageDto The updated message DTO
     */
    public void broadcastMessageRead(Long chatId, MessageDto messageDto) {
        messagingTemplate.convertAndSend("/topic/chat/" + chatId + "/read", messageDto);
    }

    /**
     * Send a message to a specific user
     * 
     * @param userId     The target user's ID
     * @param messageDto The message DTO to send
     */
    public void sendMessageToUser(Long userId, MessageDto messageDto) {
        messagingTemplate.convertAndSendToUser(
                userId.toString(),
                "/queue/messages",
                messageDto);
    }

    /**
     * Send a typing indicator to a chat
     * 
     * @param chatId   The chat ID
     * @param userId   The user who is typing
     * @param isTyping Whether the user is typing or stopped typing
     */
    public void broadcastTypingStatus(Long chatId, TypingStatusDto typingStatus) {
        messagingTemplate.convertAndSend("/topic/chat/" + chatId + "/typing", typingStatus);
    }

    // Inner class for typing status
    private static class TypingStatus {
        private Long userId;
        private boolean typing;

        public TypingStatus(Long userId, boolean typing) {
            this.userId = userId;
            this.typing = typing;
        }

        public Long getUserId() {
            return userId;
        }

        public void setUserId(Long userId) {
            this.userId = userId;
        }

        public boolean isTyping() {
            return typing;
        }

        public void setTyping(boolean typing) {
            this.typing = typing;
        }
    }
}