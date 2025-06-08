package com.secureops.controller;

import java.util.List;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import com.secureops.dto.FileMessageDto;
import com.secureops.dto.MessageDto;
import com.secureops.dto.TextMessageDto;
import com.secureops.dto.UserDto;
import com.secureops.entity.FileMessage;
import com.secureops.entity.Message;
import com.secureops.entity.TextMessage;
import com.secureops.entity.User;
import com.secureops.exception.ResourceNotFoundException;
import com.secureops.exception.UnauthorizedException;
import com.secureops.service.LogService;
import com.secureops.service.MessageService;
import com.secureops.service.UserService;
import com.secureops.util.AppConstants;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/messages")
public class MessageController {

    private static final Logger logger = LoggerFactory.getLogger(MessageController.class);
    
    // For security-specific logging, create a separate logger
    private static final Logger securityLogger = LoggerFactory.getLogger("com.secureops.security");

    private final MessageService messageService;
    private final LogService logService;
    private final UserService userService;

    public MessageController(MessageService messageService, LogService logService, UserService userService) {
        this.messageService = messageService;
        this.logService = logService;
        this.userService = userService;
        logger.info("MessageController initialized");
    }

    @GetMapping("/chat/{chatId}")
    public ResponseEntity<List<MessageDto>> getChatMessages(@PathVariable Long chatId) {
        String clientIp = getClientIpSafely();
        Long currentUserId = getCurrentUserIdSafely();
        String currentUsername = getCurrentUsernameSafely();
        
        logger.info("Chat messages retrieval request - userId: {}, username: {}, chatId: {}, ip: {}", 
                currentUserId, currentUsername, chatId, clientIp);
        
        // Security logging for message access
        // securityLogger.info("CHAT_MESSAGE_ACCESS - User: {} (ID: {}), IP: {}, ChatId: {}, Action: VIEW_MESSAGES", 
        //         currentUsername, currentUserId, clientIp, chatId);
        
        // Input validation
        if (chatId == null || chatId <= 0) {
            logger.warn("Invalid chatId parameter: {} - userId: {}, ip: {}", 
                    chatId, currentUserId, clientIp);
            securityLogger.warn("INVALID_CHAT_ID_PARAMETER - User: {} (ID: {}), IP: {}, InvalidChatId: {}", 
                    currentUsername, currentUserId, clientIp, chatId);
            
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "Invalid chatId parameter in message request: " + chatId,
                    clientIp,
                    AppConstants.LOG_TYPE_SECURITY,
                    currentUserId);
                    
            return ResponseEntity.badRequest().build();
        }
        
        try {
            // Check user authentication
            if (currentUserId == null) {
                logger.warn("Unauthenticated access attempt to chat messages - chatId: {}, ip: {}", 
                        chatId, clientIp);
                securityLogger.warn("UNAUTHENTICATED_MESSAGE_ACCESS - IP: {}, ChatId: {}", 
                        clientIp, chatId);
                
                logService.createLog(
                        AppConstants.LOG_ACTION_READ,
                        "Unauthenticated access attempt to chat: " + chatId,
                        clientIp,
                        AppConstants.LOG_TYPE_SECURITY,
                        null);
                        
                return ResponseEntity.status(401).build();
            }
            
            logger.debug("Retrieving messages for chat: {} by user: {}", chatId, currentUserId);
            
            List<Message> messages = messageService.getChatMessages(chatId);
            List<MessageDto> messageDtos = messages.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
            
            logger.info("Successfully retrieved {} messages for chat {} by user {}", 
                    messageDtos.size(), chatId, currentUserId);
            
            // Log the message access action
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "User accessed chat messages (ChatId: " + chatId + ", " + messageDtos.size() + " messages)",
                    clientIp,
                    AppConstants.LOG_TYPE_USER,
                    currentUserId);
            
            return ResponseEntity.ok(messageDtos);
            
        } catch (ResourceNotFoundException e) {
            logger.warn("Chat not found or access denied - chatId: {}, userId: {}, ip: {}", 
                    chatId, currentUserId, clientIp);
            securityLogger.warn("CHAT_NOT_FOUND_OR_ACCESS_DENIED - User: {} (ID: {}), IP: {}, ChatId: {}", 
                    currentUsername, currentUserId, clientIp, chatId);
            
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "Attempted to access non-existent or unauthorized chat: " + chatId,
                    clientIp,
                    AppConstants.LOG_TYPE_SECURITY,
                    currentUserId);
                    
            throw e;
            
        } catch (UnauthorizedException e) {
            logger.warn("Unauthorized access to chat messages - chatId: {}, userId: {}, ip: {}", 
                    chatId, currentUserId, clientIp);
            securityLogger.warn("UNAUTHORIZED_CHAT_ACCESS - User: {} (ID: {}), IP: {}, ChatId: {}", 
                    currentUsername, currentUserId, clientIp, chatId);
            
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "Unauthorized access attempt to chat: " + chatId,
                    clientIp,
                    AppConstants.LOG_TYPE_SECURITY,
                    currentUserId);
                    
            throw e;
            
        } catch (Exception e) {
            logger.error("Error fetching messages for chat {} - userId: {}, username: {}, ip: {}", 
                    chatId, currentUserId, currentUsername, clientIp, e);
            
            securityLogger.error("CHAT_MESSAGE_ACCESS_ERROR - User: {} (ID: {}), IP: {}, ChatId: {}, Error: {}", 
                    currentUsername, currentUserId, clientIp, chatId, e.getMessage());
            
            logService.createLog(
                    AppConstants.LOG_ACTION_READ,
                    "Failed to retrieve chat messages for chatId: " + chatId + " - " + e.getMessage(),
                    clientIp,
                    AppConstants.LOG_TYPE_ERROR,
                    currentUserId);
                    
            throw new RuntimeException("Error fetching messages: " + e.getMessage(), e);
        }
    }

    // Helper method to convert Message entity to DTO
    private MessageDto convertToDto(Message message) {
        try {
            if (message instanceof TextMessage) {
                TextMessage textMessage = (TextMessage) message;
                TextMessageDto dto = new TextMessageDto();
                dto.setId(textMessage.getId());
                dto.setContent(sanitizeMessageContent(textMessage.getContent()));
                dto.setTimestamp(textMessage.getTimestamp());
                dto.setReadStatus(textMessage.isReadStatus());
                dto.setSender(mapUserToDto(textMessage.getSender()));
                dto.setChatId(textMessage.getChat().getId());
                dto.setMessageType("TEXT");
                
                logger.debug("Converted text message to DTO - messageId: {}, chatId: {}", 
                        textMessage.getId(), textMessage.getChat().getId());
                
                return dto;
                
            } else if (message instanceof FileMessage) {
                FileMessage fileMessage = (FileMessage) message;
                FileMessageDto dto = new FileMessageDto();
                dto.setId(fileMessage.getId());
                dto.setFileUrl(sanitizeFileUrl(fileMessage.getFileUrl()));
                dto.setFileName(sanitizeFileName(fileMessage.getFileName()));
                dto.setFileType(fileMessage.getFileType());
                dto.setFileSize(fileMessage.getFileSize());
                dto.setTimestamp(fileMessage.getTimestamp());
                dto.setReadStatus(fileMessage.isReadStatus());
                dto.setSender(mapUserToDto(fileMessage.getSender()));
                dto.setChatId(fileMessage.getChat().getId());
                dto.setMessageType("FILE");
                
                logger.debug("Converted file message to DTO - messageId: {}, chatId: {}, fileName: {}", 
                        fileMessage.getId(), fileMessage.getChat().getId(), fileMessage.getFileName());
                
                return dto;
            }
            
            logger.error("Unknown message type encountered: {}", message.getClass().getName());
            securityLogger.warn("UNKNOWN_MESSAGE_TYPE - MessageId: {}, Type: {}, User: {} (ID: {})", 
                    message.getId(), message.getClass().getName(), 
                    getCurrentUsernameSafely(), getCurrentUserIdSafely());
                    
            throw new IllegalArgumentException("Unknown message type: " + message.getClass().getName());
            
        } catch (Exception e) {
            logger.error("Error converting message to DTO - messageId: {}", 
                    message != null ? message.getId() : "null", e);
            throw e;
        }
    }

    // Helper method to map User to UserDto
    private UserDto mapUserToDto(User user) {
        try {
            if (user == null) {
                logger.warn("Null user encountered during DTO mapping");
                return null;
            }
            
            UserDto dto = new UserDto();
            dto.setId(user.getId());
            dto.setFullName(user.getFullName());
            dto.setEmail(user.getEmail());
            dto.setActive(user.isActive());
            dto.setRole(user.getRole());
            dto.setApprovalStatus(user.getApprovalStatus());
            
            logger.debug("Mapped user to DTO - userId: {}, email: {}", user.getId(), user.getEmail());
            
            return dto;
            
        } catch (Exception e) {
            logger.error("Error mapping user to DTO - userId: {}", 
                    user != null ? user.getId() : "null", e);
            throw e;
        }
    }
    
    // Security sanitization methods
    private String sanitizeMessageContent(String content) {
        if (content == null) return null;
        
        // Remove potentially dangerous characters but preserve readability
        return content.replaceAll("[\\r\\n\\t]", " ")
                     .replaceAll("\\s+", " ")
                     .trim();
    }
    
    private String sanitizeFileUrl(String fileUrl) {
        if (fileUrl == null) return null;
        
        // Basic URL sanitization
        return fileUrl.replaceAll("[\\r\\n\\t]", "")
                     .trim();
    }
    
    private String sanitizeFileName(String fileName) {
        if (fileName == null) return null;
        
        // Remove potentially dangerous characters from filename
        return fileName.replaceAll("[\\r\\n\\t]", "")
                      .replaceAll("[<>:\"|?*]", "")
                      .trim();
    }
    
    private Long getCurrentUserIdSafely() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.isAuthenticated() &&
                    !authentication.getPrincipal().toString().equals("anonymousUser")) {
                return userService.getCurrentUser().getId();
            }
        } catch (Exception e) {
            logger.debug("Could not get current user ID: {}", e.getMessage());
        }
        return null;
    }

    private String getCurrentUsernameSafely() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.isAuthenticated() &&
                    !authentication.getPrincipal().toString().equals("anonymousUser")) {
                return authentication.getName();
            }
        } catch (Exception e) {
            logger.debug("Could not get current username: {}", e.getMessage());
        }
        return "unknown";
    }
    
    private String getClientIpSafely() {
        try {
            HttpServletRequest request = ((ServletRequestAttributes) RequestContextHolder.currentRequestAttributes())
                    .getRequest();
            String ipAddress = getHeaderValue(request, "X-Forwarded-For");
            if (ipAddress == null) {
                ipAddress = getHeaderValue(request, "Proxy-Client-IP");
            }
            if (ipAddress == null) {
                ipAddress = getHeaderValue(request, "WL-Proxy-Client-IP");
            }
            if (ipAddress == null) {
                ipAddress = request.getRemoteAddr();
            }
            if (ipAddress != null && ipAddress.contains(",")) {
                ipAddress = ipAddress.split(",")[0].trim();
            }
            return ipAddress != null ? ipAddress : "unknown";
        } catch (Exception e) {
            logger.debug("Could not get client IP: {}", e.getMessage());
            return "unknown";
        }
    }
    
    private String getHeaderValue(HttpServletRequest request, String headerName) {
        String value = request.getHeader(headerName);
        if (value == null || value.isEmpty() || "unknown".equalsIgnoreCase(value)) {
            return null;
        }
        if (value.length() > 100) {
            value = value.substring(0, 100);
        }
        return value;
    }
}