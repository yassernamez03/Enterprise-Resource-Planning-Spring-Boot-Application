package com.secureops.repository;

import com.secureops.entity.Chat;
import com.secureops.entity.Chat.ChatStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatRepository extends JpaRepository<Chat, Long> {
    List<Chat> findByStatus(ChatStatus status);

    @Query("SELECT c FROM Chat c JOIN c.participants p WHERE p.id = :userId")
    List<Chat> findByParticipantsId(@Param("userId") Long userId);

    @Modifying
    @Query(value = "INSERT INTO chat_participants (chat_id, user_id) VALUES (:chatId, :userId)", nativeQuery = true)
    void addParticipant(@Param("chatId") Long chatId, @Param("userId") Long userId);
    
    @Query(value = 
            "SELECT DISTINCT c.* FROM chats c " +
            "JOIN chat_participants cp ON c.id = cp.chat_id " +
            "WHERE cp.user_id = :userId", 
            nativeQuery = true)
    List<Chat> findUserChatsNative(@Param("userId") Long userId);
    
    // New method to get just the chat IDs without loading the full objects
    @Query(value = 
            "SELECT DISTINCT c.id FROM chats c " +
            "JOIN chat_participants cp ON c.id = cp.chat_id " +
            "WHERE cp.user_id = :userId", 
            nativeQuery = true)
    List<Long> findChatIdsByUserId(@Param("userId") Long userId);
}