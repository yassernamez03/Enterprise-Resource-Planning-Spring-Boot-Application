// components/NewChatButton.js
import React, { useState, useEffect, useRef } from 'react';
import { MessageSquarePlus, Users, X, ChevronLeft, Search, UserPlus, Loader } from 'lucide-react';
import useOutsideClick from '../../hooks/useOutsideClick';
import apiService from '../../services/apiInterceptor';
import authService from '../../services/authService';

const NewChatButton = ({ darkMode, onCreateNewChat }) => {
  const [showUsersList, setShowUsersList] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const usersListRef = useOutsideClick(() => setShowUsersList(false));

  // Long press handling
  const longPressTimer = useRef(null);
  const longPressDelay = 500; // milliseconds for long press detection

  // Current user ID to avoid showing the current user in the list
  const currentUserId = authService.getCurrentUser()?.id;

  // Load users from API when modal opens
  useEffect(() => {
    if (showUsersList) {
      loadUsers();
    }
  }, [showUsersList]);

  // Function to load users from API
  const loadUsers = async () => {
    setLoading(true);
    setError(null);

    try {
      const users = await apiService.get('/users');
      
      // Filter out the current user and transform the data as needed
      const filteredUsers = users
        .filter(user => user.id !== currentUserId && user.approvalStatus == 'APPROVED' )
        .map(user => ({
          id: user.id,
          name: user.fullName || (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email),
          avatar: user.fullName ? user.fullName.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase(),
          status: user.status || 'offline',
          email: user.email
        }));
      
      setUsersList(filteredUsers);
    } catch (err) {
      console.error('Error loading users:', err);
      setError('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = usersList.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Handle long press start
  const handleTouchStart = (user) => {
    // Clear any existing timer
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
    
    // Set a new timer
    longPressTimer.current = setTimeout(() => {
      // Enter multi-select mode if not already in it
      if (!multiSelectMode) {
        setMultiSelectMode(true);
        // Add the user to selection
        const isAlreadySelected = selectedUsers.some(selectedUser => selectedUser.id === user.id);
        if (!isAlreadySelected) {
          setSelectedUsers([...selectedUsers, user]);
        }
      }
    }, longPressDelay);
  };

  // Handle touch end to clear the timer
  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };

  // Handle user selection with Ctrl key support for desktop and touch for mobile
  const handleUserSelect = (event, user) => {
    // If already in multi-select mode or ctrl key is pressed, add to multiple selection
    if (multiSelectMode || event.ctrlKey) {
      // If not already in multi-select mode, enter it
      if (!multiSelectMode && event.ctrlKey) {
        setMultiSelectMode(true);
      }
      
      // Check if user is already selected
      const isAlreadySelected = selectedUsers.some(selectedUser => selectedUser.id === user.id);

      if (isAlreadySelected) {
        // Remove from selection
        setSelectedUsers(selectedUsers.filter(selectedUser => selectedUser.id !== user.id));
      } else {
        // Add to selection
        setSelectedUsers([...selectedUsers, user]);
      }
    } else {
      // Single selection (replace current selection)
      setSelectedUsers([user]);
      
      // If there is only one user selected and not in multi-select mode, create chat immediately
      createChat([user]);
    }
  };

  // Exit multi-select mode
  const exitMultiSelectMode = () => {
    setMultiSelectMode(false);
    setSelectedUsers([]);
  };

  // Create chat with selected users
  const createChat = (users = selectedUsers) => {
    if (users.length === 0) return;

    // Generate chat title based on participants
    const chatTitle = users.length === 1 
      ? users[0].name 
      : `${users[0].name}, ${users[1].name}${users.length > 2 ? ` and ${users.length - 2} others` : ''}`;

    // Extract participant IDs
    const participantIds = users.map(user => user.id);

    // Call the API to create a new chat
    onCreateNewChat({
      title: chatTitle,
      participants: participantIds
    });

    // Reset selection and close modal
    setSelectedUsers([]);
    setMultiSelectMode(false);
    setShowUsersList(false);
  };

  // Function to handle "Start Chat" button click
  const handleStartGroupChat = () => {
    if (selectedUsers.length > 1) {
      createChat();
    }
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
                {multiSelectMode ? (
                  <button 
                    className={`p-2 mr-2 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
                    onClick={exitMultiSelectMode}
                  >
                    <X size={20} className={darkMode ? 'text-gray-300' : 'text-gray-600'} />
                  </button>
                ) : (
                  <button 
                    className={`p-2 mr-2 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
                    onClick={() => setShowUsersList(false)}
                  >
                    <ChevronLeft size={20} className={darkMode ? 'text-gray-300' : 'text-gray-600'} />
                  </button>
                )}
                <h2 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  {multiSelectMode ? 'Select Contacts' : 'New Chat'}
                </h2>
              </div>
              <button 
                className={`p-2 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
                onClick={() => setShowUsersList(false)}
              >
                <X size={20} className={darkMode ? 'text-gray-300' : 'text-gray-600'} />
              </button>
            </div>
            
            {/* Search bar */}
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
            
            {/* Selection info */}
            {selectedUsers.length > 0 && (
              <div className={`px-4 py-2 ${darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-800'}`}>
                <div className="flex items-center justify-between">
                  <span>Selected: {selectedUsers.length} {selectedUsers.length === 1 ? 'user' : 'users'}</span>
                  {selectedUsers.length > 1 && (
                    <button 
                      onClick={handleStartGroupChat}
                      className={`px-3 py-1 rounded ${darkMode ? 'bg-teal-600 hover:bg-teal-700' : 'bg-teal-500 hover:bg-teal-600'} text-white flex items-center`}
                    >
                      <UserPlus size={16} className="mr-1" />
                      Start Group Chat
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap mt-2 gap-1">
                  {selectedUsers.map(user => (
                    <div 
                      key={user.id} 
                      className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 ${darkMode ? 'bg-gray-600 text-gray-200' : 'bg-gray-200 text-gray-800'}`}
                    >
                      {user.name}
                      <button 
                        onClick={() => setSelectedUsers(selectedUsers.filter(u => u.id !== user.id))}
                        className="hover:text-gray-500"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Loading state */}
            {loading && (
              <div className="flex-1 flex items-center justify-center p-4">
                <div className="flex flex-col items-center">
                  <Loader className={`animate-spin ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} size={24} />
                  <p className={`mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Loading contacts...</p>
                </div>
              </div>
            )}
            
            {/* Error state */}
            {error && !loading && (
              <div className="flex-1 flex items-center justify-center p-4">
                <div className="flex flex-col items-center text-center">
                  <p className="text-red-500 mb-2">{error}</p>
                  <button 
                    onClick={loadUsers}
                    className={`px-3 py-1 rounded ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}
            
            {/* User list */}
            {!loading && !error && (
              <div className="overflow-y-auto flex-1">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => {
                    const isSelected = selectedUsers.some(selectedUser => selectedUser.id === user.id);
                    return (
                      <div
                        key={user.id}
                        className={`flex items-center p-3 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} cursor-pointer ${
                          isSelected ? (darkMode ? 'bg-gray-700' : 'bg-gray-200') : ''
                        }`}
                        onClick={(e) => handleUserSelect(e, user)}
                        onTouchStart={() => handleTouchStart(user)}
                        onTouchEnd={handleTouchEnd}
                        onTouchCancel={handleTouchEnd}
                      >
                        <div className={`bg-${user.id % 5 === 0 ? 'yellow' : user.id % 4 === 0 ? 'red' : user.id % 3 === 0 ? 'purple' : user.id % 2 === 0 ? 'green' : 'blue'}-500 rounded-full h-12 w-12 flex items-center justify-center text-white font-bold`}>
                          {user.avatar}
                        </div>
                        <div className="ml-3 flex-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <h3 className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{user.name}</h3>
                              <div className={`ml-2 w-2 h-2 rounded-full ${user.status === 'online' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                            </div>
                            {isSelected && (
                              <div className={`w-5 h-5 rounded-full ${darkMode ? 'bg-teal-600' : 'bg-teal-500'} flex items-center justify-center`}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            )}
                          </div>
                          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {user.email || (user.status === 'online' ? 'Online' : 'Offline')}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-4 text-center text-gray-500">No contacts found</div>
                )}
              </div>
            )}
            
            {/* Empty state */}
            {!loading && !error && filteredUsers.length === 0 && usersList.length > 0 && (
              <div className="p-4 text-center text-gray-500">No contacts match your search</div>
            )}
            
            {/* Footer with instructions */}
            {!loading && !error && usersList.length > 0 && (
              <div className={`p-3 border-t ${darkMode ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-600'} text-xs`}>
                <p>Click on a user to start a one-on-one chat</p>
                <p className="hidden md:block">Hold Ctrl and click multiple users to create a group chat</p>
                <p className="md:hidden">Hold (long press) on a user to select multiple users for a group chat</p>
                {multiSelectMode && (
                  <p className="text-teal-500 font-medium mt-1">Multi-select mode activated</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default NewChatButton;