package com.secureops.service;

import com.secureops.dto.MessageDto;
import com.secureops.dto.TypingStatusDto;
import com.secureops.entity.Message;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import jakarta.servlet.http.HttpServletRequest;

@Service
public class WebSocketService {

    private static final Logger logger = LoggerFactory.getLogger(WebSocketService.class);
    private static final Logger securityLogger = LoggerFactory.getLogger("com.secureops.security");

    private final SimpMessagingTemplate messagingTemplate;

    public WebSocketService(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
        logger.info("WebSocketService initialized");
    }

    /**
     * Broadcast a message to all users subscribed to a chat
     * 
     * @param chatId     The chat ID
     * @param message    The message entity
     * @param messageDto The message DTO to broadcast
     */
    public void broadcastMessage(Long chatId, Message message, MessageDto messageDto) {
        String clientIp = getClientIp();
        logger.debug("Broadcasting message to chat ID: {} from IP: {}", chatId, clientIp);

        try {
            if (chatId == null || message == null || messageDto == null) {
                logger.warn("Invalid parameters for broadcasting message - chatId: {}, message: {}, messageDto: {} from IP: {}", 
                        chatId, message, messageDto, clientIp);
                return;
            }

            messagingTemplate.convertAndSend("/topic/chat/" + chatId, messageDto);
            logger.info("Message broadcasted successfully to chat ID: {} from IP: {}", chatId, clientIp);

        } catch (Exception ex) {
            logger.error("Error broadcasting message to chat ID: {} from IP: {}", chatId, clientIp, ex);
            securityLogger.error("Error broadcasting message - chatId: {}, IP: {}, Error: {}", chatId, clientIp, ex.getMessage());
        }
    }

    /**
     * Broadcast a message read status update
     * 
     * @param chatId     The chat ID
     * @param messageDto The updated message DTO
     */
    public void broadcastMessageRead(Long chatId, MessageDto messageDto) {
        String clientIp = getClientIp();
        logger.debug("Broadcasting message read status to chat ID: {} from IP: {}", chatId, clientIp);

        try {
            if (chatId == null || messageDto == null) {
                logger.warn("Invalid parameters for broadcasting read status - chatId: {}, messageDto: {} from IP: {}", 
                        chatId, messageDto, clientIp);
                return;
            }

            messagingTemplate.convertAndSend("/topic/chat/" + chatId + "/read", messageDto);
            logger.info("Message read status broadcasted successfully to chat ID: {} from IP: {}", chatId, clientIp);

        } catch (Exception ex) {
            logger.error("Error broadcasting message read status to chat ID: {} from IP: {}", chatId, clientIp, ex);
            securityLogger.error("Error broadcasting read status - chatId: {}, IP: {}, Error: {}", chatId, clientIp, ex.getMessage());
        }
    }

    /**
     * Send a message to a specific user
     * 
     * @param userId     The target user's ID
     * @param messageDto The message DTO to send
     */
    public void sendMessageToUser(Long userId, MessageDto messageDto) {
        String clientIp = getClientIp();
        logger.debug("Sending message to user ID: {} from IP: {}", userId, clientIp);

        try {
            if (userId == null || messageDto == null) {
                logger.warn("Invalid parameters for sending message - userId: {}, messageDto: {} from IP: {}", 
                        userId, messageDto, clientIp);
                return;
            }

            messagingTemplate.convertAndSendToUser(
                    userId.toString(),
                    "/queue/messages",
                    messageDto);
            logger.info("Message sent successfully to user ID: {} from IP: {}", userId, clientIp);

        } catch (Exception ex) {
            logger.error("Error sending message to user ID: {} from IP: {}", userId, clientIp, ex);
            securityLogger.error("Error sending message to user - userId: {}, IP: {}, Error: {}", userId, clientIp, ex.getMessage());
        }
    }

    /**
     * Send a typing indicator to a chat
     * 
     * @param chatId   The chat ID
     * @param typingStatus The typing status DTO
     */
    public void broadcastTypingStatus(Long chatId, TypingStatusDto typingStatus) {
        String clientIp = getClientIp();
        logger.debug("Broadcasting typing status to chat ID: {} for user ID: {}, typing: {} from IP: {}", 
                chatId, typingStatus.getUserId(), typingStatus.isTyping(), clientIp);

        try {
            if (chatId == null || typingStatus == null || typingStatus.getUserId() == null) {
                logger.warn("Invalid parameters for broadcasting typing status - chatId: {}, typingStatus: {} from IP: {}", 
                        chatId, typingStatus, clientIp);
                return;
            }

            messagingTemplate.convertAndSend("/topic/chat/" + chatId + "/typing", typingStatus);
            logger.info("Typing status broadcasted successfully to chat ID: {} for user ID: {} from IP: {}", 
                    chatId, typingStatus.getUserId(), clientIp);

        } catch (Exception ex) {
            logger.error("Error broadcasting typing status to chat ID: {} for user ID: {} from IP: {}", 
                    chatId, typingStatus != null ? typingStatus.getUserId() : "unknown", clientIp, ex);
            securityLogger.error("Error broadcasting typing status - chatId: {}, userId: {}, IP: {}, Error: {}", 
                    chatId, typingStatus != null ? typingStatus.getUserId() : "unknown", clientIp, ex.getMessage());
        }
    }

    private String getClientIp() {
        try {
            HttpServletRequest request = ((ServletRequestAttributes) RequestContextHolder.currentRequestAttributes())
                    .getRequest();
            String ipAddress = request.getHeader("X-Forwarded-For");
            if (ipAddress == null || ipAddress.isEmpty() || "unknown".equalsIgnoreCase(ipAddress)) {
                ipAddress = request.getHeader("Proxy-Client-IP");
            }
            if (ipAddress == null || ipAddress.isEmpty() || "unknown".equalsIgnoreCase(ipAddress)) {
                ipAddress = request.getHeader("WL-Proxy-Client-IP");
            }
            if (ipAddress == null || ipAddress.isEmpty() || "unknown".equalsIgnoreCase(ipAddress)) {
                ipAddress = request.getRemoteAddr();
            }
            logger.debug("Client IP retrieved: {}", ipAddress);
            return ipAddress;
        } catch (IllegalStateException e) {
            logger.debug("No HTTP request context available, returning unknown IP");
            return "unknown";
        } catch (Exception ex) {
            logger.error("Error retrieving client IP", ex);
            return "unknown";
        }
    }

    // Inner class for typing status (unchanged, but included for completeness)
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