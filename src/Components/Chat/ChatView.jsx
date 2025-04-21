// components/ChatView.js
import React, { useState, useEffect } from 'react';
import ChatHeader from './ChatHeader';
import ChatSearch from './ChatSearch';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

const ChatView = ({ 
  currentChat, 
  darkMode, 
  mobileView, 
  setShowChatView, 
  setShowAccountPage, 
  toggleArchiveChat, 
  highlightedMessageId, 
  setHighlightedMessageId,
  handleSendMessage
}) => {
  const [showSearchInChat, setShowSearchInChat] = useState(false);
  const [chatSearchQuery, setChatSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const [showReplyTo, setShowReplyTo] = useState(null);

  // Search functionality in current chat
  useEffect(() => {
    if (chatSearchQuery && chatSearchQuery.trim() !== '' && currentChat) {
      const results = currentChat.messages.filter(msg => 
        msg.text.toLowerCase().includes(chatSearchQuery.toLowerCase())
      );
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
      />

      {/* Message input */}
      <MessageInput 
        darkMode={darkMode}
        handleSendMessage={handleSendMessage}
        currentChat={currentChat}
        showReplyTo={showReplyTo}
        setShowReplyTo={setShowReplyTo}
      />
    </div>
  );
};

export default ChatView;