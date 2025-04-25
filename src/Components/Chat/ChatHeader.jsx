// components/ChatHeader.js
import React, { useState } from 'react';
import { ChevronLeft, Search, MoreVertical, Info, Archive, Trash2 } from 'lucide-react';
import useOutsideClick from '../../hooks/useOutsideClick';

const ChatHeader = ({ 
  currentChat, 
  darkMode, 
  mobileView, 
  setShowChatView, 
  setShowAccountPage, 
  toggleArchiveChat, 
  setShowSearchInChat,
  isUserTyping
}) => {
  const [showChatMenu, setShowChatMenu] = useState(false);
  const chatMenuRef = useOutsideClick(() => setShowChatMenu(false));
  
  if (!currentChat) return null;
  
  // Function to get user avatar color based on ID
  const getUserAvatarColor = (id) => {
    const colors = ['blue', 'green', 'purple', 'red', 'yellow', 'teal', 'indigo', 'pink'];
    const colorIndex = id % colors.length;
    return colors[colorIndex];
  };
  
  // Get the first letter of each word in the chat title for the avatar
  const getAvatarText = () => {
    if (!currentChat.title) return "?";
    return currentChat.title
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  return (
    <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'} p-3 border-b flex items-center justify-between`}>
      <div className="flex items-center">
        {mobileView && (
          <button 
            className={`p-2 mr-2 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
            onClick={() => setShowChatView(false)}
          >
            <ChevronLeft size={20} className={darkMode ? 'text-gray-300' : 'text-gray-600'} />
          </button>
        )}
        <div 
          className={`bg-${getUserAvatarColor(currentChat.id)}-500 rounded-full h-10 w-10 flex items-center justify-center text-white font-bold cursor-pointer`}
          onClick={() => setShowAccountPage(true)}
        >
          {getAvatarText()}
        </div>
        <div 
          className="ml-3 cursor-pointer"
          onClick={() => setShowAccountPage(true)}
        >
          <h2 className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
            {currentChat.title}
          </h2>
          {isUserTyping ? (
            <p className={`text-xs ${darkMode ? 'text-teal-400' : 'text-teal-600'}`}>
              Typing<span className="animate-ellipsis"></span>
            </p>
          ) : (
            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Online
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <button
          className={`p-2 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
          onClick={() => setShowSearchInChat(true)}
        >
          <Search className={darkMode ? 'text-gray-300' : 'text-gray-600'} size={20} />
        </button>
        <div className="relative">
          <button 
            className={`p-2 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
            onClick={() => setShowChatMenu(!showChatMenu)}
          >
            <MoreVertical className={darkMode ? 'text-gray-300' : 'text-gray-600'} size={20} />
          </button>
          
          {showChatMenu && (
            <div 
              ref={chatMenuRef}
              className={`absolute right-0 top-full mt-1 w-40 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg shadow-lg z-10`}
            >
              <div 
                className={`p-3 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} cursor-pointer flex items-center`}
                onClick={() => {
                  setShowAccountPage(true);
                  setShowChatMenu(false);
                }}
              >
                <Info size={16} className="mr-2" />
                <span>Contact Info</span>
              </div>
              <div 
                className={`p-3 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} cursor-pointer flex items-center`}
                onClick={() => {
                  toggleArchiveChat(currentChat.id);
                  setShowChatMenu(false);
                }}
              >
                <Archive size={16} className="mr-2" />
                <span>{currentChat.status === 'ARCHIVED' ? 'Unarchive Chat' : 'Archive Chat'}</span>
              </div>
              <div className={`p-3 ${darkMode ? 'hover:bg-gray-700 text-red-400' : 'hover:bg-gray-100 text-red-500'} cursor-pointer flex items-center`}>
                <Trash2 size={16} className="mr-2" />
                <span>Delete Chat</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;