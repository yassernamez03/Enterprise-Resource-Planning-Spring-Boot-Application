package com.secureops.controller;

import com.secureops.dto.*;
import com.secureops.entity.FileMessage;
import com.secureops.entity.Message;
import com.secureops.entity.TextMessage;
import com.secureops.service.FileStorageService;
import com.secureops.service.MessageService;
import com.secureops.service.UserService;
import jakarta.validation.Valid;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/messages")
public class MessageController {

    private final MessageService messageService;
    private final UserService userService;
    private final FileStorageService fileStorageService;

    public MessageController(MessageService messageService,
                            UserService userService,
                            FileStorageService fileStorageService) {
        this.messageService = messageService;
        this.userService = userService;
        this.fileStorageService = fileStorageService;
    }

    @PostMapping("/{chatId}/text")
    public ResponseEntity<MessageDto> sendTextMessage(
            @PathVariable Long chatId,
            @Valid @RequestBody TextMessageDto messageDto) {
        Long currentUserId = userService.getCurrentUser().getId();
        Message message = messageService.sendTextMessage(messageDto, chatId, currentUserId);
        return new ResponseEntity<>(mapToDto(message), HttpStatus.CREATED);
    }

    @PostMapping("/{chatId}/file")
    public ResponseEntity<MessageDto> sendFileMessage(
            @PathVariable Long chatId,
            @RequestParam("file") MultipartFile file) {
        Long currentUserId = userService.getCurrentUser().getId();
        
        // Store the file
        String fileName = fileStorageService.storeFile(file);
        String fileUrl = ServletUriComponentsBuilder.fromCurrentContextPath()
                .path("/api/files/download/")
                .path(fileName)
                .toUriString();
        
        // Create the FileMessageDto
        FileMessageDto messageDto = new FileMessageDto();
        messageDto.setFileName(file.getOriginalFilename());
        messageDto.setFileUrl(fileUrl);
        messageDto.setFileType(file.getContentType());
        messageDto.setFileSize(file.getSize());
        
        Message message = messageService.sendFileMessage(messageDto, chatId, currentUserId);
        return new ResponseEntity<>(mapToDto(message), HttpStatus.CREATED);
    }

    @GetMapping("/chat/{chatId}")
    public ResponseEntity<List<MessageDto>> getChatMessages(@PathVariable Long chatId) {
        List<MessageDto> messages = messageService.getChatMessages(chatId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(messages);
    }

    @GetMapping("/chat/{chatId}/page")
    public ResponseEntity<PageResponseDto<MessageDto>> getChatMessagesPageable(
            @PathVariable Long chatId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<Message> messagesPage = messageService.getChatMessagesPageable(chatId, page, size);
        
        List<MessageDto> messageDtos = messagesPage.getContent().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
        
        PageResponseDto<MessageDto> pageResponse = new PageResponseDto<>();
        pageResponse.setContent(messageDtos);
        pageResponse.setPage(messagesPage.getNumber());
        pageResponse.setSize(messagesPage.getSize());
        pageResponse.setTotalElements(messagesPage.getTotalElements());
        pageResponse.setTotalPages(messagesPage.getTotalPages());
        
        return ResponseEntity.ok(pageResponse);
    }

    @PutMapping("/{messageId}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable Long messageId) {
        messageService.markAsRead(messageId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/file/{messageId}")
    public ResponseEntity<Resource> downloadFileFromMessage(@PathVariable Long messageId) {
        return messageService.getFileResourceByMessageId(messageId);
    }

    private MessageDto mapToDto(Message message) {
        if (message instanceof TextMessage) {
            TextMessage textMessage = (TextMessage) message;
            TextMessageDto dto = new TextMessageDto();
            
            dto.setId(textMessage.getId());
            dto.setTimestamp(textMessage.getTimestamp());
            dto.setReadStatus(textMessage.isReadStatus());
            dto.setSender(mapUserToDto(textMessage.getSender()));
            dto.setChatId(textMessage.getChat().getId());
            dto.setMessageType("TEXT");
            dto.setContent(textMessage.getContent());
            
            return dto;
        } else if (message instanceof FileMessage) {
            FileMessage fileMessage = (FileMessage) message;
            FileMessageDto dto = new FileMessageDto();
            
            dto.setId(fileMessage.getId());
            dto.setTimestamp(fileMessage.getTimestamp());
            dto.setReadStatus(fileMessage.isReadStatus());
            dto.setSender(mapUserToDto(fileMessage.getSender()));
            dto.setChatId(fileMessage.getChat().getId());
            dto.setMessageType("FILE");
            dto.setFileUrl(fileMessage.getFileUrl());
            dto.setFileName(fileMessage.getFileName());
            dto.setFileType(fileMessage.getFileType());
            dto.setFileSize(fileMessage.getFileSize());
            
            return dto;
        }
        
        return null;
    }
    
    private UserDto mapUserToDto(com.secureops.entity.User user) {
        UserDto userDto = new UserDto();
        userDto.setId(user.getId());
        userDto.setFullName(user.getFullName());
        userDto.setEmail(user.getEmail());
        userDto.setActive(user.isActive());
        userDto.setRole(user.getRole());
        userDto.setApprovalStatus(user.getApprovalStatus());
        return userDto;
    }
}