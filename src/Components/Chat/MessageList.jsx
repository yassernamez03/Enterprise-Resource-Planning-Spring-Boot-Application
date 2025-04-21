// components/MessageList.js
import React, { useRef, useEffect } from 'react';
import { Check, Reply, Mic, Image, Camera, File } from 'lucide-react';
import MessageItem from './MessageItem';

const MessageList = ({ 
  currentChat, 
  darkMode, 
  highlightedMessageId, 
  setHighlightedMessageId,
  handleReplyToMessage
}) => {
  const chatContainerRef = useRef(null);
  const highlightedMessageRef = useRef(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (chatContainerRef.current && !highlightedMessageId) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [currentChat?.messages, highlightedMessageId]);

  // Scroll to highlighted message when it changes
  useEffect(() => {
    if (highlightedMessageId && highlightedMessageRef.current) {
      highlightedMessageRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
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

  const getOriginalMessage = (messageId) => {
    return currentChat.messages.find(msg => msg.id === messageId);
  };

  return (
    <div 
      className={`flex-1 overflow-y-auto overflow-x-hidden p-4 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}
      ref={chatContainerRef}
    >
      <div className="space-y-4 w-full">
        {currentChat.messages.map((msg) => (
          <MessageItem 
            key={msg.id}
            message={msg}
            currentChat={currentChat}
            isHighlighted={msg.id === highlightedMessageId}
            darkMode={darkMode}
            highlightedMessageRef={msg.id === highlightedMessageId ? highlightedMessageRef : null}
            originalMessage={msg.replyTo ? getOriginalMessage(msg.replyTo) : null}
            handleReplyToMessage={handleReplyToMessage}
          />
        ))}
      </div>
    </div>
  );
};

export default MessageList;