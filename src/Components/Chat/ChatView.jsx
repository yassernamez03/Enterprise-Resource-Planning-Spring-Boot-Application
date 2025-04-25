// components/ChatView.js
import React, { useState, useEffect, useRef } from 'react';
import ChatHeader from './ChatHeader';
import ChatSearch from './ChatSearch';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { useChat } from '../../context/ChatContext';

const ChatView = ({ 
  currentChat, 
  darkMode, 
  mobileView, 
  setShowChatView, 
  setShowAccountPage, 
  toggleArchiveChat, 
  highlightedMessageId, 
  setHighlightedMessageId,
  handleSendMessage,
  onTypingStatusChange,
  isUserTyping,
  currentUserId
}) => {
  const [showSearchInChat, setShowSearchInChat] = useState(false);
  const [chatSearchQuery, setChatSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const [showReplyTo, setShowReplyTo] = useState(null);
  const { markMessageAsRead } = useChat();
  
  // Ref to track if messages have been marked as read
  const messagesMarkedRef = useRef({});

  // Mark messages as read when chat is viewed
  useEffect(() => {
    if (currentChat && currentChat.messages) {
      currentChat.messages.forEach(message => {
        // Mark message as read if:
        // 1. It's not from the current user
        // 2. It's not already marked as read
        // 3. It hasn't been processed in this session yet
        if (
          message.sender.id !== currentUserId && 
          !message.readStatus && 
          !messagesMarkedRef.current[message.id]
        ) {
          markMessageAsRead(message.id);
          // Mark this message as processed
          messagesMarkedRef.current[message.id] = true;
        }
      });
    }
  }, [currentChat, currentUserId, markMessageAsRead]);

  // Search functionality in current chat
  useEffect(() => {
    if (chatSearchQuery && chatSearchQuery.trim() !== '' && currentChat) {
      const results = currentChat.messages.filter(msg => {
        if (msg.messageType === 'TEXT') {
          return msg.content.toLowerCase().includes(chatSearchQuery.toLowerCase());
        }
        return false;
      });
      
      setSearchResults(results);
      setCurrentSearchIndex(0);
      
      if (results.length > 0) {
        setHighlightedMessageId(results[0].id);
      } else {
        // No results found
        setHighlightedMessageId(null);
      }
    } else {
      setSearchResults([]);
      setHighlightedMessageId(null);
    }
  }, [chatSearchQuery, currentChat, setHighlightedMessageId]);

  const navigateSearchResults = (direction) => {
    if (searchResults.length === 0) return;
    
    let newIndex;
    if (direction === 'next') {
      newIndex = (currentSearchIndex + 1) % searchResults.length;
    } else {
      newIndex = (currentSearchIndex - 1 + searchResults.length) % searchResults.length;
    }
    
    setCurrentSearchIndex(newIndex);
    setHighlightedMessageId(searchResults[newIndex].id);
  };

  const handleReplyToMessage = (messageId) => {
    setShowReplyTo(messageId);
  };

  if (!currentChat) return null;

  return (
    <div className={`${mobileView ? 'w-full' : 'w-2/3'} flex flex-col`}>
      {/* Chat header */}
      <ChatHeader 
        currentChat={currentChat}
        darkMode={darkMode}
        mobileView={mobileView}
        setShowChatView={setShowChatView}
        setShowAccountPage={setShowAccountPage}
        toggleArchiveChat={toggleArchiveChat}
        setShowSearchInChat={setShowSearchInChat}
        isUserTyping={isUserTyping}
      />

      {/* Chat search */}
      {showSearchInChat && (
        <ChatSearch 
          darkMode={darkMode}
          chatSearchQuery={chatSearchQuery}
          setChatSearchQuery={setChatSearchQuery}
          searchResults={searchResults}
          currentSearchIndex={currentSearchIndex}
          navigateSearchResults={navigateSearchResults}
          setShowSearchInChat={setShowSearchInChat}
          searchError={chatSearchQuery && searchResults.length === 0}
        />
      )}

      {/* Chat messages */}
      <MessageList 
        currentChat={currentChat}
        darkMode={darkMode}
        highlightedMessageId={highlightedMessageId}
        setHighlightedMessageId={setHighlightedMessageId}
        handleReplyToMessage={handleReplyToMessage}
        currentUserId={currentUserId}
      />

      {/* Message input */}
      <MessageInput 
        darkMode={darkMode}
        handleSendMessage={handleSendMessage}
        currentChat={currentChat}
        showReplyTo={showReplyTo}
        setShowReplyTo={setShowReplyTo}
        onTypingStatusChange={onTypingStatusChange}
      />
    </div>
  );
};

export default ChatView;