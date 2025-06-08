package com.secureops.controller;

import com.secureops.dto.ChatDto;
import com.secureops.entity.Chat;
import com.secureops.entity.User;
import com.secureops.service.ChatService;
import com.secureops.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/chats")
public class ChatController {

    private static final Logger logger = LoggerFactory.getLogger(ChatController.class);
    private static final Logger securityLogger = LoggerFactory.getLogger("com.secureops.security");

    private final ChatService chatService;
    private final UserService userService;

    public ChatController(ChatService chatService, UserService userService) {
        this.chatService = chatService;
        this.userService = userService;
        logger.info("ChatController initialized");
    }

    @PostMapping
    public ResponseEntity<ChatDto> createChat(@Valid @RequestBody ChatDto chatDto, BindingResult bindingResult) {
        String clientIp = getClientIp();
        String maskedTitle = maskChatTitle(chatDto != null ? chatDto.getTitle() : null);
        
        logger.debug("Create chat request received - Title: {}, IP: {}", maskedTitle, clientIp);
        // securityLogger.info("Chat creation attempt from IP: {} - Title: {}", clientIp, maskedTitle);

        try {
            // Validation checks
            if (bindingResult.hasErrors()) {
                logger.warn("Chat creation validation failed - Title: {}, IP: {}. Errors: {}", 
                        maskedTitle, clientIp, bindingResult.getAllErrors());
                securityLogger.warn("Chat creation validation failure - Title: {}, IP: {}", maskedTitle, clientIp);
                throw new RuntimeException("Invalid input data");
            }

            if (chatDto == null) {
                logger.warn("Chat creation attempt with null DTO from IP: {}", clientIp);
                securityLogger.warn("Chat creation attempt with null DTO from IP: {}", clientIp);
                throw new RuntimeException("Chat data is required");
            }

            if (chatDto.getTitle() == null || chatDto.getTitle().trim().isEmpty()) {
                logger.warn("Chat creation attempt with empty title from IP: {}", clientIp);
                securityLogger.warn("Chat creation attempt with empty title from IP: {}", clientIp);
                throw new RuntimeException("Chat title is required");
            }

            if (chatDto.getParticipants() == null || chatDto.getParticipants().isEmpty()) {
                logger.warn("Chat creation attempt with no participants - Title: {}, IP: {}", maskedTitle, clientIp);
                securityLogger.warn("Chat creation attempt with no participants - Title: {}, IP: {}", maskedTitle, clientIp);
                throw new RuntimeException("At least one participant is required");
            }

            logger.debug("Creating chat through service - Title: {}, ParticipantCount: {}", 
                    maskedTitle, chatDto.getParticipants().size());

            // Extract participant IDs from the DTO
            List<Long> participantIds = chatDto.getParticipants();

            // Create the chat using the service
            Chat chat = chatService.createChat(chatDto, participantIds);

            logger.info("Chat created successfully - ChatID: {}, Title: {}, IP: {}", 
                    chat.getId(), maskedTitle, clientIp);
            // securityLogger.info("Successful chat creation - ChatID: {}, Title: {}, IP: {}", 
                    // chat.getId(), maskedTitle, clientIp);

            return new ResponseEntity<>(mapToDto(chat), HttpStatus.CREATED);

        } catch (Exception e) {
            logger.error("Error during chat creation - Title: {}, IP: {}", maskedTitle, clientIp, e);
            securityLogger.error("Chat creation error - Title: {}, IP: {}, Error: {}", 
                    maskedTitle, clientIp, e.getMessage());
            throw e;
        }
    }

    @GetMapping
    public ResponseEntity<List<ChatDto>> getUserChats() {
        String clientIp = getClientIp();
        
        logger.debug("Get user chats request from IP: {}", clientIp);
        // securityLogger.info("User chats request from IP: {}", clientIp);
        
        logger.debug("getUserChats - Starting method");
        try {
            Long currentUserId = userService.getCurrentUser().getId();
            logger.debug("getUserChats - Current user ID: {}", currentUserId);
            
            logger.debug("Fetching chats for current user - UserID: {}, IP: {}", currentUserId, clientIp);

            List<Chat> chats = chatService.getUserChats(currentUserId);
            logger.debug("getUserChats - Retrieved {} chats", chats != null ? chats.size() : "null");

            if (chats != null) {
                for (Chat chat : chats) {
                    logger.debug("getUserChats - Chat ID: {}, Title: {}", chat.getId(), maskChatTitle(chat.getTitle()));
                    logger.debug("getUserChats - Participants: {}", 
                            chat.getParticipants() != null ? chat.getParticipants().size() : "null");
                }
            }

            List<ChatDto> chatDtos = chats.stream()
                    .map(this::mapToDto)
                    .collect(Collectors.toList());
            logger.debug("getUserChats - Mapped to {} DTOs", chatDtos.size());

            logger.info("Successfully retrieved {} chats for user - UserID: {}, IP: {}", 
                    chats.size(), currentUserId, clientIp);
            securityLogger.info("User chats retrieved - UserID: {}, ChatCount: {}, IP: {}", 
                    currentUserId, chats.size(), clientIp);

            return ResponseEntity.ok(chatDtos);
        } catch (Exception e) {
            logger.error("getUserChats - Exception occurred: {}", e.getMessage(), e);
            
            logger.error("Error fetching user chats from IP: {}", clientIp, e);
            securityLogger.error("User chats fetch error - IP: {}, Error: {}", clientIp, e.getMessage());
            
            throw e;
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<ChatDto> getChatById(@PathVariable Long id) {
        String clientIp = getClientIp();
        
        logger.debug("Get chat by ID request - ChatID: {}, IP: {}", id, clientIp);
        // securityLogger.info("Chat details request from IP: {} for ChatID: {}", clientIp, id);
        
        logger.debug("getChatById - Starting method with ID: {}", id);
        
        try {
            // Validation checks
            if (id == null || id <= 0) {
                logger.warn("Invalid chat ID in request - ChatID: {}, IP: {}", id, clientIp);
                securityLogger.warn("Invalid chat ID in request - IP: {}", clientIp);
                throw new RuntimeException("Invalid chat ID");
            }

            logger.debug("Fetching chat details through service - ChatID: {}", id);

            Chat chat = chatService.getChatById(id);
            logger.debug("getChatById - Retrieved chat: {}, Title: {}", chat.getId(), maskChatTitle(chat.getTitle()));
            logger.debug("getChatById - Participants: {}", 
                    chat.getParticipants() != null ? chat.getParticipants().size() : "null");

            ChatDto responseDto = mapToDto(chat);
            logger.debug("getChatById - Mapped to DTO with ID: {}", responseDto.getId());
            
            logger.info("Successfully retrieved chat details - ChatID: {}, Title: {}, IP: {}", 
                    chat.getId(), maskChatTitle(chat.getTitle()), clientIp);
            securityLogger.info("Chat details retrieved - ChatID: {}, IP: {}", id, clientIp);
            
            return ResponseEntity.ok(responseDto);
        } catch (Exception e) {
            logger.error("getChatById - Exception occurred: {}", e.getMessage(), e);
            
            logger.error("Error fetching chat - ChatID: {}, IP: {}", id, clientIp, e);
            securityLogger.error("Chat fetch error - ChatID: {}, IP: {}, Error: {}", id, clientIp, e.getMessage());
            
            throw e;
        }
    }

    @PutMapping("/{id}/archive")
    public ResponseEntity<ChatDto> archiveChat(@PathVariable Long id) {
        String clientIp = getClientIp();
        
        logger.debug("Archive chat request - ChatID: {}, IP: {}", id, clientIp);
        // securityLogger.info("Chat archive request from IP: {} for ChatID: {}", clientIp, id);
        
        logger.debug("archiveChat - Starting method with ID: {}", id);
        
        try {
            // Validation checks
            if (id == null || id <= 0) {
                logger.warn("Invalid chat ID in archive request - ChatID: {}, IP: {}", id, clientIp);
                securityLogger.warn("Invalid chat ID in archive request - IP: {}", clientIp);
                throw new RuntimeException("Invalid chat ID");
            }

            logger.debug("Archiving chat through service - ChatID: {}", id);

            Chat chat = chatService.archiveChat(id);
            logger.debug("archiveChat - Chat archived: {}, Status: {}", chat.getId(), chat.getStatus());

            ChatDto responseDto = mapToDto(chat);
            logger.debug("archiveChat - Returning response with ID: {}", responseDto.getId());
            
            logger.info("Chat archived successfully - ChatID: {}, Status: {}, IP: {}", 
                    chat.getId(), chat.getStatus(), clientIp);
            // securityLogger.info("Chat archived - ChatID: {}, IP: {}", id, clientIp);
            
            return ResponseEntity.ok(responseDto);
        } catch (Exception e) {
            logger.error("archiveChat - Exception occurred: {}", e.getMessage(), e);
            
            logger.error("Error archiving chat - ChatID: {}, IP: {}", id, clientIp, e);
            securityLogger.error("Chat archive error - ChatID: {}, IP: {}, Error: {}", id, clientIp, e.getMessage());
            
            throw e;
        }
    }

    @PutMapping("/{id}/unarchive")
    public ResponseEntity<ChatDto> unarchiveChat(@PathVariable Long id) {
        String clientIp = getClientIp();
        
        logger.debug("Unarchive chat request - ChatID: {}, IP: {}", id, clientIp);
        // securityLogger.info("Chat unarchive request from IP: {} for ChatID: {}", clientIp, id);
        
        logger.debug("unarchiveChat - Starting method with ID: {}", id);
        
        try {
            // Validation checks
            if (id == null || id <= 0) {
                logger.warn("Invalid chat ID in unarchive request - ChatID: {}, IP: {}", id, clientIp);
                securityLogger.warn("Invalid chat ID in unarchive request - IP: {}", clientIp);
                throw new RuntimeException("Invalid chat ID");
            }

            logger.debug("Unarchiving chat through service - ChatID: {}", id);

            Chat chat = chatService.unarchiveChat(id);
            logger.debug("unarchiveChat - Chat unarchived: {}, Status: {}", chat.getId(), chat.getStatus());

            ChatDto responseDto = mapToDto(chat);
            logger.debug("unarchiveChat - Returning response with ID: {}", responseDto.getId());
            
            logger.info("Chat unarchived successfully - ChatID: {}, Status: {}, IP: {}", 
                    chat.getId(), chat.getStatus(), clientIp);
            // securityLogger.info("Chat unarchived - ChatID: {}, IP: {}", id, clientIp);
            
            return ResponseEntity.ok(responseDto);
        } catch (Exception e) {
            logger.error("unarchiveChat - Exception occurred: {}", e.getMessage(), e);
            
            logger.error("Error unarchiving chat - ChatID: {}, IP: {}", id, clientIp, e);
            securityLogger.error("Chat unarchive error - ChatID: {}, IP: {}, Error: {}", id, clientIp, e.getMessage());
            
            throw e;
        }
    }
    
    @PutMapping("/{id}/leave")
    public ResponseEntity<ChatDto> leaveChat(@PathVariable Long id) {
        String clientIp = getClientIp();
        
        logger.debug("Leave chat request - ChatID: {}, IP: {}", id, clientIp);
        // securityLogger.info("Leave chat request from IP: {} for ChatID: {}", clientIp, id);
        
        try {
            // Validation checks
            if (id == null || id <= 0) {
                logger.warn("Invalid chat ID in leave request - ChatID: {}, IP: {}", id, clientIp);
                securityLogger.warn("Invalid chat ID in leave request - IP: {}", clientIp);
                throw new RuntimeException("Invalid chat ID");
            }

            logger.debug("Processing leave chat through service - ChatID: {}", id);

            Chat chat = chatService.leaveChat(id);
            logger.debug("leaveChat - Chat processed: {}, Status: {}, Participants: {}", 
                    chat.getId(), chat.getStatus(), chat.getParticipants().size());

            ChatDto responseDto = mapToDto(chat);
            logger.debug("leaveChat - Returning response with ID: {}", responseDto.getId());
            
            logger.info("User left chat successfully - ChatID: {}, NewStatus: {}, IP: {}", 
                    chat.getId(), chat.getStatus(), clientIp);
            securityLogger.info("User left chat - ChatID: {}, IP: {}", id, clientIp);
            
            return ResponseEntity.ok(responseDto);
        } catch (Exception e) {
            logger.error("leaveChat - Exception occurred: {}", e.getMessage(), e);
            
            logger.error("Error leaving chat - ChatID: {}, IP: {}", id, clientIp, e);
            securityLogger.error("Leave chat error - ChatID: {}, IP: {}, Error: {}", id, clientIp, e.getMessage());
            
            throw e;
        }
    }

    private ChatDto mapToDto(Chat chat) {
        logger.trace("mapToDto - Mapping chat ID: {}", chat.getId());
        
        logger.trace("Mapping chat to DTO - ChatID: {}", chat.getId());
        
        ChatDto chatDto = new ChatDto();
        chatDto.setId(chat.getId());
        chatDto.setTitle(chat.getTitle());
        chatDto.setStatus(chat.getStatus());

        try {
            // Map participants to user IDs for the response
            if (chat.getParticipants() != null) {
                logger.trace("mapToDto - Participants count: {}", chat.getParticipants().size());
                List<Long> participantIds = chat.getParticipants().stream()
                        .map(User::getId)
                        .collect(Collectors.toList());
                chatDto.setParticipants(participantIds);
                logger.trace("mapToDto - Mapped participant IDs: {}", participantIds);
                
                logger.trace("Mapped {} participants for chat - ChatID: {}", participantIds.size(), chat.getId());
            } else {
                logger.trace("mapToDto - Participants is null");
                chatDto.setParticipants(null);
                
                logger.trace("No participants found for chat - ChatID: {}", chat.getId());
            }
        } catch (Exception e) {
            logger.warn("mapToDto - Exception mapping participants: {}", e.getMessage(), e);
            
            logger.warn("Error mapping participants for chat - ChatID: {}", chat.getId(), e);
            
            // Set empty list to avoid null pointer
            chatDto.setParticipants(List.of());
        }

        return chatDto;
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
            return ipAddress;
        } catch (Exception ex) {
            logger.error("Error retrieving client IP", ex);
            return "unknown";
        }
    }

    /**
     * Masks a chat title for privacy in logs
     * Shows first 3 characters plus "***"
     */
    private String maskChatTitle(String title) {
        if (title == null || title.isEmpty()) {
            return "null";
        }
        if (title.length() <= 3) {
            return "***";
        }
        return title.substring(0, 3) + "***";
    }
}