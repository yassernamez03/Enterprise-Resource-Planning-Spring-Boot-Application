package com.secureops.controller;

import com.secureops.dto.ChatDto;
import com.secureops.dto.UserDto;
import com.secureops.entity.Chat;
import com.secureops.entity.User;
import com.secureops.service.ChatService;
import com.secureops.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/chats")
public class ChatController {

    private final ChatService chatService;
    private final UserService userService;

    public ChatController(ChatService chatService, UserService userService) {
        this.chatService = chatService;
        this.userService = userService;
    }

    @PostMapping
    public ResponseEntity<ChatDto> createChat(
            @Valid @RequestBody ChatDto chatDto,
            @RequestParam List<Long> participantIds) {
        Chat chat = chatService.createChat(chatDto, participantIds);
        return new ResponseEntity<>(mapToDto(chat), HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<ChatDto>> getUserChats() {
        Long currentUserId = userService.getCurrentUser().getId();
        List<ChatDto> chats = chatService.getUserChats(currentUserId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(chats);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ChatDto> getChatById(@PathVariable Long id) {
        Chat chat = chatService.getChatById(id);
        return ResponseEntity.ok(mapToDto(chat));
    }

    @PutMapping("/{id}/archive")
    public ResponseEntity<ChatDto> archiveChat(@PathVariable Long id) {
        Chat chat = chatService.archiveChat(id);
        return ResponseEntity.ok(mapToDto(chat));
    }

    private ChatDto mapToDto(Chat chat) {
        ChatDto chatDto = new ChatDto();
        chatDto.setId(chat.getId());
        chatDto.setTitle(chat.getTitle());
        chatDto.setStatus(chat.getStatus());
        
        // Map participants to UserDto
        List<UserDto> participants = chat.getParticipants().stream()
                .map(this::mapUserToDto)
                .collect(Collectors.toList());
        chatDto.setParticipants(participants);
        
        return chatDto;
    }
    
    private UserDto mapUserToDto(User user) {
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