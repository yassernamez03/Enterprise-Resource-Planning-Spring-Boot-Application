package com.secureops.controller;

import com.secureops.dto.ChatDto;
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
    public ResponseEntity<ChatDto> createChat(@Valid @RequestBody ChatDto chatDto) {
        // Extract participant IDs from the DTO
        List<Long> participantIds = chatDto.getParticipants();

        // Create the chat using the service
        Chat chat = chatService.createChat(chatDto, participantIds);

        return new ResponseEntity<>(mapToDto(chat), HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<ChatDto>> getUserChats() {
        System.out.println("DEBUG - getUserChats - Starting method");
        try {
            Long currentUserId = userService.getCurrentUser().getId();
            System.out.println("DEBUG - getUserChats - Current user ID: " + currentUserId);

            List<Chat> chats = chatService.getUserChats(currentUserId);
            System.out
                    .println("DEBUG - getUserChats - Retrieved " + (chats != null ? chats.size() : "null") + " chats");

            if (chats != null) {
                for (Chat chat : chats) {
                    System.out
                            .println("DEBUG - getUserChats - Chat ID: " + chat.getId() + ", Title: " + chat.getTitle());
                    System.out.println("DEBUG - getUserChats - Participants: " +
                            (chat.getParticipants() != null ? chat.getParticipants().size() : "null"));
                }
            }

            List<ChatDto> chatDtos = chats.stream()
                    .map(this::mapToDto)
                    .collect(Collectors.toList());
            System.out.println("DEBUG - getUserChats - Mapped to " + chatDtos.size() + " DTOs");

            return ResponseEntity.ok(chatDtos);
        } catch (Exception e) {
            System.out.println("DEBUG - getUserChats - Exception occurred: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<ChatDto> getChatById(@PathVariable Long id) {
        System.out.println("DEBUG - getChatById - Starting method with ID: " + id);
        try {
            Chat chat = chatService.getChatById(id);
            System.out.println("DEBUG - getChatById - Retrieved chat: " + chat.getId() + ", Title: " + chat.getTitle());
            System.out.println("DEBUG - getChatById - Participants: " +
                    (chat.getParticipants() != null ? chat.getParticipants().size() : "null"));

            ChatDto responseDto = mapToDto(chat);
            System.out.println("DEBUG - getChatById - Mapped to DTO: " + responseDto);
            return ResponseEntity.ok(responseDto);
        } catch (Exception e) {
            System.out.println("DEBUG - getChatById - Exception occurred: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    @PutMapping("/{id}/archive")
    public ResponseEntity<ChatDto> archiveChat(@PathVariable Long id) {
        System.out.println("DEBUG - archiveChat - Starting method with ID: " + id);
        try {
            Chat chat = chatService.archiveChat(id);
            System.out
                    .println("DEBUG - archiveChat - Chat archived: " + chat.getId() + ", Status: " + chat.getStatus());

            ChatDto responseDto = mapToDto(chat);
            System.out.println("DEBUG - archiveChat - Returning response: " + responseDto);
            return ResponseEntity.ok(responseDto);
        } catch (Exception e) {
            System.out.println("DEBUG - archiveChat - Exception occurred: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    @PutMapping("/{id}/unarchive")
    public ResponseEntity<ChatDto> unarchiveChat(@PathVariable Long id) {
        System.out.println("DEBUG - unarchiveChat - Starting method with ID: " + id);
        try {
            Chat chat = chatService.unarchiveChat(id);
            System.out.println(
                    "DEBUG - unarchiveChat - Chat unarchived: " + chat.getId() + ", Status: " + chat.getStatus());

            ChatDto responseDto = mapToDto(chat);
            System.out.println("DEBUG - unarchiveChat - Returning response: " + responseDto);
            return ResponseEntity.ok(responseDto);
        } catch (Exception e) {
            System.out.println("DEBUG - unarchiveChat - Exception occurred: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }
    
    @PutMapping("/{id}/leave")
    public ResponseEntity<ChatDto> leaveChat(@PathVariable Long id) {
        System.out.println("DEBUG - leaveChat - Starting method with ID: " + id);
        try {
            Chat chat = chatService.leaveChat(id);
            System.out.println("DEBUG - leaveChat - Chat processed: " + chat.getId() + 
                               ", Status: " + chat.getStatus() + 
                               ", Participants: " + chat.getParticipants().size());

            ChatDto responseDto = mapToDto(chat);
            System.out.println("DEBUG - leaveChat - Returning response: " + responseDto);
            return ResponseEntity.ok(responseDto);
        } catch (Exception e) {
            System.out.println("DEBUG - leaveChat - Exception occurred: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    private ChatDto mapToDto(Chat chat) {
        System.out.println("DEBUG - mapToDto - Mapping chat ID: " + chat.getId());
        ChatDto chatDto = new ChatDto();
        chatDto.setId(chat.getId());
        chatDto.setTitle(chat.getTitle());
        chatDto.setStatus(chat.getStatus());

        try {
            // Map participants to user IDs for the response
            if (chat.getParticipants() != null) {
                System.out.println("DEBUG - mapToDto - Participants count: " + chat.getParticipants().size());
                List<Long> participantIds = chat.getParticipants().stream()
                        .map(User::getId)
                        .collect(Collectors.toList());
                chatDto.setParticipants(participantIds);
                System.out.println("DEBUG - mapToDto - Mapped participant IDs: " + participantIds);
            } else {
                System.out.println("DEBUG - mapToDto - Participants is null");
                chatDto.setParticipants(null);
            }
        } catch (Exception e) {
            System.out.println("DEBUG - mapToDto - Exception mapping participants: " + e.getMessage());
            e.printStackTrace();
            // Set empty list to avoid null pointer
            chatDto.setParticipants(List.of());
        }

        return chatDto;
    }
}