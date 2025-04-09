package com.secureops.service;

import com.secureops.dto.FileMessageDto;
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

    public MessageServiceImpl(MessageRepository messageRepository,
                             TextMessageRepository textMessageRepository,
                             FileMessageRepository fileMessageRepository,
                             ChatRepository chatRepository,
                             UserRepository userRepository,
                             LogService logService,
                             FileStorageService fileStorageService) {
        this.messageRepository = messageRepository;
        this.textMessageRepository = textMessageRepository;
        this.fileMessageRepository = fileMessageRepository;
        this.chatRepository = chatRepository;
        this.userRepository = userRepository;
        this.logService = logService;
        this.fileStorageService = fileStorageService;
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
        
        // Log message creation
        logService.createLog(
                AppConstants.LOG_ACTION_CREATE,
                "Text message sent in chat: " + chat.getTitle(),
                getClientIp(),
                AppConstants.LOG_TYPE_CHAT,
                userId
        );
        
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
                userId
        );
        
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
        messageRepository.save(message);
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
        org.springframework.security.core.Authentication authentication = 
                org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            String email = authentication.getName();
            return userRepository.findByEmail(email)
                    .orElseThrow(() -> new UnauthorizedException("User not found"));
        }
        throw new UnauthorizedException("Not authenticated");
    }
    
    private String getClientIp() {
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
    }
}