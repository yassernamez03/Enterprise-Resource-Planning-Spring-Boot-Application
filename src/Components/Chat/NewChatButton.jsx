// components/NewChatButton.js
import React, { useState } from 'react';
import { MessageSquarePlus, Users, X, ChevronLeft, Search } from 'lucide-react';
import useOutsideClick from '../../hooks/useOutsideClick';

const NewChatButton = ({ darkMode, onCreateNewChat }) => {
  const [showUsersList, setShowUsersList] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const usersListRef = useOutsideClick(() => setShowUsersList(false));

  // Sample users list - in a real app this would come from an API or props
  const usersList = [
    { id: 101, name: "Alex Johnson", avatar: "A", status: "online" },
    { id: 102, name: "Emma Davis", avatar: "E", status: "online" },
    { id: 103, name: "Michael Brown", avatar: "M", status: "offline" },
    { id: 104, name: "Sophia Wilson", avatar: "S", status: "online" },
    { id: 105, name: "William Taylor", avatar: "W", status: "offline" },
    { id: 106, name: "Olivia Martinez", avatar: "O", status: "online" },
  ];

  const filteredUsers = usersList.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleNewChat = (userId, userName, userAvatar) => {
    onCreateNewChat({
      id: Date.now(),
      name: userName,
      avatar: userAvatar,
      lastMessage: "",
      time: "Just now",
      unread: 0,
      archived: false,
      messages: []
    });
    setShowUsersList(false);
  };

  return (
    <>
      <div 
        className={`p-3 ${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'} border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} cursor-pointer flex items-center justify-between`}
        onClick={() => setShowUsersList(true)}
      >
        <div className="flex items-center">
          <div className={`bg-teal-500 rounded-full h-12 w-12 flex items-center justify-center text-white mr-3`}>
            <MessageSquarePlus size={20} />
          </div>
          <div>
            <h3 className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>New Chat</h3>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Start a conversation</p>
          </div>
        </div>
      </div>

      {/* User selection modal */}
      {showUsersList && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 z-50 flex items-center justify-center p-4">
          <div 
            ref={usersListRef}
            className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg max-w-md w-full max-h-[80vh] flex flex-col`}
          >
            <div className={`p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between`}>
              <div className="flex items-center">
                <button 
                  className={`p-2 mr-2 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
                  onClick={() => setShowUsersList(false)}
                >
                  <ChevronLeft size={20} className={darkMode ? 'text-gray-300' : 'text-gray-600'} />
                </button>
                <h2 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>New Chat</h2>
              </div>
              <button 
                className={`p-2 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
                onClick={() => setShowUsersList(false)}
              >
                <X size={20} className={darkMode ? 'text-gray-300' : 'text-gray-600'} />
              </button>
            </div>
            
            <div className="p-3">
              <div className={`flex items-center ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg px-3 py-2`}>
                <Search className={darkMode ? 'text-gray-400' : 'text-gray-500'} size={18} />
                <input
                  type="text"
                  placeholder="Search contacts"
                  className={`bg-transparent flex-1 outline-none ml-2 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className={`${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>
            
            <div className="overflow-y-auto flex-1">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className={`flex items-center p-3 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} cursor-pointer`}
                    onClick={() => handleNewChat(user.id, user.name, user.avatar)}
                  >
                    <div className={`bg-${user.id % 5 === 0 ? 'yellow' : user.id % 4 === 0 ? 'red' : user.id % 3 === 0 ? 'purple' : user.id % 2 === 0 ? 'green' : 'blue'}-500 rounded-full h-12 w-12 flex items-center justify-center text-white font-bold`}>
                      {user.avatar}
                    </div>
                    <div className="ml-3">
                      <div className="flex items-center">
                        <h3 className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{user.name}</h3>
                        <div className={`ml-2 w-2 h-2 rounded-full ${user.status === 'online' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                      </div>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {user.status === 'online' ? 'Online' : 'Offline'}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-gray-500">No contacts found</div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NewChatButton;