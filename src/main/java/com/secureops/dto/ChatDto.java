package com.secureops.dto;

import com.secureops.entity.Chat.ChatStatus;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatDto {
    private Long id;
    
    @NotEmpty(message = "Chat title is required")
    private String title;
    
    private ChatStatus status;
    
    // Changed from List<UserDto> to List<Long> to allow passing IDs directly
    private List<Long> participants;
}