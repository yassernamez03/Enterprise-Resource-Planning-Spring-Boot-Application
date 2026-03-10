package com.secureops.service;

import com.secureops.dto.ChatDto;
import com.secureops.entity.Chat;

import java.util.List;

public interface ChatService {
    Chat createChat(ChatDto chatDto, List<Long> participantIds);
    List<Chat> getUserChats(Long userId);
    Chat getChatById(Long id);
    Chat archiveChat(Long id);
    Chat unarchiveChat(Long id);
    Chat leaveChat(Long chatId);
}