// components/ReplyBar.js
import React from 'react';
import { X } from 'lucide-react';

const ReplyBar = ({ currentChat, showReplyTo, setShowReplyTo, darkMode }) => {
  if (!currentChat) return null;

  const getOriginalMessage = (messageId) => {
    return currentChat.messages.find(msg => msg.id === messageId);
  };

  const originalMessage = getOriginalMessage(showReplyTo);
  if (!originalMessage) return null;

  return (
    <div className={`p-2 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'} border-t flex items-center`}>
      <div className={`flex-1 rounded p-2 ${darkMode ? 'bg-gray-700' : 'bg-white'} mr-2 flex items-center`}>
        <div className={`w-1 h-6 ${darkMode ? 'bg-gray-500' : 'bg-gray-300'} mr-2`}></div>
        <div className="flex-1">
          <div className="text-xs font-medium text-teal-500">
            Replying to {originalMessage.sender === "user" ? "yourself" : currentChat.name}
          </div>
          <div className={`text-sm truncate ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            {originalMessage.text}
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