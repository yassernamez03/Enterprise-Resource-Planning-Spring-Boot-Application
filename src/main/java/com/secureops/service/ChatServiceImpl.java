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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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
import java.util.Set;

@Service
public class ChatServiceImpl implements ChatService {

    private static final Logger logger = LoggerFactory.getLogger(ChatServiceImpl.class);
    private static final Logger securityLogger = LoggerFactory.getLogger("com.secureops.security");

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
        logger.info("ChatServiceImpl initialized");
    }

    @Override
    @Transactional
    public Chat createChat(ChatDto chatDto, List<Long> participantIds) {
        String clientIp = getClientIp();
        logger.debug("Creating new chat with title: {}, participants: {}, from IP: {}", 
                chatDto.getTitle(), participantIds, clientIp);

        // Validate participants
        if (participantIds == null || participantIds.isEmpty()) {
            securityLogger.warn("Chat creation attempt with no participants from IP: {}", clientIp);
            throw new BadRequestException("Chat must have at least one participant");
        }

        try {
            // Get current user
            User currentUser = getCurrentUser();
            logger.debug("Current user creating chat - ID: {}, Email: {}", 
                    currentUser.getId(), maskEmail(currentUser.getEmail()));

            // Create chat without participants first
            Chat chat = new Chat();
            chat.setTitle(chatDto.getTitle());
            chat.setStatus(Chat.ChatStatus.ACTIVE);
            logger.debug("Created chat object with title: {}", chat.getTitle());

            // Save chat first to get an ID
            Chat savedChat = chatRepository.saveAndFlush(chat);
            logger.info("Saved new chat with ID: {}, Title: {}", savedChat.getId(), savedChat.getTitle());

            // Add current user
            logger.debug("Adding current user to chat - UserID: {}", currentUser.getId());
            chatRepository.addParticipant(savedChat.getId(), currentUser.getId());

            for (Long participantId : participantIds) {
                // Skip if it's the current user (already added)
                if (participantId.equals(currentUser.getId())) {
                    logger.debug("Skipping current user as participant - UserID: {}", participantId);
                    continue;
                }

                logger.debug("Processing participant - UserID: {}", participantId);
                User participant = userRepository.findById(participantId)
                        .orElseThrow(() -> {
                            securityLogger.warn("Invalid participant ID in chat creation - RequestedID: {}, CreatorID: {}, IP: {}", 
                                    participantId, currentUser.getId(), clientIp);
                            return new ResourceNotFoundException("User", "id", participantId);
                        });

                // Only add active and approved users
                if (participant.isActive() && participant.getApprovalStatus() == User.ApprovalStatus.APPROVED) {
                    logger.debug("Adding valid participant - UserID: {}, Status: {}, Active: {}", 
                            participant.getId(), participant.getApprovalStatus(), participant.isActive());
                    chatRepository.addParticipant(savedChat.getId(), participantId);
                } else {
                    logger.warn("Skipping inactive/unapproved participant - UserID: {}, Status: {}, Active: {}", 
                            participant.getId(), participant.getApprovalStatus(), participant.isActive());
                }
            }

            // Log chat creation
            logService.createLog(
                    AppConstants.LOG_ACTION_CREATE,
                    "Chat created: " + savedChat.getTitle(),
                    clientIp,
                    AppConstants.LOG_TYPE_CHAT,
                    currentUser.getId());
            logger.info("Logged chat creation - ChatID: {}, CreatorID: {}", savedChat.getId(), currentUser.getId());

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
            logger.debug("Final chat object created with {} participants", resultChat.getParticipants().size());

            return resultChat;
        } catch (BadRequestException | ResourceNotFoundException ex) {
            // Already logged, just rethrow
            throw ex;
        } catch (Exception ex) {
            logger.error("Unexpected error creating chat - Title: {}, IP: {}, Error: {}", 
                    chatDto.getTitle(), clientIp, ex.getMessage(), ex);
            securityLogger.error("Chat creation failed - IP: {}, Error: {}", clientIp, ex.getMessage());
            throw ex;
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<Chat> getUserChats(Long userId) {
        String clientIp = getClientIp();
        logger.debug("Fetching chats for user - UserID: {}, IP: {}", userId, clientIp);

        try {
            // Verify user exists
            userRepository.findById(userId)
                    .orElseThrow(() -> {
                        securityLogger.warn("Invalid user ID requested - UserID: {}, IP: {}", userId, clientIp);
                        return new ResourceNotFoundException("User", "id", userId);
                    });
            logger.debug("Verified user exists - UserID: {}", userId);

            // Verify current user is requesting their own chats
            User currentUser = getCurrentUser();
            if (!currentUser.getId().equals(userId)) {
                securityLogger.warn("Unauthorized chat access attempt - RequestedUserID: {}, CurrentUserID: {}, IP: {}", 
                        userId, currentUser.getId(), clientIp);
                throw new UnauthorizedException("You can only view your own chats");
            }

            // Get chat IDs only
            List<Long> chatIds = chatRepository.findChatIdsByUserId(userId);
            logger.debug("Found {} chat IDs for user - UserID: {}", chatIds.size(), userId);

            // Load chats individually with basic data only
            List<Chat> chats = new ArrayList<>();
            for (Long chatId : chatIds) {
                logger.trace("Loading chat details - ChatID: {}", chatId);

                Chat chat = entityManager.createQuery(
                        "SELECT c FROM Chat c LEFT JOIN FETCH c.participants WHERE c.id = :id",
                        Chat.class)
                        .setParameter("id", chatId)
                        .getSingleResult();

                logger.trace("Loaded chat - ChatID: {}, Title: {}, Participants: {}", 
                        chat.getId(), chat.getTitle(), chat.getParticipants().size());
                chats.add(chat);
            }

            logger.info("Returning {} chats for user - UserID: {}", chats.size(), userId);
            return chats;
        } catch (UnauthorizedException | ResourceNotFoundException ex) {
            // Already logged, just rethrow
            throw ex;
        } catch (Exception ex) {
            logger.error("Error fetching user chats - UserID: {}, IP: {}, Error: {}", 
                    userId, clientIp, ex.getMessage(), ex);
            throw ex;
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Chat getChatById(Long id) {
        String clientIp = getClientIp();
        logger.debug("Fetching chat by ID - ChatID: {}, IP: {}", id, clientIp);

        try {
            // Load chat with participants in a single query
            Chat chat = entityManager.createQuery(
                    "SELECT c FROM Chat c LEFT JOIN FETCH c.participants WHERE c.id = :id",
                    Chat.class)
                    .setParameter("id", id)
                    .getSingleResult();

            logger.debug("Found chat - ChatID: {}, Title: {}, Participants: {}", 
                    chat.getId(), chat.getTitle(), chat.getParticipants().size());

            // Verify current user is a participant
            User currentUser = getCurrentUser();
            boolean isParticipant = chat.getParticipants().stream()
                    .anyMatch(participant -> participant.getId().equals(currentUser.getId()));

            if (!isParticipant) {
                securityLogger.warn("Unauthorized chat access - ChatID: {}, UserID: {}, IP: {}", 
                        id, currentUser.getId(), clientIp);
                throw new UnauthorizedException("You don't have permission to access this chat");
            }

            logger.debug("Authorized access to chat - ChatID: {}, UserID: {}", id, currentUser.getId());
            return chat;
        } catch (Exception ex) {
            logger.error("Error fetching chat - ChatID: {}, IP: {}, Error: {}", id, clientIp, ex.getMessage(), ex);
            throw ex;
        }
    }

    @Override
    @Transactional
    public Chat archiveChat(Long id) {
        String clientIp = getClientIp();
        logger.debug("Archiving chat - ChatID: {}, IP: {}", id, clientIp);

        try {
            Chat chat = getChatById(id);
            logger.debug("Retrieved chat for archiving - ChatID: {}, Status: {}", chat.getId(), chat.getStatus());

            // Only set to ARCHIVED if it's currently ACTIVE
            if (chat.getStatus() == Chat.ChatStatus.ACTIVE) {
                chat.setStatus(Chat.ChatStatus.ARCHIVED);
                chat = chatRepository.save(chat);
                logger.info("Chat archived - ChatID: {}, NewStatus: {}", chat.getId(), chat.getStatus());

                // Log chat archiving
                logService.createLog(
                        AppConstants.LOG_ACTION_UPDATE,
                        "Chat archived: " + chat.getTitle(),
                        clientIp,
                        AppConstants.LOG_TYPE_CHAT,
                        getCurrentUser().getId());
            } else {
                logger.debug("Chat already in non-active status - ChatID: {}, Status: {}", chat.getId(), chat.getStatus());
            }

            return chat;
        } catch (Exception ex) {
            logger.error("Error archiving chat - ChatID: {}, IP: {}, Error: {}", id, clientIp, ex.getMessage(), ex);
            throw ex;
        }
    }

    @Override
    @Transactional
    public Chat unarchiveChat(Long id) {
        String clientIp = getClientIp();
        logger.debug("Unarchiving chat - ChatID: {}, IP: {}", id, clientIp);

        try {
            Chat chat = getChatById(id);
            logger.debug("Retrieved chat for unarchiving - ChatID: {}, Status: {}", chat.getId(), chat.getStatus());

            // Only set to ACTIVE if it's currently ARCHIVED
            if (chat.getStatus() == Chat.ChatStatus.ARCHIVED) {
                chat.setStatus(Chat.ChatStatus.ACTIVE);
                chat = chatRepository.save(chat);
                logger.info("Chat unarchived - ChatID: {}, NewStatus: {}", chat.getId(), chat.getStatus());

                // Log chat unarchiving
                logService.createLog(
                        AppConstants.LOG_ACTION_UPDATE,
                        "Chat unarchived: " + chat.getTitle(),
                        clientIp,
                        AppConstants.LOG_TYPE_CHAT,
                        getCurrentUser().getId());
            } else {
                logger.debug("Chat already in active status - ChatID: {}, Status: {}", chat.getId(), chat.getStatus());
            }

            return chat;
        } catch (Exception ex) {
            logger.error("Error unarchiving chat - ChatID: {}, IP: {}, Error: {}", id, clientIp, ex.getMessage(), ex);
            throw ex;
        }
    }

    @Override
    @Transactional
    public Chat leaveChat(Long chatId) {
        String clientIp = getClientIp();
        logger.debug("Processing leave chat request - ChatID: {}, IP: {}", chatId, clientIp);

        try {
            // Get the chat with participants
            Chat chat = getChatById(chatId);
            logger.debug("Retrieved chat for leaving - ChatID: {}, Participants: {}, Status: {}", 
                    chat.getId(), chat.getParticipants().size(), chat.getStatus());

            // Get current user
            User currentUser = getCurrentUser();
            logger.debug("Current user leaving chat - UserID: {}", currentUser.getId());

            // Check if chat is already closed
            if (chat.getStatus() == Chat.ChatStatus.CLOSED) {
                logger.warn("Attempt to leave already closed chat - ChatID: {}, UserID: {}", chatId, currentUser.getId());
                throw new BadRequestException("Chat is already closed");
            }

            // If chat has only 2 participants and current user is one of them
            if (chat.getParticipants().size() <= 2) {
                logger.info("Closing chat with <= 2 participants - ChatID: {}, Participants: {}", 
                        chat.getId(), chat.getParticipants().size());
                
                // Remove current user from participants
                chatRepository.removeParticipant(chatId, currentUser.getId());
                
                // Update chat status to CLOSED
                chat.setStatus(Chat.ChatStatus.CLOSED);
                chat = chatRepository.save(chat);
                
                // Log the chat closing
                logService.createLog(
                        AppConstants.LOG_ACTION_UPDATE,
                        "Chat closed: " + chat.getTitle(),
                        clientIp,
                        AppConstants.LOG_TYPE_CHAT,
                        currentUser.getId());
                
                logger.info("Chat closed - ChatID: {}, UserID: {}", chat.getId(), currentUser.getId());
            } else {
                // Chat has more than 2 participants, just remove the current user
                logger.debug("Removing user from multi-participant chat - ChatID: {}, Participants: {}", 
                        chat.getId(), chat.getParticipants().size());
                
                chatRepository.removeParticipant(chatId, currentUser.getId());
                
                // Log the user leaving
                logService.createLog(
                        AppConstants.LOG_ACTION_UPDATE,
                        "Left chat: " + chat.getTitle(),
                        clientIp,
                        AppConstants.LOG_TYPE_CHAT,
                        currentUser.getId());
                
                logger.info("User left chat - ChatID: {}, UserID: {}", chat.getId(), currentUser.getId());
            }

            // Get updated chat with refreshed participants
            Chat updatedChat = entityManager.createQuery(
                    "SELECT c FROM Chat c LEFT JOIN FETCH c.participants WHERE c.id = :id",
                    Chat.class)
                    .setParameter("id", chatId)
                    .getSingleResult();
            
            logger.debug("Returning updated chat - ChatID: {}, Status: {}, Participants: {}", 
                    updatedChat.getId(), updatedChat.getStatus(), updatedChat.getParticipants().size());

            return updatedChat;
        } catch (BadRequestException ex) {
            // Already logged, just rethrow
            throw ex;
        } catch (Exception ex) {
            logger.error("Error leaving chat - ChatID: {}, IP: {}, Error: {}", chatId, clientIp, ex.getMessage(), ex);
            securityLogger.error("Chat leave failed - ChatID: {}, IP: {}, Error: {}", chatId, clientIp, ex.getMessage());
            throw ex;
        }
    }

    private User getCurrentUser() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.isAuthenticated()) {
                String email = authentication.getName();
                User user = userRepository.findByEmail(email)
                        .orElseThrow(() -> {
                            securityLogger.warn("Authenticated user not found in database - Email: {}", maskEmail(email));
                            return new UnauthorizedException("User not found");
                        });
                logger.trace("Retrieved current user - UserID: {}", user.getId());
                return user;
            }
            securityLogger.warn("Unauthenticated access attempt");
            throw new UnauthorizedException("Not authenticated");
        } catch (Exception ex) {
            logger.error("Error getting current user", ex);
            throw ex;
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
            logger.trace("Retrieved client IP: {}", ipAddress);
            return ipAddress;
        } catch (Exception e) {
            logger.warn("Error retrieving client IP", e);
            return "unknown";
        }
    }

    /**
     * Masks an email address for privacy in logs
     * Converts user@example.com to u***@e***.com
     */
    private String maskEmail(String email) {
        if (email == null || email.isEmpty() || !email.contains("@")) {
            return email;
        }
        
        String[] parts = email.split("@");
        String username = parts[0];
        String domain = parts[1];
        
        String maskedUsername = username.length() > 0 ? username.substring(0, 1) + "***" : "***";
        
        String[] domainParts = domain.split("\\.");
        String domainName = domainParts[0];
        String tld = domainParts.length > 1 ? domainParts[domainParts.length - 1] : "";
        
        String maskedDomain = domainName.length() > 0 ? domainName.substring(0, 1) + "***" : "***";
        
        return maskedUsername + "@" + maskedDomain + (tld.isEmpty() ? "" : "." + tld);
    }
}