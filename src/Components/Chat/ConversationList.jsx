// components/ConversationList.js
import React from 'react';
import { Archive } from 'lucide-react';
import NewChatButton from './NewChatButton';

// components/ConversationList.js
const ConversationList = ({ conversations, activeChat, handleChatSelect, darkMode, onCreateNewChat }) => {
  return (
    <div className="flex-1 overflow-y-auto">
      <NewChatButton darkMode={darkMode} onCreateNewChat={onCreateNewChat} />
      
      {conversations.map((conversation) => (
        <div
          key={conversation.id}
          className={`flex items-center p-3 border-b ${darkMode ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-100 hover:bg-gray-50'} cursor-pointer ${
            activeChat === conversation.id ? (darkMode ? "bg-gray-700" : "bg-gray-100") : ""
          }`}
          onClick={() => handleChatSelect(conversation.id)}
        >
          <div className={`bg-${conversation.id % 5 === 0 ? 'yellow' : conversation.id % 4 === 0 ? 'red' : conversation.id % 3 === 0 ? 'purple' : conversation.id % 2 === 0 ? 'green' : 'blue'}-500 rounded-full h-12 w-12 flex items-center justify-center text-white font-bold`}>
            {conversation.avatar || conversation.title?.charAt(0) || '?'}
          </div>
          <div className="ml-3 flex-1">
            <div className="flex justify-between">
              <h3 className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                {conversation.title}
              </h3>
              <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{conversation.time}</span>
            </div>
            <div className="flex justify-between items-center">
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} truncate max-w-xs`}>
                {conversation.status === 'ARCHIVED' && <Archive size={12} className="inline mr-1" />}
                {conversation.status === 'CLOSED' && <span className="text-red-500">[Closed] </span>}
                {conversation.lastMessage}
              </p>
              {conversation.unread > 0 && (
                <span className="bg-teal-500 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs">
                  {conversation.unread}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ConversationList;