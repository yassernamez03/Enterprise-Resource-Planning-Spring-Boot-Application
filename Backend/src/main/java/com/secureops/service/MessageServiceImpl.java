package com.secureops.service;

import com.secureops.dto.FileMessageDto;
import com.secureops.dto.MessageDto;
import com.secureops.dto.TextMessageDto;
import com.secureops.entity.Chat;
import com.secureops.entity.FileMessage;
import com.secureops.entity.Message;
import com.secureops.entity.TextMessage;
import com.secureops.entity.User;
import com.secureops.exception.BadRequestException;
import com.secureops.exception.ResourceNotFoundException;
import com.secureops.exception.UnauthorizedException;
import com.secureops.repository.ChatRepository;
import com.secureops.repository.FileMessageRepository;
import com.secureops.repository.MessageRepository;
import com.secureops.repository.TextMessageRepository;
import com.secureops.repository.UserRepository;
import com.secureops.util.AppConstants;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import jakarta.servlet.http.HttpServletRequest;
import java.util.List;

@Service
public class MessageServiceImpl implements MessageService {

    private static final Logger logger = LoggerFactory.getLogger(MessageServiceImpl.class);
    private static final Logger securityLogger = LoggerFactory.getLogger("com.secureops.security");

    private final MessageRepository messageRepository;
    private final TextMessageRepository textMessageRepository;
    private final FileMessageRepository fileMessageRepository;
    private final ChatRepository chatRepository;
    private final UserRepository userRepository;
    private final LogService logService;
    private final FileStorageService fileStorageService;
    private final WebSocketService webSocketService;

    public MessageServiceImpl(MessageRepository messageRepository,
            TextMessageRepository textMessageRepository,
            FileMessageRepository fileMessageRepository,
            ChatRepository chatRepository,
            UserRepository userRepository,
            LogService logService,
            FileStorageService fileStorageService,
            WebSocketService webSocketService) {
        this.messageRepository = messageRepository;
        this.textMessageRepository = textMessageRepository;
        this.fileMessageRepository = fileMessageRepository;
        this.chatRepository = chatRepository;
        this.userRepository = userRepository;
        this.logService = logService;
        this.fileStorageService = fileStorageService;
        this.webSocketService = webSocketService;
        logger.info("MessageServiceImpl initialized");
    }

    @Override
    @Transactional
    public Message sendTextMessage(TextMessageDto messageDto, Long chatId, Long userId) {
        String clientIp = getClientIp();
        logger.debug("Attempting to send text message in chatId: {} by userId: {}", chatId, userId);
        
        try {
            // Verify chat exists
            Chat chat = chatRepository.findById(chatId)
                    .orElseThrow(() -> {
                        logger.warn("Chat not found: {}", chatId);
                        securityLogger.warn("Attempt to send message to non-existent chat: {} from IP: {}", chatId, clientIp);
                        return new ResourceNotFoundException("Chat", "id", chatId);
                    });

            // Verify user exists
            User sender = userRepository.findById(userId)
                    .orElseThrow(() -> {
                        logger.warn("User not found: {}", userId);
                        securityLogger.warn("Attempt to send message by non-existent user: {} from IP: {}", userId, clientIp);
                        return new ResourceNotFoundException("User", "id", userId);
                    });

            // Verify user is a participant in the chat
            if (chat.getParticipants().stream().noneMatch(p -> p.getId().equals(userId))) {
                logger.warn("User {} is not a participant in chat {}", userId, chatId);
                securityLogger.warn("Unauthorized message attempt by userId: {} in chat: {} from IP: {}", userId, chatId, clientIp);
                throw new UnauthorizedException("You are not a participant in this chat");
            }

            // Verify chat is active
            if (chat.getStatus() != Chat.ChatStatus.ACTIVE) {
                logger.warn("Attempt to send message to archived chat: {}", chatId);
                throw new BadRequestException("Cannot send messages to an archived chat");
            }

            // Create text message
            TextMessage message = new TextMessage();
            message.setContent(messageDto.getContent());
            message.setTimestamp(new java.util.Date());
            message.setReadStatus(false);
            message.setSender(sender);
            message.setChat(chat);

            TextMessage savedMessage = textMessageRepository.save(message);
            logger.info("Text message sent successfully in chat: {} by userId: {}", chatId, userId);

            // Log message creation
            logService.createLog(
                    AppConstants.LOG_ACTION_CREATE,
                    "Text message sent in chat: " + chat.getTitle(),
                    clientIp,
                    AppConstants.LOG_TYPE_CHAT,
                    userId);

            // Broadcast the message via WebSocket
            TextMessageDto responseDto = new TextMessageDto();
            responseDto.setId(savedMessage.getId());
            responseDto.setContent(savedMessage.getContent());
            responseDto.setTimestamp(savedMessage.getTimestamp());
            responseDto.setReadStatus(savedMessage.isReadStatus());
            responseDto.setSender(mapUserToDto(sender));
            responseDto.setChatId(chatId);
            responseDto.setMessageType("TEXT");

            logger.debug("Broadcasting text message to chat: {}", chatId);
            webSocketService.broadcastMessage(chatId, savedMessage, responseDto);

            return savedMessage;

        } catch (ResourceNotFoundException | UnauthorizedException | BadRequestException ex) {
            throw ex; // Already logged
        } catch (Exception ex) {
            logger.error("Unexpected error sending text message in chat: {} by user: {}", chatId, userId, ex);
            securityLogger.error("Error sending text message - chatId: {}, userId: {}, IP: {}, Error: {}", 
                    chatId, userId, clientIp, ex.getMessage());
            throw ex;
        }
    }

    @Override
    @Transactional
    public Message sendFileMessage(FileMessageDto messageDto, Long chatId, Long userId) {
        String clientIp = getClientIp();
        logger.debug("Attempting to send file message in chatId: {} by userId: {}", chatId, userId);
        
        try {
            // Verify chat exists
            Chat chat = chatRepository.findById(chatId)
                    .orElseThrow(() -> {
                        logger.warn("Chat not found: {}", chatId);
                        securityLogger.warn("Attempt to send file message to non-existent chat: {} from IP: {}", chatId, clientIp);
                        return new ResourceNotFoundException("Chat", "id", chatId);
                    });

            // Verify user exists
            User sender = userRepository.findById(userId)
                    .orElseThrow(() -> {
                        logger.warn("User not found: {}", userId);
                        securityLogger.warn("Attempt to send file message by non-existent user: {} from IP: {}", userId, clientIp);
                        return new ResourceNotFoundException("User", "id", userId);
                    });

            // Verify user is a participant in the chat
            if (chat.getParticipants().stream().noneMatch(p -> p.getId().equals(userId))) {
                logger.warn("User {} is not a participant in chat {}", userId, chatId);
                securityLogger.warn("Unauthorized file message attempt by userId: {} in chat: {} from IP: {}", userId, chatId, clientIp);
                throw new UnauthorizedException("You are not a participant in this chat");
            }

            // Verify chat is active
            if (chat.getStatus() != Chat.ChatStatus.ACTIVE) {
                logger.warn("Attempt to send file message to archived chat: {}", chatId);
                throw new BadRequestException("Cannot send messages to an archived chat");
            }

            // Create file message
            FileMessage message = new FileMessage();
            message.setFileUrl(messageDto.getFileUrl());
            message.setFileName(messageDto.getFileName());
            message.setFileType(messageDto.getFileType());
            message.setFileSize(messageDto.getFileSize());
            message.setTimestamp(new java.util.Date());
            message.setReadStatus(false);
            message.setSender(sender);
            message.setChat(chat);

            FileMessage savedMessage = fileMessageRepository.save(message);
            logger.info("File message sent successfully in chat: {} by userId: {}, file: {}", 
                    chatId, userId, messageDto.getFileName());

            // Log message creation
            logService.createLog(
                    AppConstants.LOG_ACTION_CREATE,
                    "File message sent in chat: " + chat.getTitle(),
                    clientIp,
                    AppConstants.LOG_TYPE_CHAT,
                    userId);

            // Broadcast the message via WebSocket
            FileMessageDto responseDto = new FileMessageDto();
            responseDto.setId(savedMessage.getId());
            responseDto.setFileUrl(savedMessage.getFileUrl());
            responseDto.setFileName(savedMessage.getFileName());
            responseDto.setFileType(savedMessage.getFileType());
            responseDto.setFileSize(savedMessage.getFileSize());
            responseDto.setTimestamp(savedMessage.getTimestamp());
            responseDto.setReadStatus(savedMessage.isReadStatus());
            responseDto.setSender(mapUserToDto(sender));
            responseDto.setChatId(chatId);
            responseDto.setMessageType("FILE");

            logger.debug("Broadcasting file message to chat: {}", chatId);
            webSocketService.broadcastMessage(chatId, savedMessage, responseDto);

            return savedMessage;

        } catch (ResourceNotFoundException | UnauthorizedException | BadRequestException ex) {
            throw ex; // Already logged
        } catch (Exception ex) {
            logger.error("Unexpected error sending file message in chat: {} by user: {}", chatId, userId, ex);
            securityLogger.error("Error sending file message - chatId: {}, userId: {}, IP: {}, Error: {}", 
                    chatId, userId, clientIp, ex.getMessage());
            throw ex;
        }
    }

    @Override
    public List<Message> getChatMessages(Long chatId) {
        String clientIp = getClientIp();
        logger.debug("Retrieving messages for chatId: {}", chatId);
        
        try {
            // Verify chat exists
            Chat chat = chatRepository.findById(chatId)
                    .orElseThrow(() -> {
                        logger.warn("Chat not found: {}", chatId);
                        securityLogger.warn("Attempt to retrieve messages from non-existent chat: {} from IP: {}", chatId, clientIp);
                        return new ResourceNotFoundException("Chat", "id", chatId);
                    });

            // Verify user is a participant
            User currentUser = getCurrentUser();
            if (chat.getParticipants().stream().noneMatch(p -> p.getId().equals(currentUser.getId()))) {
                logger.warn("User {} is not a participant in chat {}", currentUser.getId(), chatId);
                securityLogger.warn("Unauthorized access attempt to chat messages by userId: {} in chat: {} from IP: {}", 
                        currentUser.getId(), chatId, clientIp);
                throw new UnauthorizedException("You are not a participant in this chat");
            }

            List<Message> messages = messageRepository.findByChatId(chatId);
            logger.info("Retrieved {} messages for chat: {}", messages.size(), chatId);
            return messages;

        } catch (ResourceNotFoundException | UnauthorizedException ex) {
            throw ex; // Already logged
        } catch (Exception ex) {
            logger.error("Unexpected error retrieving messages for chat: {}", chatId, ex);
            securityLogger.error("Error retrieving chat messages - chatId: {}, IP: {}, Error: {}", 
                    chatId, clientIp, ex.getMessage());
            throw ex;
        }
    }

    @Override
    public Page<Message> getChatMessagesPageable(Long chatId, int page, int size) {
        String clientIp = getClientIp();
        logger.debug("Retrieving pageable messages for chatId: {}, page: {}, size: {}", chatId, page, size);
        
        try {
            // Verify chat exists
            Chat chat = chatRepository.findById(chatId)
                    .orElseThrow(() -> {
                        logger.warn("Chat not found: {}", chatId);
                        securityLogger.warn("Attempt to retrieve pageable messages from non-existent chat: {} from IP: {}", chatId, clientIp);
                        return new ResourceNotFoundException("Chat", "id", chatId);
                    });

            // Verify user is a participant
            User currentUser = getCurrentUser();
            if (chat.getParticipants().stream().noneMatch(p -> p.getId().equals(currentUser.getId()))) {
                logger.warn("User {} is not a participant in chat {}", currentUser.getId(), chatId);
                securityLogger.warn("Unauthorized access attempt to pageable chat messages by userId: {} in chat: {} from IP: {}", 
                        currentUser.getId(), chatId, clientIp);
                throw new UnauthorizedException("You are not a participant in this chat");
            }

            Pageable pageable = PageRequest.of(page, size, Sort.by("timestamp").descending());
            Page<Message> messages = messageRepository.findAll(pageable);
            logger.info("Retrieved pageable messages for chat: {}, page: {}, size: {}, total: {}", 
                    chatId, page, size, messages.getTotalElements());
            return messages;

        } catch (ResourceNotFoundException | UnauthorizedException ex) {
            throw ex; // Already logged
        } catch (Exception ex) {
            logger.error("Unexpected error retrieving pageable messages for chat: {}", chatId, ex);
            securityLogger.error("Error retrieving pageable chat messages - chatId: {}, IP: {}, Error: {}", 
                    chatId, clientIp, ex.getMessage());
            throw ex;
        }
    }

    @Override
    @Transactional
    public void markAsRead(Long messageId) {
        String clientIp = getClientIp();
        logger.debug("Attempting to mark message as read: {}", messageId);
        
        try {
            Message message = messageRepository.findById(messageId)
                    .orElseThrow(() -> {
                        logger.warn("Message not found: {}", messageId);
                        securityLogger.warn("Attempt to mark non-existent message as read: {} from IP: {}", messageId, clientIp);
                        return new ResourceNotFoundException("Message", "id", messageId);
                    });

            // Verify user is a participant
            User currentUser = getCurrentUser();
            if (message.getChat().getParticipants().stream().noneMatch(p -> p.getId().equals(currentUser.getId()))) {
                logger.warn("User {} is not a participant in chat for message {}", currentUser.getId(), messageId);
                securityLogger.warn("Unauthorized attempt to mark message as read by userId: {} for message: {} from IP: {}", 
                        currentUser.getId(), messageId, clientIp);
                throw new UnauthorizedException("You are not a participant in this chat");
            }

            // Don't mark own messages as read
            if (message.getSender().getId().equals(currentUser.getId())) {
                logger.debug("Skipping read status update for own message: {} by user: {}", messageId, currentUser.getId());
                return;
            }

            message.setReadStatus(true);
            Message updatedMessage = messageRepository.save(message);
            logger.info("Message marked as read: {} by user: {}", messageId, currentUser.getId());

            // Broadcast the read status update via WebSocket
            MessageDto messageDto;
            if (message instanceof TextMessage) {
                TextMessage textMessage = (TextMessage) message;
                TextMessageDto dto = new TextMessageDto();
                dto.setId(textMessage.getId());
                dto.setContent(textMessage.getContent());
                dto.setTimestamp(textMessage.getTimestamp());
                dto.setReadStatus(true);
                dto.setSender(mapUserToDto(textMessage.getSender()));
                dto.setChatId(textMessage.getChat().getId());
                dto.setMessageType("TEXT");
                messageDto = dto;
            } else if (message instanceof FileMessage) {
                FileMessage fileMessage = (FileMessage) message;
                FileMessageDto dto = new FileMessageDto();
                dto.setId(fileMessage.getId());
                dto.setFileUrl(fileMessage.getFileUrl());
                dto.setFileName(fileMessage.getFileName());
                dto.setFileType(fileMessage.getFileType());
                dto.setFileSize(fileMessage.getFileSize());
                dto.setTimestamp(fileMessage.getTimestamp());
                dto.setReadStatus(true);
                dto.setSender(mapUserToDto(fileMessage.getSender()));
                dto.setChatId(fileMessage.getChat().getId());
                dto.setMessageType("FILE");
                messageDto = dto;
            } else {
                logger.warn("Unknown message type for message: {}", messageId);
                return;
            }

            logger.debug("Broadcasting read status update for message: {}", messageId);
            webSocketService.broadcastMessageRead(message.getChat().getId(), messageDto);

        } catch (ResourceNotFoundException | UnauthorizedException ex) {
            throw ex; // Already logged
        } catch (Exception ex) {
            logger.error("Unexpected error marking message as read: {}", messageId, ex);
            securityLogger.error("Error marking message as read - messageId: {}, IP: {}, Error: {}", 
                    messageId, clientIp, ex.getMessage());
            throw ex;
        }
    }

    @Override
    public ResponseEntity<Resource> getFileResourceByMessageId(Long messageId) {
        String clientIp = getClientIp();
        logger.debug("Attempting to retrieve file resource for messageId: {}", messageId);
        
        try {
            Message message = messageRepository.findById(messageId)
                    .orElseThrow(() -> {
                        logger.warn("Message not found: {}", messageId);
                        securityLogger.warn("Attempt to retrieve file from non-existent message: {} from IP: {}", messageId, clientIp);
                        return new ResourceNotFoundException("Message", "id", messageId);
                    });

            // Verify this is a file message
            if (!(message instanceof FileMessage)) {
                logger.warn("Message is not a file message: {}", messageId);
                throw new BadRequestException("Message is not a file message");
            }

            // Verify user is a participant
            User currentUser = getCurrentUser();
            if (message.getChat().getParticipants().stream().noneMatch(p -> p.getId().equals(currentUser.getId()))) {
                logger.warn("User {} is not a participant in chat for message {}", currentUser.getId(), messageId);
                securityLogger.warn("Unauthorized attempt to retrieve file by userId: {} for message: {} from IP: {}", 
                        currentUser.getId(), messageId, clientIp);
                throw new UnauthorizedException("You are not a participant in this chat");
            }

            FileMessage fileMessage = (FileMessage) message;
            String fileName = extractFileNameFromUrl(fileMessage.getFileUrl());

            // Load file as Resource
            Resource resource = fileStorageService.loadFileAsResource(fileName);
            logger.info("File resource retrieved successfully for message: {}, file: {}", messageId, fileName);

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(fileMessage.getFileType()))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileMessage.getFileName() + "\"")
                    .body(resource);

        } catch (ResourceNotFoundException | UnauthorizedException | BadRequestException ex) {
            throw ex; // Already logged
        } catch (Exception ex) {
            logger.error("Unexpected error retrieving file resource for message: {}", messageId, ex);
            securityLogger.error("Error retrieving file resource - messageId: {}, IP: {}, Error: {}", 
                    messageId, clientIp, ex.getMessage());
            throw ex;
        }
    }

    private String extractFileNameFromUrl(String fileUrl) {
        logger.debug("Extracting filename from URL: {}", fileUrl);
        String fileName = fileUrl.substring(fileUrl.lastIndexOf("/") + 1);
        logger.debug("Extracted filename: {}", fileName);
        return fileName;
    }

    private User getCurrentUser() {
        logger.debug("Retrieving current authenticated user");
        try {
            org.springframework.security.core.Authentication authentication = org.springframework.security.core.context.SecurityContextHolder
                    .getContext().getAuthentication();
            if (authentication != null && authentication.isAuthenticated()) {
                String email = authentication.getName();
                User user = userRepository.findByEmail(email)
                        .orElseThrow(() -> {
                            logger.warn("Authenticated user not found in database: {}", maskEmail(email));
                            securityLogger.warn("Authenticated user not found: {} from IP: {}", maskEmail(email), getClientIp());
                            return new UnauthorizedException("User not found");
                        });
                logger.debug("Current user retrieved: {}", maskEmail(email));
                return user;
            }
            logger.warn("No authenticated user found");
            securityLogger.warn("No authenticated user - IP: {}", getClientIp());
            throw new UnauthorizedException("Not authenticated");
        } catch (Exception ex) {
            logger.error("Error retrieving current user", ex);
            throw ex;
        }
    }

    private String getClientIp() {
        try {
            HttpServletRequest request = ((ServletRequestAttributes) RequestContextHolder.currentRequestAttributes()).getRequest();
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
            logger.debug("No HTTP request context available, returning WebSocket-Client");
            return "WebSocket-Client";
        } catch (Exception ex) {
            logger.error("Error retrieving client IP", ex);
            return "unknown";
        }
    }

    private com.secureops.dto.UserDto mapUserToDto(User user) {
        logger.debug("Mapping user to DTO: {}", maskEmail(user.getEmail()));
        com.secureops.dto.UserDto userDto = new com.secureops.dto.UserDto();
        userDto.setId(user.getId());
        userDto.setFullName(user.getFullName());
        userDto.setEmail(user.getEmail());
        userDto.setActive(user.isActive());
        userDto.setRole(user.getRole());
        userDto.setApprovalStatus(user.getApprovalStatus());
        return userDto;
    }

    /**
     * Masks an email address for privacy in logs
     * Converts user@example.com to u***@e***.com
     */
    private String maskEmail(String email) {
        if (email == null || email.isEmpty() || !email.contains("@")) {
            return email;
        }
        
        String[] parts = email.split("@");
        String username = parts[0];
        String domain = parts[1];
        
        String maskedUsername = username.substring(0, 1) + "***";
        
        String[] domainParts = domain.split("\\.");
        String domainName = domainParts[0];
        String tld = domainParts.length > 1 ? domainParts[domainParts.length - 1] : "";
        
        String maskedDomain = domainName.substring(0, 1) + "***";
        
        return maskedUsername + "@" + maskedDomain + "." + tld;
    }
}