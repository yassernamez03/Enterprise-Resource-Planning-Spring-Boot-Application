package com.secureops.service;

import com.secureops.dto.FileMessageDto;
import com.secureops.dto.TextMessageDto;
import com.secureops.entity.Message;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;

import java.util.List;

public interface MessageService {
    Message sendTextMessage(TextMessageDto messageDto, Long chatId, Long userId);
    Message sendFileMessage(FileMessageDto messageDto, Long chatId, Long userId);
    List<Message> getChatMessages(Long chatId);
    Page<Message> getChatMessagesPageable(Long chatId, int page, int size);
    void markAsRead(Long messageId);
    ResponseEntity<Resource> getFileResourceByMessageId(Long messageId);
}