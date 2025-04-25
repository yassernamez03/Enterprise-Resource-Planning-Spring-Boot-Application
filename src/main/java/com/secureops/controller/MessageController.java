package com.secureops.controller;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
import com.secureops.service.MessageService;

@RestController
@RequestMapping("/api/messages")
public class MessageController {

    private final MessageService messageService;

    public MessageController(MessageService messageService) {
        this.messageService = messageService;
    }

    @GetMapping("/chat/{chatId}")
    public ResponseEntity<List<MessageDto>> getChatMessages(@PathVariable Long chatId) {
        try {
            List<Message> messages = messageService.getChatMessages(chatId);
            List<MessageDto> messageDtos = messages.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
            
            return ResponseEntity.ok(messageDtos);
        } catch (ResourceNotFoundException | UnauthorizedException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Error fetching messages: " + e.getMessage(), e);
        }
    }

    // Helper method to convert Message entity to DTO
    private MessageDto convertToDto(Message message) {
        if (message instanceof TextMessage) {
            TextMessage textMessage = (TextMessage) message;
            TextMessageDto dto = new TextMessageDto();
            dto.setId(textMessage.getId());
            dto.setContent(textMessage.getContent());
            dto.setTimestamp(textMessage.getTimestamp());
            dto.setReadStatus(textMessage.isReadStatus());
            dto.setSender(mapUserToDto(textMessage.getSender()));
            dto.setChatId(textMessage.getChat().getId());
            dto.setMessageType("TEXT");
            return dto;
        } else if (message instanceof FileMessage) {
            FileMessage fileMessage = (FileMessage) message;
            FileMessageDto dto = new FileMessageDto();
            dto.setId(fileMessage.getId());
            dto.setFileUrl(fileMessage.getFileUrl());
            dto.setFileName(fileMessage.getFileName());
            dto.setFileType(fileMessage.getFileType());
            dto.setFileSize(fileMessage.getFileSize());
            dto.setTimestamp(fileMessage.getTimestamp());
            dto.setReadStatus(fileMessage.isReadStatus());
            dto.setSender(mapUserToDto(fileMessage.getSender()));
            dto.setChatId(fileMessage.getChat().getId());
            dto.setMessageType("FILE");
            return dto;
        }
        throw new IllegalArgumentException("Unknown message type: " + message.getClass().getName());
    }

    // Helper method to map User to UserDto
    private UserDto mapUserToDto(User user) {
        UserDto dto = new UserDto();
        dto.setId(user.getId());
        dto.setFullName(user.getFullName());
        dto.setEmail(user.getEmail());
        dto.setActive(user.isActive());
        dto.setRole(user.getRole());
        dto.setApprovalStatus(user.getApprovalStatus());
        return dto;
    }

    // Other methods for sending messages, marking as read, etc.
}