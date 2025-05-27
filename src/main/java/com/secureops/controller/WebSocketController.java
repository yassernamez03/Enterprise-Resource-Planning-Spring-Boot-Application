package com.secureops.controller;

import com.secureops.dto.MessageDto;
import com.secureops.dto.TextMessageDto;
import com.secureops.dto.FileMessageDto;
import com.secureops.entity.User;
import com.secureops.repository.UserRepository;
import com.secureops.service.MessageService;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Controller;

@Controller
public class WebSocketController {

    private final UserRepository userRepository;
    private final MessageService messageService;

    public WebSocketController(UserRepository userRepository, MessageService messageService) {
        this.userRepository = userRepository;
        this.messageService = messageService;
    }

    @MessageMapping("/chat/{chatId}/sendMessage")
    public void sendMessage(@DestinationVariable Long chatId,
                           @Payload MessageDto messageDto,
                           SimpMessageHeaderAccessor headerAccessor) {
        try {
            System.out.println("Received message DTO: " + messageDto.toString());
            System.out.println("Raw message type: " + messageDto.getMessageType());
            if (messageDto.getMessageType() == null) {
                System.err.println("Warning: messageType is null, attempting to infer");
            }

            String messageType = messageDto.getMessageType();
            if (messageType == null) {
                if (messageDto instanceof TextMessageDto) {
                    messageType = "TEXT";
                    messageDto.setMessageType("TEXT");
                } else if (messageDto instanceof FileMessageDto) {
                    messageType = "FILE";
                    messageDto.setMessageType("FILE");
                } else {
                    throw new IllegalArgumentException("Unknown message DTO type and null messageType");
                }
                System.out.println("Inferred messageType: " + messageType);
            }

            if (headerAccessor.getUser() != null) {
                String email = headerAccessor.getUser().getName();
                System.out.println("Message sent by user: " + email);

                User user = userRepository.findByEmail(email)
                        .orElseThrow(() -> new RuntimeException("User not found"));

                System.out.println("Message DTO: " + messageDto);
                System.out.println("Found user ID: " + user.getId());

                switch (messageType) {
                    case "TEXT":
                        if (messageDto instanceof TextMessageDto) {
                            messageService.sendTextMessage((TextMessageDto) messageDto, chatId, user.getId());
                        } else {
                            throw new IllegalArgumentException("Invalid DTO type for TEXT message");
                        }
                        break;
                    case "FILE":
                        if (messageDto instanceof FileMessageDto) {
                            messageService.sendFileMessage((FileMessageDto) messageDto, chatId, user.getId());
                        } else {
                            throw new IllegalArgumentException("Invalid DTO type for FILE message");
                        }
                        break;
                    default:
                        throw new IllegalArgumentException("Unsupported message type: " + messageType + ". Supported types are TEXT and FILE.");
                }
            } else {
                System.err.println("Error: No user information in WebSocket session");
            }
        } catch (Exception e) {
            System.err.println("Error processing WebSocket message: " + e.getMessage());
            e.printStackTrace();
        }
    }
}