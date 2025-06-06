// components/MessageList.js
import React, { useRef, useEffect, useState } from 'react';
import MessageItem from './MessageItem';
import { groupMessagesByDate } from '../../utils/dateUtils';
import DateSeparator from './DateSeparator';

const MessageList = ({ 
  currentChat, 
  darkMode, 
  highlightedMessageId, 
  setHighlightedMessageId,
  handleReplyToMessage,
  currentUserId
}) => {
  const chatContainerRef = useRef(null);
  const highlightedMessageRef = useRef(null);
  const prevMessagesLengthRef = useRef(0);
  const prevChatIdRef = useRef(null);
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(true);

  // Function to check if scrolled to bottom
  const checkIfScrolledToBottom = () => {
    if (!chatContainerRef.current) return true;
    
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    // Consider "close to bottom" as within 100px of the bottom
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 100;
    setIsScrolledToBottom(isAtBottom);
    return isAtBottom;
  };

  // Function to scroll to bottom
  const scrollToBottom = (force = false) => {
    if (!chatContainerRef.current) return;
    
    // Only auto-scroll if already at bottom or forced
    if (force || isScrolledToBottom) {
      const scrollHeight = chatContainerRef.current.scrollHeight;
      chatContainerRef.current.scrollTop = scrollHeight;
      console.log("Scrolled to bottom:", scrollHeight);
    }
  };
  
  // Handle scroll events
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;
    
    const handleScroll = () => {
      checkIfScrolledToBottom();
    };
    
    container.addEventListener('scroll', handleScroll);
    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Scroll when chat changes
  useEffect(() => {
    if (!currentChat) return;
    
    // When chat changes, reset scrolling and scroll to bottom
    if (prevChatIdRef.current !== currentChat.id) {
      // Update refs
      prevChatIdRef.current = currentChat.id;
      prevMessagesLengthRef.current = currentChat.messages?.length || 0;
      
      // Force scroll to bottom with a delay to ensure content is rendered
      setTimeout(() => scrollToBottom(true), 100);
    }
  }, [currentChat?.id]);

  // Scroll when messages change
  useEffect(() => {
    if (!currentChat?.messages) return;
    
    const currentLength = currentChat?.messages?.length || 0;
    const prevLength = prevMessagesLengthRef.current;
    
    // Check if messages were added
    if (currentLength > prevLength) {
      console.log(`Messages added: ${currentLength - prevLength}`);
      
      // Check if the last message is from current user
      const isLastMessageFromCurrentUser = currentLength > 0 && 
        currentChat && currentChat.messages && currentChat.messages[currentLength - 1]?.sender?.id === currentUserId;
      
      // Always scroll to bottom when current user sends a message
      if (isLastMessageFromCurrentUser) {
        setTimeout(() => scrollToBottom(true), 100);
      } else {
        // Otherwise respect the user's scroll position
        setTimeout(() => scrollToBottom(false), 100);
      }
      
      // Update ref
      prevMessagesLengthRef.current = currentLength;
    }
  }, [currentChat?.messages, currentUserId]);

  // Scroll to highlighted message when changed
  useEffect(() => {
    if (highlightedMessageId && highlightedMessageRef.current) {
      highlightedMessageRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
      
      // Flash animation
      highlightedMessageRef.current.classList.add('animate-pulse');
      setTimeout(() => {
        if (highlightedMessageRef.current) {
          highlightedMessageRef.current.classList.remove('animate-pulse');
        }
      }, 2000);
    }
  }, [highlightedMessageId]);

  if (!currentChat) return null;

  // Group messages by date and sort them
  const groupedMessages = groupMessagesByDate(currentChat?.messages || []);

  // Function to find the original message for a reply
  const getOriginalMessage = (messageId) => {
    return currentChat.messages.find(msg => msg.id === messageId);
  };

  return (
    <div 
      className={`flex-1 overflow-y-auto overflow-x-hidden p-4 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}
      ref={chatContainerRef}
    >
      <div className="space-y-4 w-full">
        {groupedMessages.map((item, index) => {
          if (item.type === 'date-separator') {
            return (
              <DateSeparator 
                key={`date-${index}`}
                date={item.date}
                darkMode={darkMode}
              />
            );
          }

          // This is a message
          const message = item;
          const isOwnMessage = message.sender.id === currentUserId;
          const isHighlighted = highlightedMessageId === message.id;

          return (
            <div
              key={message.id}
              id={`message-${message.id}`}
              
            >
              {/* Your existing MessageBubble or message rendering component */}
              <MessageItem 
                message={message}
                currentChat={currentChat}
                isHighlighted={isHighlighted}
                darkMode={darkMode}
                highlightedMessageRef={isHighlighted ? highlightedMessageRef : null}
                originalMessage={message.replyTo ? getOriginalMessage(message.replyTo) : null}
                handleReplyToMessage={handleReplyToMessage}
                currentUserId={currentUserId}
              />
            </div>
          );
        })}
      </div>
      
      {/* Scroll to bottom button - show only when not at bottom */}
      {!isScrolledToBottom && currentChat.messages.length > 10 && (
        <div className="sticky bottom-5 flex justify-center">
          <button 
            className={`rounded-full p-2 shadow-lg ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white hover:bg-gray-100'}`}
            onClick={() => scrollToBottom(true)}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className={`h-5 w-5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path 
                fillRule="evenodd" 
                d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L10 15.586l5.293-5.293a1 1 0 011.414 0z" 
                clipRule="evenodd" 
              />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default MessageList;