// components/MessageItem.js
import React, { useEffect, useState } from 'react';
import { Check, Reply, Mic, Image, Camera, File } from 'lucide-react';

const MessageItem = ({
  message,
  currentChat,
  isHighlighted,
  darkMode,
  highlightedMessageRef,
  originalMessage,
  handleReplyToMessage
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  // Animation effect when highlighted changes
  useEffect(() => {
    if (isHighlighted) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isHighlighted]);

  // Define the animation styles
  const highlightAnimation = isAnimating ? {
    animation: 'highlightPulse 2s ease-in-out',
    background: message.sender === "user" 
      ? (darkMode ? 'rgba(22, 163, 74, 0.8)' : 'rgba(220, 252, 231, 0.9)') 
      : (darkMode ? 'rgba(55, 65, 81, 0.8)' : 'rgba(255, 255, 255, 0.9)')
  } : {};

  // Add the animation keyframes to the document
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      @keyframes highlightPulse {
        0%, 100% { 
          background: ${message.sender === "user" 
            ? (darkMode ? 'rgba(22, 163, 74, 1)' : 'rgba(220, 252, 231, 1)') 
            : (darkMode ? 'rgba(55, 65, 81, 1)' : 'rgba(255, 255, 255, 1)')};
          box-shadow: 0 0 0 0 rgba(20, 184, 166, 0); 
        }
        50% { 
          background: ${message.sender === "user" 
            ? (darkMode ? 'rgba(6, 95, 70, 1)' : 'rgba(167, 243, 208, 1)') 
            : (darkMode ? 'rgba(31, 41, 55, 1)' : 'rgba(229, 231, 235, 1)')};
          box-shadow: 0 0 0 4px rgba(20, 184, 166, 0.3); 
        }
      }
    `;
    document.head.appendChild(styleElement);
    return () => {
      document.head.removeChild(styleElement);
    };
  }, [darkMode, message.sender]);

  return (
    <div
      className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
      ref={highlightedMessageRef}
    >
      <div
        className={`relative max-w-xs md:max-w-md rounded-lg p-3 ${
          isHighlighted ? 'ring-2 ring-teal-500 ring-offset-2' : ''
        } ${
          message.sender === "user"
            ? `${darkMode ? 'bg-green-800 text-white' : 'bg-green-100 text-gray-800'}`
            : `${darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-800'}`
        }`}
        style={highlightAnimation}
      >
        {originalMessage && (
          <div 
            className={`mb-2 p-2 text-sm rounded-md ${
              darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'
            } border-l-2 border-teal-500`}
          >
            <div className="font-medium text-xs">
              {originalMessage.sender === "user" ? "You" : currentChat.name}
            </div>
            <div className="truncate">
              {originalMessage.text.length > 50 ? `${originalMessage.text.substring(0, 50)}...` : originalMessage.text}
            </div>
          </div>
        )}
        
        {message.isVoice ? (
          <div className="flex items-center space-x-2">
            <div className={`${darkMode ? 'bg-gray-600' : 'bg-gray-200'} rounded-full p-2`}>
              <Mic size={16} />
            </div>
            <div className="flex-1">
              <div className={`h-2 ${darkMode ? 'bg-gray-600' : 'bg-gray-300'} rounded-full`}>
                <div className={`h-2 ${darkMode ? 'bg-gray-400' : 'bg-gray-500'} rounded-full w-1/2`}></div>
              </div>
            </div>
            <span className="text-xs">{message.duration}</span>
          </div>
        ) : message.isAttachment ? (
          <div className="flex items-center space-x-2">
            {message.attachmentType === 'image' && <Image size={20} />}
            {message.attachmentType === 'camera' && <Camera size={20} />}
            {message.attachmentType === 'file' && <File size={20} />}
            <span>{message.text}</span>
          </div>
        ) : (
          <p>{message.text}</p>
        )}
        <div className="flex items-center justify-end mt-1">
          <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mr-1`}>{message.time}</span>
          {message.sender === "user" && (
            <Check className={darkMode ? "text-gray-400" : "text-gray-500"} size={14} />
          )}
        </div>
        
        {/* Message actions on hover */}
        <div className={`absolute -left-10 top-0 h-full flex items-center ${message.sender === "user" ? "hidden" : ""}`}>
          <div className={`p-1 rounded-full ${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'} opacity-0 group-hover:opacity-100 cursor-pointer`}>
            <Reply 
              size={16} 
              className={darkMode ? 'text-gray-300' : 'text-gray-600'}
              onClick={() => handleReplyToMessage(message.id)}
            />
          </div>
        </div>
        
        <div className={`absolute -right-10 top-0 h-full flex items-center ${message.sender === "contact" ? "hidden" : ""}`}>
          <div className={`p-1 rounded-full ${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'} opacity-0 group-hover:opacity-100 cursor-pointer`}>
            <Reply 
              size={16}
              className={darkMode ? 'text-gray-300' : 'text-gray-600'}
              onClick={() => handleReplyToMessage(message.id)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageItem;