package com.secureops.controller;

import com.secureops.dto.MessageDto;
import com.secureops.dto.TextMessageDto;
import com.secureops.dto.FileMessageDto;
import com.secureops.entity.User;
import com.secureops.repository.UserRepository;
import com.secureops.service.LogService;
import com.secureops.service.MessageService;
import com.secureops.util.AppConstants;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Controller;

@Controller
public class WebSocketController {

    private static final Logger logger = LoggerFactory.getLogger(WebSocketController.class);
    
    // For security-specific logging, create a separate logger
    private static final Logger securityLogger = LoggerFactory.getLogger("com.secureops.security");

    private final UserRepository userRepository;
    private final MessageService messageService;
    private final LogService logService;

    public WebSocketController(UserRepository userRepository, MessageService messageService, LogService logService) {
        this.userRepository = userRepository;
        this.messageService = messageService;
        this.logService = logService;
        logger.info("WebSocketController initialized");
    }

    @MessageMapping("/chat/{chatId}/sendMessage")
    public void sendMessage(@DestinationVariable Long chatId,
                           @Payload MessageDto messageDto,
                           SimpMessageHeaderAccessor headerAccessor) {
        String clientIp = getClientIpFromWebSocket(headerAccessor);
        String sessionId = getSessionIdFromWebSocket(headerAccessor);
        
        logger.info("WebSocket message received - chatId: {}, sessionId: {}, ip: {}", 
                chatId, sessionId, clientIp);
        
        try {
            // Input validation
            if (!validateWebSocketInput(chatId, messageDto, clientIp, sessionId)) {
                return;
            }
            
            // Get user from WebSocket session
            String email = getUserEmailFromWebSocket(headerAccessor, chatId, clientIp, sessionId);
            if (email == null) {
                return;
            }
            
            logger.debug("Processing WebSocket message - email: {}, chatId: {}, messageType: {}", 
                    email, chatId, messageDto.getMessageType());
            
            // Find user in database
            User user = findUserByEmail(email, chatId, clientIp, sessionId);
            if (user == null) {
                return;
            }
            
            // Sanitize message content
            sanitizeMessageDto(messageDto);
            
            // Log message processing attempt
            securityLogger.info("WEBSOCKET_MESSAGE_PROCESSING - User: {} (ID: {}), IP: {}, ChatId: {}, MessageType: {}, SessionId: {}", 
                    email, user.getId(), clientIp, chatId, messageDto.getMessageType(), sessionId);
            
            // Process message based on type
            processMessageByType(messageDto, chatId, user, clientIp, sessionId);
            
        } catch (Exception e) {
            logger.error("Error processing WebSocket message - chatId: {}, sessionId: {}, ip: {}", 
                    chatId, sessionId, clientIp, e);
            
            securityLogger.error("WEBSOCKET_MESSAGE_ERROR - IP: {}, ChatId: {}, SessionId: {}, Error: {}", 
                    clientIp, chatId, sessionId, e.getMessage());
            
            // Get user ID safely for logging
            Long userId = getUserIdSafely(headerAccessor);
            
            logService.createLog(
                    AppConstants.LOG_ACTION_CREATE,
                    "WebSocket message processing failed for chatId: " + chatId + " - " + e.getMessage(),
                    clientIp,
                    AppConstants.LOG_TYPE_ERROR,
                    userId);
        }
    }

    private boolean validateWebSocketInput(Long chatId, MessageDto messageDto, String clientIp, String sessionId) {
        // Validate chatId
        if (chatId == null || chatId <= 0) {
            logger.warn("Invalid chatId in WebSocket message: {} - sessionId: {}, ip: {}", 
                    chatId, sessionId, clientIp);
            securityLogger.warn("WEBSOCKET_INVALID_CHAT_ID - IP: {}, InvalidChatId: {}, SessionId: {}", 
                    clientIp, chatId, sessionId);
            
            logService.createLog(
                    AppConstants.LOG_ACTION_CREATE,
                    "Invalid chatId in WebSocket message: " + chatId,
                    clientIp,
                    AppConstants.LOG_TYPE_SECURITY,
                    null);
            
            return false;
        }
        
        // Validate messageDto
        if (messageDto == null) {
            logger.warn("Null message DTO in WebSocket - chatId: {}, sessionId: {}, ip: {}", 
                    chatId, sessionId, clientIp);
            securityLogger.warn("WEBSOCKET_NULL_MESSAGE_DTO - IP: {}, ChatId: {}, SessionId: {}", 
                    clientIp, chatId, sessionId);
            
            logService.createLog(
                    AppConstants.LOG_ACTION_CREATE,
                    "Null message DTO in WebSocket for chatId: " + chatId,
                    clientIp,
                    AppConstants.LOG_TYPE_SECURITY,
                    null);
            
            return false;
        }
        
        // Infer and validate message type
        String messageType = messageDto.getMessageType();
        if (messageType == null) {
            logger.debug("Message type is null, attempting to infer - chatId: {}, sessionId: {}", 
                    chatId, sessionId);
            
            if (messageDto instanceof TextMessageDto) {
                messageType = "TEXT";
                messageDto.setMessageType("TEXT");
                logger.debug("Inferred messageType as TEXT - chatId: {}, sessionId: {}", chatId, sessionId);
            } else if (messageDto instanceof FileMessageDto) {
                messageType = "FILE";
                messageDto.setMessageType("FILE");
                logger.debug("Inferred messageType as FILE - chatId: {}, sessionId: {}", chatId, sessionId);
            } else {
                logger.warn("Unknown message DTO type and null messageType - chatId: {}, sessionId: {}, ip: {}, dtoClass: {}", 
                        chatId, sessionId, clientIp, messageDto.getClass().getName());
                securityLogger.warn("WEBSOCKET_UNKNOWN_MESSAGE_TYPE - IP: {}, ChatId: {}, SessionId: {}, DTOClass: {}", 
                        clientIp, chatId, sessionId, messageDto.getClass().getName());
                
                logService.createLog(
                        AppConstants.LOG_ACTION_CREATE,
                        "Unknown message DTO type for chatId: " + chatId + " - " + messageDto.getClass().getName(),
                        clientIp,
                        AppConstants.LOG_TYPE_SECURITY,
                        null);
                
                return false;
            }
        }
        
        // Validate message type value
        if (!"TEXT".equals(messageType) && !"FILE".equals(messageType)) {
            logger.warn("Unsupported message type in WebSocket: {} - chatId: {}, sessionId: {}, ip: {}", 
                    messageType, chatId, sessionId, clientIp);
            securityLogger.warn("WEBSOCKET_UNSUPPORTED_MESSAGE_TYPE - IP: {}, ChatId: {}, SessionId: {}, MessageType: {}", 
                    clientIp, chatId, sessionId, messageType);
            
            logService.createLog(
                    AppConstants.LOG_ACTION_CREATE,
                    "Unsupported message type in WebSocket: " + messageType + " for chatId: " + chatId,
                    clientIp,
                    AppConstants.LOG_TYPE_SECURITY,
                    null);
            
            return false;
        }
        
        return true;
    }

    private String getUserEmailFromWebSocket(SimpMessageHeaderAccessor headerAccessor, Long chatId, String clientIp, String sessionId) {
        if (headerAccessor.getUser() == null) {
            logger.warn("No user information in WebSocket session - chatId: {}, sessionId: {}, ip: {}", 
                    chatId, sessionId, clientIp);
            securityLogger.warn("WEBSOCKET_NO_USER_SESSION - IP: {}, ChatId: {}, SessionId: {}", 
                    clientIp, chatId, sessionId);
            
            logService.createLog(
                    AppConstants.LOG_ACTION_CREATE,
                    "No user information in WebSocket session for chatId: " + chatId,
                    clientIp,
                    AppConstants.LOG_TYPE_SECURITY,
                    null);
            
            return null;
        }
        
        String email = headerAccessor.getUser().getName();
        if (email == null || email.trim().isEmpty()) {
            logger.warn("Empty user email in WebSocket session - chatId: {}, sessionId: {}, ip: {}", 
                    chatId, sessionId, clientIp);
            securityLogger.warn("WEBSOCKET_EMPTY_USER_EMAIL - IP: {}, ChatId: {}, SessionId: {}", 
                    clientIp, chatId, sessionId);
            
            logService.createLog(
                    AppConstants.LOG_ACTION_CREATE,
                    "Empty user email in WebSocket session for chatId: " + chatId,
                    clientIp,
                    AppConstants.LOG_TYPE_SECURITY,
                    null);
            
            return null;
        }
        
        // Sanitize email
        email = sanitizeString(email);
        logger.debug("WebSocket message from user: {} - chatId: {}, sessionId: {}", email, chatId, sessionId);
        
        return email;
    }

    private User findUserByEmail(String email, Long chatId, String clientIp, String sessionId) {
        try {
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found for email: " + email));
            
            logger.debug("Found user for WebSocket message - userId: {}, email: {}, chatId: {}", 
                    user.getId(), email, chatId);
            
            return user;
            
        } catch (Exception e) {
            logger.warn("User not found for WebSocket message - email: {}, chatId: {}, sessionId: {}, ip: {}", 
                    email, chatId, sessionId, clientIp);
            securityLogger.warn("WEBSOCKET_USER_NOT_FOUND - Email: {}, IP: {}, ChatId: {}, SessionId: {}", 
                    email, clientIp, chatId, sessionId);
            
            logService.createLog(
                    AppConstants.LOG_ACTION_CREATE,
                    "User not found for WebSocket message - email: " + email + " for chatId: " + chatId,
                    clientIp,
                    AppConstants.LOG_TYPE_SECURITY,
                    null);
            
            return null;
        }
    }

    private void processMessageByType(MessageDto messageDto, Long chatId, User user, String clientIp, String sessionId) {
        String messageType = messageDto.getMessageType();
        
        try {
            switch (messageType) {
                case "TEXT":
                    processTextMessage(messageDto, chatId, user, clientIp, sessionId);
                    break;
                case "FILE":
                    processFileMessage(messageDto, chatId, user, clientIp, sessionId);
                    break;
                default:
                    logger.error("Unexpected message type after validation: {} - chatId: {}, userId: {}, sessionId: {}", 
                            messageType, chatId, user.getId(), sessionId);
                    securityLogger.error("WEBSOCKET_UNEXPECTED_MESSAGE_TYPE - User: {} (ID: {}), IP: {}, ChatId: {}, MessageType: {}, SessionId: {}", 
                            user.getEmail(), user.getId(), clientIp, chatId, messageType, sessionId);
                    
                    logService.createLog(
                            AppConstants.LOG_ACTION_CREATE,
                            "Unexpected message type after validation: " + messageType + " for chatId: " + chatId,
                            clientIp,
                            AppConstants.LOG_TYPE_ERROR,
                            user.getId());
            }
        } catch (Exception e) {
            logger.error("Error processing {} message - chatId: {}, userId: {}, sessionId: {}, ip: {}", 
                    messageType, chatId, user.getId(), sessionId, clientIp, e);
            
            securityLogger.error("WEBSOCKET_MESSAGE_PROCESSING_ERROR - User: {} (ID: {}), IP: {}, ChatId: {}, MessageType: {}, SessionId: {}, Error: {}", 
                    user.getEmail(), user.getId(), clientIp, chatId, messageType, sessionId, e.getMessage());
            
            logService.createLog(
                    AppConstants.LOG_ACTION_CREATE,
                    "Failed to process " + messageType + " message for chatId: " + chatId + " - " + e.getMessage(),
                    clientIp,
                    AppConstants.LOG_TYPE_ERROR,
                    user.getId());
            
            throw e;
        }
    }

    private void processTextMessage(MessageDto messageDto, Long chatId, User user, String clientIp, String sessionId) {
        if (!(messageDto instanceof TextMessageDto)) {
            logger.error("Invalid DTO type for TEXT message - expected TextMessageDto, got: {} - chatId: {}, userId: {}, sessionId: {}", 
                    messageDto.getClass().getName(), chatId, user.getId(), sessionId);
            securityLogger.error("WEBSOCKET_INVALID_TEXT_MESSAGE_DTO - User: {} (ID: {}), IP: {}, ChatId: {}, DTOClass: {}, SessionId: {}", 
                    user.getEmail(), user.getId(), clientIp, chatId, messageDto.getClass().getName(), sessionId);
            
            logService.createLog(
                    AppConstants.LOG_ACTION_CREATE,
                    "Invalid DTO type for TEXT message - chatId: " + chatId + " - " + messageDto.getClass().getName(),
                    clientIp,
                    AppConstants.LOG_TYPE_SECURITY,
                    user.getId());
            
            throw new IllegalArgumentException("Invalid DTO type for TEXT message");
        }
        
        TextMessageDto textMessageDto = (TextMessageDto) messageDto;
        
        // Additional validation for text content
        if (textMessageDto.getContent() == null || textMessageDto.getContent().trim().isEmpty()) {
            logger.warn("Empty text message content - chatId: {}, userId: {}, sessionId: {}, ip: {}", 
                    chatId, user.getId(), sessionId, clientIp);
            securityLogger.warn("WEBSOCKET_EMPTY_TEXT_CONTENT - User: {} (ID: {}), IP: {}, ChatId: {}, SessionId: {}", 
                    user.getEmail(), user.getId(), clientIp, chatId, sessionId);
            
            logService.createLog(
                    AppConstants.LOG_ACTION_CREATE,
                    "Empty text message content for chatId: " + chatId,
                    clientIp,
                    AppConstants.LOG_TYPE_SECURITY,
                    user.getId());
            
            throw new IllegalArgumentException("Text message content cannot be empty");
        }
        
        logger.debug("Processing TEXT message - chatId: {}, userId: {}, contentLength: {}", 
                chatId, user.getId(), textMessageDto.getContent().length());
        
        messageService.sendTextMessage(textMessageDto, chatId, user.getId());
        
        logger.info("TEXT message sent successfully - chatId: {}, userId: {}, sessionId: {}", 
                chatId, user.getId(), sessionId);
        
        logService.createLog(
                AppConstants.LOG_ACTION_CREATE,
                "User sent text message to chatId: " + chatId,
                clientIp,
                AppConstants.LOG_TYPE_USER,
                user.getId());
    }

    private void processFileMessage(MessageDto messageDto, Long chatId, User user, String clientIp, String sessionId) {
        if (!(messageDto instanceof FileMessageDto)) {
            logger.error("Invalid DTO type for FILE message - expected FileMessageDto, got: {} - chatId: {}, userId: {}, sessionId: {}", 
                    messageDto.getClass().getName(), chatId, user.getId(), sessionId);
            securityLogger.error("WEBSOCKET_INVALID_FILE_MESSAGE_DTO - User: {} (ID: {}), IP: {}, ChatId: {}, DTOClass: {}, SessionId: {}", 
                    user.getEmail(), user.getId(), clientIp, chatId, messageDto.getClass().getName(), sessionId);
            
            logService.createLog(
                    AppConstants.LOG_ACTION_CREATE,
                    "Invalid DTO type for FILE message - chatId: " + chatId + " - " + messageDto.getClass().getName(),
                    clientIp,
                    AppConstants.LOG_TYPE_SECURITY,
                    user.getId());
            
            throw new IllegalArgumentException("Invalid DTO type for FILE message");
        }
        
        FileMessageDto fileMessageDto = (FileMessageDto) messageDto;
        
        // Additional validation for file message
        if (fileMessageDto.getFileName() == null || fileMessageDto.getFileName().trim().isEmpty()) {
            logger.warn("Empty file name in file message - chatId: {}, userId: {}, sessionId: {}, ip: {}", 
                    chatId, user.getId(), sessionId, clientIp);
            securityLogger.warn("WEBSOCKET_EMPTY_FILE_NAME - User: {} (ID: {}), IP: {}, ChatId: {}, SessionId: {}", 
                    user.getEmail(), user.getId(), clientIp, chatId, sessionId);
            
            logService.createLog(
                    AppConstants.LOG_ACTION_CREATE,
                    "Empty file name in file message for chatId: " + chatId,
                    clientIp,
                    AppConstants.LOG_TYPE_SECURITY,
                    user.getId());
            
            throw new IllegalArgumentException("File message must have a valid file name");
        }
        
        if (fileMessageDto.getFileUrl() == null || fileMessageDto.getFileUrl().trim().isEmpty()) {
            logger.warn("Empty file URL in file message - chatId: {}, userId: {}, fileName: {}, sessionId: {}, ip: {}", 
                    chatId, user.getId(), fileMessageDto.getFileName(), sessionId, clientIp);
            securityLogger.warn("WEBSOCKET_EMPTY_FILE_URL - User: {} (ID: {}), IP: {}, ChatId: {}, FileName: {}, SessionId: {}", 
                    user.getEmail(), user.getId(), clientIp, chatId, fileMessageDto.getFileName(), sessionId);
            
            logService.createLog(
                    AppConstants.LOG_ACTION_CREATE,
                    "Empty file URL in file message for chatId: " + chatId + " - " + fileMessageDto.getFileName(),
                    clientIp,
                    AppConstants.LOG_TYPE_SECURITY,
                    user.getId());
            
            throw new IllegalArgumentException("File message must have a valid file URL");
        }
        
        logger.debug("Processing FILE message - chatId: {}, userId: {}, fileName: {}, fileSize: {}", 
                chatId, user.getId(), fileMessageDto.getFileName(), fileMessageDto.getFileSize());
        
        // Log file sharing activity
        securityLogger.info("WEBSOCKET_FILE_SHARING - User: {} (ID: {}), IP: {}, ChatId: {}, FileName: {}, FileSize: {}, SessionId: {}", 
                user.getEmail(), user.getId(), clientIp, chatId, fileMessageDto.getFileName(), 
                fileMessageDto.getFileSize(), sessionId);
        
        messageService.sendFileMessage(fileMessageDto, chatId, user.getId());
        
        logger.info("FILE message sent successfully - chatId: {}, userId: {}, fileName: {}, sessionId: {}", 
                chatId, user.getId(), fileMessageDto.getFileName(), sessionId);
        
        logService.createLog(
                AppConstants.LOG_ACTION_CREATE,
                "User sent file message to chatId: " + chatId + " - " + fileMessageDto.getFileName(),
                clientIp,
                AppConstants.LOG_TYPE_USER,
                user.getId());
    }

    private void sanitizeMessageDto(MessageDto messageDto) {
        if (messageDto instanceof TextMessageDto) {
            TextMessageDto textDto = (TextMessageDto) messageDto;
            if (textDto.getContent() != null) {
                textDto.setContent(sanitizeString(textDto.getContent()));
            }
        } else if (messageDto instanceof FileMessageDto) {
            FileMessageDto fileDto = (FileMessageDto) messageDto;
            if (fileDto.getFileName() != null) {
                fileDto.setFileName(sanitizeFileName(fileDto.getFileName()));
            }
            if (fileDto.getFileUrl() != null) {
                fileDto.setFileUrl(sanitizeString(fileDto.getFileUrl()));
            }
        }
    }
    
    private String sanitizeString(String input) {
        if (input == null) return null;
        
        return input.replaceAll("[\\r\\n\\t]", " ")
                   .replaceAll("\\s+", " ")
                   .trim();
    }
    
    private String sanitizeFileName(String fileName) {
        if (fileName == null) return null;
        
        // Remove potentially dangerous characters from filename
        return fileName.replaceAll("[\\r\\n\\t]", "")
                      .replaceAll("[<>:\"|?*]", "")
                      .trim();
    }

    private String getClientIpFromWebSocket(SimpMessageHeaderAccessor headerAccessor) {
        try {
            // Try to get IP from WebSocket session attributes
            Object sessionAttributes = headerAccessor.getSessionAttributes();
            if (sessionAttributes != null) {
                // This would depend on how you store IP in WebSocket session
                // For now, return a placeholder that indicates WebSocket origin
                return "websocket-session";
            }
            
            // Could also try to extract from headers if available
            return "websocket-unknown";
        } catch (Exception e) {
            logger.debug("Could not get client IP from WebSocket: {}", e.getMessage());
            return "websocket-unknown";
        }
    }

    private String getSessionIdFromWebSocket(SimpMessageHeaderAccessor headerAccessor) {
        try {
            return headerAccessor.getSessionId();
        } catch (Exception e) {
            logger.debug("Could not get session ID from WebSocket: {}", e.getMessage());
            return "unknown";
        }
    }

    private Long getUserIdSafely(SimpMessageHeaderAccessor headerAccessor) {
        try {
            if (headerAccessor.getUser() != null) {
                String email = headerAccessor.getUser().getName();
                if (email != null && !email.trim().isEmpty()) {
                    return userRepository.findByEmail(email)
                            .map(User::getId)
                            .orElse(null);
                }
            }
        } catch (Exception e) {
            logger.debug("Could not get user ID safely from WebSocket: {}", e.getMessage());
        }
        return null;
    }
}