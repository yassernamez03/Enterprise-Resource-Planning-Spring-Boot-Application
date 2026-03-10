// components/ReplyBar.js
import React from 'react';
import { X } from 'lucide-react';

const ReplyBar = ({ currentChat, showReplyTo, setShowReplyTo, darkMode }) => {
  if (!currentChat || !showReplyTo) return null;

  const getOriginalMessage = (messageId) => {
    return currentChat.messages.find(msg => 
      msg.id === messageId || 
      (typeof msg === 'object' && msg.id === messageId)
    );
  };

  const originalMessage = getOriginalMessage(showReplyTo);
  if (!originalMessage) return null;

  // Handle both UI and backend message formats
  const messageText = 
    originalMessage.text || 
    (originalMessage.content ? originalMessage.content : "Attachment");

  const senderName = 
    originalMessage.sender === "user" ? "yourself" : 
    originalMessage.senderName || 
    (originalMessage.sender?.fullName || 
    (currentChat.title || "Unknown"));

  return (
    <div className={`p-2 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'} border-t flex items-center`}>
      <div className={`flex-1 rounded p-2 ${darkMode ? 'bg-gray-700' : 'bg-white'} mr-2 flex items-center`}>
        <div className={`w-1 h-6 ${darkMode ? 'bg-gray-500' : 'bg-gray-300'} mr-2`}></div>
        <div className="flex-1">
          <div className="text-xs font-medium text-teal-500">
            Replying to {senderName}
          </div>
          <div className={`text-sm truncate ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            {messageText}
          </div>
        </div>
      </div>
      <button 
        onClick={() => setShowReplyTo(null)}
        className={`p-1 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
      >
        <X size={16} className={darkMode ? 'text-gray-300' : 'text-gray-600'} />
      </button>
    </div>
  );
};

export default ReplyBar;