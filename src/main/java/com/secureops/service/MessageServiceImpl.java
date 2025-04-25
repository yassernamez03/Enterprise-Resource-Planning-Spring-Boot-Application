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

    private final MessageRepository messageRepository;
    private final TextMessageRepository textMessageRepository;
    private final FileMessageRepository fileMessageRepository;
    private final ChatRepository chatRepository;
    private final UserRepository userRepository;
    private final LogService logService;
    private final FileStorageService fileStorageService;
    private final WebSocketService webSocketService; // New WebSocket service

    public MessageServiceImpl(MessageRepository messageRepository,
            TextMessageRepository textMessageRepository,
            FileMessageRepository fileMessageRepository,
            ChatRepository chatRepository,
            UserRepository userRepository,
            LogService logService,
            FileStorageService fileStorageService,
            WebSocketService webSocketService) { // Add WebSocket service to constructor
        this.messageRepository = messageRepository;
        this.textMessageRepository = textMessageRepository;
        this.fileMessageRepository = fileMessageRepository;
        this.chatRepository = chatRepository;
        this.userRepository = userRepository;
        this.logService = logService;
        this.fileStorageService = fileStorageService;
        this.webSocketService = webSocketService;
    }

    @Override
    @Transactional
    public Message sendTextMessage(TextMessageDto messageDto, Long chatId, Long userId) {
        // Verify chat exists
        Chat chat = chatRepository.findById(chatId)
                .orElseThrow(() -> new ResourceNotFoundException("Chat", "id", chatId));

        // Verify user exists
        User sender = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        // Verify user is a participant in the chat
        if (chat.getParticipants().stream().noneMatch(p -> p.getId().equals(userId))) {
            throw new UnauthorizedException("You are not a participant in this chat");
        }

        // Verify chat is active
        if (chat.getStatus() != Chat.ChatStatus.ACTIVE) {
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

        // Log message creation - with safe IP determination
        String clientIp;
        try {
            clientIp = getClientIp();
        } catch (Exception e) {
            // If we can't get the client IP (e.g., in a WebSocket context), use a
            // placeholder
            clientIp = "WebSocket-" + userId;
        }

        logService.createLog(
                AppConstants.LOG_ACTION_CREATE,
                "Text message sent in chat: " + chat.getTitle(),
                clientIp,
                AppConstants.LOG_TYPE_CHAT,
                userId);

        // Broadcast the message to all participants via WebSocket
        TextMessageDto responseDto = new TextMessageDto();
        responseDto.setId(savedMessage.getId());
        responseDto.setContent(savedMessage.getContent());
        responseDto.setTimestamp(savedMessage.getTimestamp());
        responseDto.setReadStatus(savedMessage.isReadStatus());
        responseDto.setSender(mapUserToDto(sender));
        responseDto.setChatId(chatId);
        responseDto.setMessageType("TEXT");

        webSocketService.broadcastMessage(chatId, savedMessage, responseDto);

        return savedMessage;
    }

    @Override
    @Transactional
    public Message sendFileMessage(FileMessageDto messageDto, Long chatId, Long userId) {
        // Verify chat exists
        Chat chat = chatRepository.findById(chatId)
                .orElseThrow(() -> new ResourceNotFoundException("Chat", "id", chatId));

        // Verify user exists
        User sender = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        // Verify user is a participant in the chat
        if (chat.getParticipants().stream().noneMatch(p -> p.getId().equals(userId))) {
            throw new UnauthorizedException("You are not a participant in this chat");
        }

        // Verify chat is active
        if (chat.getStatus() != Chat.ChatStatus.ACTIVE) {
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

        // Log message creation
        logService.createLog(
                AppConstants.LOG_ACTION_CREATE,
                "File message sent in chat: " + chat.getTitle(),
                getClientIp(),
                AppConstants.LOG_TYPE_CHAT,
                userId);

        // Broadcast the message to all participants via WebSocket
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

        webSocketService.broadcastMessage(chatId, savedMessage, responseDto);

        return savedMessage;
    }

    @Override
    public List<Message> getChatMessages(Long chatId) {
        // Verify chat exists
        Chat chat = chatRepository.findById(chatId)
                .orElseThrow(() -> new ResourceNotFoundException("Chat", "id", chatId));

        // Verify user is a participant in the chat
        User currentUser = getCurrentUser();
        if (chat.getParticipants().stream().noneMatch(p -> p.getId().equals(currentUser.getId()))) {
            throw new UnauthorizedException("You are not a participant in this chat");
        }

        return messageRepository.findByChatId(chatId);
    }

    @Override
    public Page<Message> getChatMessagesPageable(Long chatId, int page, int size) {
        // Verify chat exists
        Chat chat = chatRepository.findById(chatId)
                .orElseThrow(() -> new ResourceNotFoundException("Chat", "id", chatId));

        // Verify user is a participant in the chat
        User currentUser = getCurrentUser();
        if (chat.getParticipants().stream().noneMatch(p -> p.getId().equals(currentUser.getId()))) {
            throw new UnauthorizedException("You are not a participant in this chat");
        }

        Pageable pageable = PageRequest.of(page, size, Sort.by("timestamp").descending());
        return messageRepository.findAll(pageable);
    }

    @Override
    @Transactional
    public void markAsRead(Long messageId) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message", "id", messageId));

        // Verify user is a participant in the chat
        User currentUser = getCurrentUser();
        if (message.getChat().getParticipants().stream().noneMatch(p -> p.getId().equals(currentUser.getId()))) {
            throw new UnauthorizedException("You are not a participant in this chat");
        }

        // Don't mark own messages as read
        if (message.getSender().getId().equals(currentUser.getId())) {
            return;
        }

        message.setReadStatus(true);
        Message updatedMessage = messageRepository.save(message);

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
            return; // Unknown message type
        }

        webSocketService.broadcastMessageRead(message.getChat().getId(), messageDto);
    }

    @Override
    public ResponseEntity<Resource> getFileResourceByMessageId(Long messageId) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message", "id", messageId));

        // Verify this is a file message
        if (!(message instanceof FileMessage)) {
            throw new BadRequestException("Message is not a file message");
        }

        // Verify user is a participant in the chat
        User currentUser = getCurrentUser();
        if (message.getChat().getParticipants().stream().noneMatch(p -> p.getId().equals(currentUser.getId()))) {
            throw new UnauthorizedException("You are not a participant in this chat");
        }

        FileMessage fileMessage = (FileMessage) message;
        String fileName = extractFileNameFromUrl(fileMessage.getFileUrl());

        // Load file as Resource
        Resource resource = fileStorageService.loadFileAsResource(fileName);

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(fileMessage.getFileType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileMessage.getFileName() + "\"")
                .body(resource);
    }

    private String extractFileNameFromUrl(String fileUrl) {
        return fileUrl.substring(fileUrl.lastIndexOf("/") + 1);
    }

    private User getCurrentUser() {
        org.springframework.security.core.Authentication authentication = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            String email = authentication.getName();
            return userRepository.findByEmail(email)
                    .orElseThrow(() -> new UnauthorizedException("User not found"));
        }
        throw new UnauthorizedException("Not authenticated");
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
            return ipAddress;
        } catch (IllegalStateException e) {
            // No HTTP request context available (e.g., in WebSocket context)
            return "WebSocket-Client";
        }
    }

    private com.secureops.dto.UserDto mapUserToDto(User user) {
        com.secureops.dto.UserDto userDto = new com.secureops.dto.UserDto();
        userDto.setId(user.getId());
        userDto.setFullName(user.getFullName());
        userDto.setEmail(user.getEmail());
        userDto.setActive(user.isActive());
        userDto.setRole(user.getRole());
        userDto.setApprovalStatus(user.getApprovalStatus());
        return userDto;
    }
}