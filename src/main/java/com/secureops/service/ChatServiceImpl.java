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

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.servlet.http.HttpServletRequest;
import java.util.ArrayList;
import java.util.List;

@Service
public class ChatServiceImpl implements ChatService {

    private final ChatRepository chatRepository;
    private final UserRepository userRepository;
    private final LogService logService;
    
    @PersistenceContext
    private EntityManager entityManager;

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
        System.out.println("DEBUG - createChat service - Starting method");
        // Validate participants
        if (participantIds == null || participantIds.isEmpty()) {
            throw new BadRequestException("Chat must have at least one participant");
        }

        try {
            // Get current user
            User currentUser = getCurrentUser();
            System.out.println("DEBUG - createChat service - Current user: " + currentUser.getId() + ", " + currentUser.getEmail());

            // Create chat without participants first
            Chat chat = new Chat();
            chat.setTitle(chatDto.getTitle());
            chat.setStatus(Chat.ChatStatus.ACTIVE);
            System.out.println("DEBUG - createChat service - Created chat object with title: " + chat.getTitle());

            // Save chat first to get an ID
            Chat savedChat = chatRepository.saveAndFlush(chat);
            System.out.println("DEBUG - createChat service - Saved chat with ID: " + savedChat.getId());

            // Now add participants using the join table instead of bidirectional relationships
            // Add current user
            System.out.println("DEBUG - createChat service - Adding current user: " + currentUser.getId() + " to chat");
            chatRepository.addParticipant(savedChat.getId(), currentUser.getId());

            for (Long participantId : participantIds) {
                // Skip if it's the current user (already added)
                if (participantId.equals(currentUser.getId())) {
                    System.out.println("DEBUG - createChat service - Skipping current user: " + participantId);
                    continue;
                }

                System.out.println("DEBUG - createChat service - Looking up participant: " + participantId);
                User participant = userRepository.findById(participantId)
                        .orElseThrow(() -> new ResourceNotFoundException("User", "id", participantId));
                System.out.println("DEBUG - createChat service - Found participant: " + participant.getId() + ", " + participant.getEmail());

                // Only add active and approved users
                if (participant.isActive() && participant.getApprovalStatus() == User.ApprovalStatus.APPROVED) {
                    System.out.println("DEBUG - createChat service - Adding participant: " + participantId + " to chat");
                    chatRepository.addParticipant(savedChat.getId(), participantId);
                } else {
                    System.out.println("DEBUG - createChat service - Participant not active or approved: " + participantId +
                            ", isActive: " + participant.isActive() + ", approval: " + participant.getApprovalStatus());
                }
            }

            // Log chat creation
            System.out.println("DEBUG - createChat service - Logging chat creation");
            logService.createLog(
                    AppConstants.LOG_ACTION_CREATE,
                    "Chat created: " + savedChat.getTitle(),
                    getClientIp(),
                    AppConstants.LOG_TYPE_CHAT,
                    currentUser.getId());

            // Manually construct the Chat object with participants to avoid lazy loading issues
            Chat resultChat = new Chat();
            resultChat.setId(savedChat.getId());
            resultChat.setTitle(savedChat.getTitle());
            resultChat.setStatus(savedChat.getStatus());
            resultChat.setCreatedAt(savedChat.getCreatedAt());
            resultChat.setUpdatedAt(savedChat.getUpdatedAt());
            
            // Add the current user and all participants to the chat's participants list
            List<User> participants = new ArrayList<>();
            participants.add(currentUser);
            
            for (Long participantId : participantIds) {
                // Skip duplicates
                if (participantId.equals(currentUser.getId())) {
                    continue;
                }
                
                userRepository.findById(participantId).ifPresent(user -> {
                    if (user.isActive() && user.getApprovalStatus() == User.ApprovalStatus.APPROVED) {
                        participants.add(user);
                    }
                });
            }
            
            resultChat.setParticipants(new java.util.HashSet<>(participants));
            System.out.println("DEBUG - createChat service - Result chat has " + resultChat.getParticipants().size() + " participants");

            return resultChat;
        } catch (Exception e) {
            System.out.println("DEBUG - createChat service - Exception: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<Chat> getUserChats(Long userId) {
        System.out.println("DEBUG - getUserChats service - Starting method for user: " + userId);
        try {
            // Verify user exists
            System.out.println("DEBUG - getUserChats service - Verifying user exists: " + userId);
            userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
            System.out.println("DEBUG - getUserChats service - User exists: " + userId);

            // Verify current user is requesting their own chats
            User currentUser = getCurrentUser();
            System.out.println("DEBUG - getUserChats service - Current user: " + currentUser.getId());
            
            if (!currentUser.getId().equals(userId)) {
                System.out.println("DEBUG - getUserChats service - Unauthorized: current user " + 
                        currentUser.getId() + " trying to access chats of user " + userId);
                throw new UnauthorizedException("You can only view your own chats");
            }

            // Get chat IDs only
            System.out.println("DEBUG - getUserChats service - Fetching chat IDs for user: " + userId);
            List<Long> chatIds = chatRepository.findChatIdsByUserId(userId);
            System.out.println("DEBUG - getUserChats service - Retrieved " + chatIds.size() + " chat IDs");
            
            // Load chats individually with basic data only (avoid loading full object graph)
            List<Chat> chats = new ArrayList<>();
            for (Long chatId : chatIds) {
                System.out.println("DEBUG - getUserChats service - Loading chat: " + chatId);
                
                // Custom query to get chat with participants but not loading nested collections
                Chat chat = entityManager.createQuery(
                    "SELECT c FROM Chat c LEFT JOIN FETCH c.participants WHERE c.id = :id", 
                    Chat.class)
                    .setParameter("id", chatId)
                    .getSingleResult();
                
                System.out.println("DEBUG - getUserChats service - Loaded chat: " + chat.getId() + 
                    ", Title: " + chat.getTitle() + 
                    ", Participants: " + (chat.getParticipants() != null ? chat.getParticipants().size() : "null"));
                
                chats.add(chat);
            }
            
            return chats;
        } catch (Exception e) {
            System.out.println("DEBUG - getUserChats service - Exception: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Chat getChatById(Long id) {
        System.out.println("DEBUG - getChatById service - Starting method for chat: " + id);
        try {
            System.out.println("DEBUG - getChatById service - Finding chat: " + id);
            
            // Load chat with participants in a single query to avoid lazy loading issues
            Chat chat = entityManager.createQuery(
                "SELECT c FROM Chat c LEFT JOIN FETCH c.participants WHERE c.id = :id", 
                Chat.class)
                .setParameter("id", id)
                .getSingleResult();
                
            System.out.println("DEBUG - getChatById service - Found chat: " + chat.getId() + ", Title: " + chat.getTitle());

            // Verify current user is a participant
            User currentUser = getCurrentUser();
            System.out.println("DEBUG - getChatById service - Current user: " + currentUser.getId());
            
            boolean isParticipant = chat.getParticipants().stream()
                .anyMatch(participant -> participant.getId().equals(currentUser.getId()));
            
            System.out.println("DEBUG - getChatById service - Is current user a participant? " + isParticipant);
                    
            if (!isParticipant) {
                System.out.println("DEBUG - getChatById service - Unauthorized: current user " + 
                        currentUser.getId() + " is not a participant in chat " + id);
                throw new UnauthorizedException("You don't have permission to access this chat");
            }

            return chat;
        } catch (Exception e) {
            System.out.println("DEBUG - getChatById service - Exception: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    @Override
    @Transactional
    public Chat archiveChat(Long id) {
        System.out.println("DEBUG - archiveChat service - Starting method for chat: " + id);
        try {
            Chat chat = getChatById(id);
            System.out.println("DEBUG - archiveChat service - Found chat: " + chat.getId() + 
                    ", Title: " + chat.getTitle() + ", Status: " + chat.getStatus());

            // Only set to ARCHIVED if it's currently ACTIVE
            if (chat.getStatus() == Chat.ChatStatus.ACTIVE) {
                System.out.println("DEBUG - archiveChat service - Archiving chat: " + chat.getId());
                chat.setStatus(Chat.ChatStatus.ARCHIVED);
                chat = chatRepository.save(chat);
                System.out.println("DEBUG - archiveChat service - Chat archived: " + chat.getId() + 
                        ", New status: " + chat.getStatus());

                // Log chat archiving
                System.out.println("DEBUG - archiveChat service - Logging chat archiving");
                logService.createLog(
                        AppConstants.LOG_ACTION_UPDATE,
                        "Chat archived: " + chat.getTitle(),
                        getClientIp(),
                        AppConstants.LOG_TYPE_CHAT,
                        getCurrentUser().getId());
            } else {
                System.out.println("DEBUG - archiveChat service - Chat already archived: " + chat.getId());
            }

            return chat;
        } catch (Exception e) {
            System.out.println("DEBUG - archiveChat service - Exception: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    private User getCurrentUser() {
        System.out.println("DEBUG - getCurrentUser - Getting current user");
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.isAuthenticated()) {
                String email = authentication.getName();
                System.out.println("DEBUG - getCurrentUser - Authentication name: " + email);
                User user = userRepository.findByEmail(email)
                        .orElseThrow(() -> new UnauthorizedException("User not found"));
                System.out.println("DEBUG - getCurrentUser - Found user: " + user.getId() + ", " + user.getEmail());
                return user;
            }
            System.out.println("DEBUG - getCurrentUser - Not authenticated");
            throw new UnauthorizedException("Not authenticated");
        } catch (Exception e) {
            System.out.println("DEBUG - getCurrentUser - Exception: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    private String getClientIp() {
        try {
            HttpServletRequest request = ((ServletRequestAttributes) RequestContextHolder.currentRequestAttributes())
                    .getRequest();
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
            System.out.println("DEBUG - getClientIp - Client IP: " + ipAddress);
            return ipAddress;
        } catch (Exception e) {
            System.out.println("DEBUG - getClientIp - Exception: " + e.getMessage());
            e.printStackTrace();
            return "unknown";
        }
    }
}