package com.secureops.service;

import com.secureops.dto.ChatDto;
import com.secureops.entity.Chat;
import com.secureops.entity.User;
import com.secureops.exception.BadRequestException;
import com.secureops.exception.ResourceNotFoundException;
import com.secureops.exception.UnauthorizedException;
import com.secureops.repository.ChatRepository;
import com.secureops.repository.UserRepository;
import com.secureops.util.AppConstants;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import jakarta.servlet.http.HttpServletRequest;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class ChatServiceImpl implements ChatService {

    private final ChatRepository chatRepository;
    private final UserRepository userRepository;
    private final LogService logService;

    public ChatServiceImpl(ChatRepository chatRepository,
                          UserRepository userRepository,
                          LogService logService) {
        this.chatRepository = chatRepository;
        this.userRepository = userRepository;
        this.logService = logService;
    }

    @Override
    @Transactional
    public Chat createChat(ChatDto chatDto, List<Long> participantIds) {
        // Validate participants
        if (participantIds == null || participantIds.isEmpty()) {
            throw new BadRequestException("Chat must have at least one participant");
        }
        
        // Get current user
        User currentUser = getCurrentUser();
        
        // Create chat
        Chat chat = new Chat();
        chat.setTitle(chatDto.getTitle());
        chat.setStatus(Chat.ChatStatus.ACTIVE);
        
        // Add participants
        Set<User> participants = new HashSet<>();
        participants.add(currentUser); // Always add current user as participant
        
        for (Long participantId : participantIds) {
            // Skip if it's the current user (already added)
            if (participantId.equals(currentUser.getId())) {
                continue;
            }
            
            User participant = userRepository.findById(participantId)
                    .orElseThrow(() -> new ResourceNotFoundException("User", "id", participantId));
            
            // Only add active and approved users
            if (participant.isActive() && participant.getApprovalStatus() == User.ApprovalStatus.APPROVED) {
                participants.add(participant);
            }
        }
        
        chat.setParticipants(participants);
        
        Chat savedChat = chatRepository.save(chat);
        
        // Log chat creation
        logService.createLog(
                AppConstants.LOG_ACTION_CREATE,
                "Chat created: " + chat.getTitle(),
                getClientIp(),
                AppConstants.LOG_TYPE_CHAT,
                currentUser.getId()
        );
        
        return savedChat;
    }

    @Override
    public List<Chat> getUserChats(Long userId) {
        // Verify user exists
        userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        
        // Verify current user is requesting their own chats
        User currentUser = getCurrentUser();
        if (!currentUser.getId().equals(userId)) {
            throw new UnauthorizedException("You can only view your own chats");
        }
        
        return chatRepository.findByParticipantsId(userId);
    }

    @Override
    public Chat getChatById(Long id) {
        Chat chat = chatRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Chat", "id", id));
        
        // Verify current user is a participant
        User currentUser = getCurrentUser();
        if (chat.getParticipants().stream().noneMatch(p -> p.getId().equals(currentUser.getId()))) {
            throw new UnauthorizedException("You don't have permission to access this chat");
        }
        
        return chat;
    }
    
    @Override
    @Transactional
    public Chat archiveChat(Long id) {
        Chat chat = getChatById(id);
        
        // Only set to ARCHIVED if it's currently ACTIVE
        if (chat.getStatus() == Chat.ChatStatus.ACTIVE) {
            chat.setStatus(Chat.ChatStatus.ARCHIVED);
            chat = chatRepository.save(chat);
            
            // Log chat archiving
            logService.createLog(
                    AppConstants.LOG_ACTION_UPDATE,
                    "Chat archived: " + chat.getTitle(),
                    getClientIp(),
                    AppConstants.LOG_TYPE_CHAT,
                    getCurrentUser().getId()
            );
        }
        
        return chat;
    }
    
    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
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