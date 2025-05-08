// src/context/ChatContext.jsx - modified createNewChat function
import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import websocketService from '../services/websocketService';
import authService from '../services/authService';
import apiService from '../services/apiInterceptor';
import { useToast } from './ToastContext';

// Create context
const ChatContext = createContext(null);

// Custom hook to use the chat context
export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

// The Provider component
export const ChatProvider = ({ children }) => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeChat, setActiveChat] = useState(null);
  const [typingUsers, setTypingUsers] = useState({});
  const { showErrorToast, showSuccessToast } = useToast();
  
  // Use refs to track processed messages and prevent duplicates
  const processedMessages = useRef(new Set());
  
  // Load user chats on initial render
  useEffect(() => {
    if (authService.isAuthenticated()) {
      loadUserChats();
      
      // Connect to WebSocket
      if (!websocketService.isConnected()) {
        websocketService.connect(() => {
          console.log('WebSocket connected successfully');
        });
      }
      
      // Cleanup function to disconnect WebSocket when component unmounts
      return () => {
        websocketService.disconnect();
        processedMessages.current.clear();
      };
    }
  }, []);
  
  // When active chat changes, subscribe to its WebSocket topics
  useEffect(() => {
    if (activeChat) {
      // Subscribe to messages
      websocketService.subscribeToChatMessages(
        activeChat.id,
        handleNewMessage
      );
      
      // Subscribe to read status updates
      websocketService.subscribeToReadStatus(
        activeChat.id,
        handleReadStatusUpdate
      );
      
      // Subscribe to typing status updates
      websocketService.subscribeToTypingStatus(
        activeChat.id,
        handleTypingStatusUpdate
      );
    }
  }, [activeChat]);
  
  // Load user chats from API
  const loadUserChats = async () => {
    setLoading(true);
    try {
      const chatsData = await apiService.get('/chats');
      
      // For each chat, fetch its messages
      const chatsWithMessages = await Promise.all(
        chatsData.map(async (chat) => {
          try {
            console.log(`Fetching messages for chat ID: ${chat.id}`);
            const messages = await apiService.get(`/messages/chat/${chat.id}`);
            
            // Add all message IDs to processed set to prevent duplicates
            messages.forEach(msg => processedMessages.current.add(msg.id));
            
            // Find the last message for preview
            const lastMessage = messages.length > 0 
              ? messages[messages.length - 1] 
              : null;
            
            // Get avatar text - first letter of each word in title
            const titleWords = chat.title.split(' ');
            const avatarText = titleWords.map(word => word.charAt(0)).join('').toUpperCase().substring(0, 2);
            
            return {
              ...chat,
              messages: messages,
              avatar: avatarText,
              lastMessage: lastMessage ? 
                (lastMessage.messageType === 'TEXT' ? lastMessage.content : 'File attachment') : 
                '',
              time: lastMessage ? 
                formatMessageTime(lastMessage.timestamp) : 
                'No messages',
              unread: messages.filter(msg => !msg.readStatus && msg.sender.id !== authService.getCurrentUser().id).length
            };
          } catch (error) {
            console.error(`Error loading messages for chat ${chat.id}:`, error);
            return {
              ...chat,
              messages: [],
              avatar: chat.title.charAt(0).toUpperCase(),
              lastMessage: 'Error loading messages',
              time: 'Unknown',
              unread: 0
            };
          }
        })
      );
      
      setConversations(chatsWithMessages);
    } catch (error) {
      console.error('Error loading chats:', error);
      showErrorToast('Failed to load chats. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Format message timestamp for display
  const formatMessageTime = (timestamp) => {
    if (!timestamp) return '';
    
    const messageDate = new Date(timestamp);
    const now = new Date();
    
    // Today
    if (messageDate.toDateString() === now.toDateString()) {
      return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // Yesterday
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    
    // This week
    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(now.getDate() - 7);
    if (messageDate > oneWeekAgo) {
      const options = { weekday: 'long' };
      return messageDate.toLocaleDateString(undefined, options);
    }
    
    // Older
    return messageDate.toLocaleDateString();
  };
  
  // Handle new message received via WebSocket
  const handleNewMessage = (message) => {
    // Check if we've already processed this message
    if (processedMessages.current.has(message.id)) {
      console.log(`Skipping already processed message: ${message.id}`);
      return;
    }
    
    // Add to processed set
    processedMessages.current.add(message.id);
    console.log(`New message received: ${message.id}`, message);
    
    setConversations(prevConversations => {
      return prevConversations.map(conv => {
        if (conv.id === message.chatId) {
          // Add message to this conversation
          const updatedMessages = [...conv.messages, message];
          
          // Update unread count if message is from someone else
          const unread = message.sender.id !== authService.getCurrentUser().id
            ? conv.unread + 1
            : conv.unread;
          
          // Update lastMessage and time
          return {
            ...conv,
            messages: updatedMessages,
            lastMessage: message.messageType === 'TEXT' ? message.content : 'File attachment',
            time: formatMessageTime(message.timestamp),
            unread
          };
        }
        return conv;
      });
    });
    
    // If this is the active chat, update it too
    if (activeChat && activeChat.id === message.chatId) {
      setActiveChat(prevChat => {
        if (!prevChat) return null;
        
        return {
          ...prevChat,
          messages: [...prevChat.messages, message]
        };
      });
      
      // If this message is from another user, mark it as read immediately
      if (message.sender.id !== authService.getCurrentUser().id) {
        setTimeout(() => markMessageAsRead(message.id), 1000);
      }
    }
  };
  
  // Handle read status updates via WebSocket
  const handleReadStatusUpdate = (message) => {
    console.log("Read status update received:", message);
    
    setConversations(prevConversations => {
      return prevConversations.map(conv => {
        // Make sure we're updating the right chat
        if (conv.id === message.chatId) {
          // Update the read status of this message
          const updatedMessages = conv.messages.map(msg => 
            msg.id === message.id ? { ...msg, readStatus: true } : msg
          );
          
          // Recalculate unread count
          const unread = updatedMessages.filter(
            msg => !msg.readStatus && msg.sender.id !== authService.getCurrentUser().id
          ).length;
          
          return {
            ...conv,
            messages: updatedMessages,
            unread
          };
        }
        return conv;
      });
    });
    
    // Update active chat too if needed
    if (activeChat && activeChat.id === message.chatId) {
      setActiveChat(prevChat => {
        if (!prevChat) return null;
        
        return {
          ...prevChat,
          messages: prevChat.messages.map(msg => 
            msg.id === message.id ? { ...msg, readStatus: true } : msg
          )
        };
      });
    }
  };
  
  // Handle typing status updates via WebSocket
  const handleTypingStatusUpdate = (typingStatus) => {
    console.log("Typing status update received:", typingStatus);
    
    // Update the typing status for this chat
    setTypingUsers(prev => {
      const newState = { ...prev };
      
      // If we don't have an entry for this user, create one
      if (!newState[typingStatus.userId]) {
        newState[typingStatus.userId] = {};
      }
      
      // Update typing status for this chat
      newState[typingStatus.userId][typingStatus.chatId] = typingStatus.typing;
      
      return newState;
    });
    
    // Clear typing status after a delay
    if (typingStatus.typing) {
      setTimeout(() => {
        setTypingUsers(prev => {
          const newState = { ...prev };
          if (newState[typingStatus.userId]) {
            newState[typingStatus.userId][typingStatus.chatId] = false;
          }
          return newState;
        });
      }, 3000);
    }
  };
  
  // Send a text message
  const sendTextMessage = (chatId, text) => {
    if (!websocketService.isConnected()) {
      websocketService.connect(() => {
        websocketService.sendTextMessage(chatId, text);
      });
    } else {
      websocketService.sendTextMessage(chatId, text);
    }
  };
  
  // Modified: Create a new chat with support for group chats
  const createNewChat = async (participants, title) => {
    try {
      console.log('Creating new chat with participants:', participants, 'and title:', title);
      
      // Make sure we have at least one participant
      if (!participants || participants.length === 0) {
        throw new Error('At least one participant is required');
      }
      
      // Prepare the chat data
      const chatData = {
        title: title,
        participants: participants
      };
      
      // Call API to create the chat
      const newChat = await apiService.post('/chats', chatData);
      console.log('New chat created:', newChat);
      
      // Add the new chat to the conversations list with UI enhancements
      const avatarText = title ? title.split(' ').map(word => word.charAt(0)).join('').toUpperCase().substring(0, 2) : 'C';
      
      const isGroupChat = participants.length > 1;
      
      // Create enhanced chat object for UI
      const newChatWithUI = {
        ...newChat,
        messages: [],
        avatar: avatarText,
        lastMessage: isGroupChat ? 'Group chat created' : 'Chat created',
        time: formatMessageTime(new Date()),
        unread: 0,
        isGroupChat: isGroupChat
      };
      
      setConversations(prev => [newChatWithUI, ...prev]);
      showSuccessToast(isGroupChat ? 'Group chat created successfully' : 'Chat created successfully');
      
      return newChatWithUI;
    } catch (error) {
      console.error('Error creating chat:', error);
      showErrorToast('Failed to create chat. Please try again.');
      throw error;
    }
  };
  
  // Update typing status
  const updateTypingStatus = (chatId, isTyping) => {
    websocketService.sendTypingStatus(chatId, isTyping);
  };
  
  // Mark message as read
  const markMessageAsRead = (messageId) => {
    console.log("Marking message as read:", messageId);
    websocketService.markMessageAsRead(messageId);
    
    // Also update local state for immediate UI feedback
    setConversations(prevConversations => {
      return prevConversations.map(conv => {
        const foundMessage = conv.messages.find(msg => msg.id === messageId);
        if (foundMessage) {
          // Update the message in this chat
          const updatedMessages = conv.messages.map(msg => 
            msg.id === messageId ? { ...msg, readStatus: true } : msg
          );
          
          return {
            ...conv,
            messages: updatedMessages,
            unread: updatedMessages.filter(
              msg => !msg.readStatus && msg.sender.id !== authService.getCurrentUser().id
            ).length
          };
        }
        return conv;
      });
    });
    
    // Update active chat too if needed
    if (activeChat) {
      const foundMessage = activeChat.messages.find(msg => msg.id === messageId);
      if (foundMessage) {
        setActiveChat(prevChat => {
          if (!prevChat) return null;
          
          return {
            ...prevChat,
            messages: prevChat.messages.map(msg => 
              msg.id === messageId ? { ...msg, readStatus: true } : msg
            )
          };
        });
      }
    }
  };
  
  // Archive a chat
  const archiveChat = async (chatId) => {
    try {
      const updatedChat = await apiService.put(`/chats/${chatId}/archive`);
      
      // Update the chat in the conversations list
      setConversations(prev => 
        prev.map(conv => 
          conv.id === chatId ? { ...conv, status: updatedChat.status } : conv
        )
      );
      
      return updatedChat;
    } catch (error) {
      console.error('Error archiving chat:', error);
      showErrorToast('Failed to archive chat. Please try again.');
      throw error;
    }
  };
  
  // Provide context value
  const contextValue = {
    conversations,
    loading,
    activeChat,
    setActiveChat,
    typingUsers,
    sendTextMessage,
    createNewChat,
    updateTypingStatus,
    markMessageAsRead,
    archiveChat,
    refreshChats: loadUserChats
  };
  
  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
};

// Export the context as default
export default ChatContext;