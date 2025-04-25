// components/AccountPage.js
import React, { useEffect, useState } from 'react';
import { ChevronLeft, Mail, Phone, Video, User, Image, File } from 'lucide-react';
import authService from '../../services/authService';
import userService from '../../services/userService';
import apiService from '../../services/apiInterceptor';

const AccountPage = ({ currentChat, darkMode, setShowAccountPage }) => {
  // State to store participants data
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Get current user info
  const currentUser = authService.getCurrentUser();
  
  useEffect(() => {
    const fetchParticipants = async () => {
      if (!currentChat || !currentChat.participants) {
        setLoading(false);
        return;
      }
      
      try {
        // Check if participants is an array of IDs or full user objects
        const isParticipantsIds = Array.isArray(currentChat.participants) && 
          currentChat.participants.length > 0 && 
          typeof currentChat.participants[0] !== 'object';
        
        if (isParticipantsIds) {
          console.log('Participants are IDs, fetching full user data');
          
          // Array to hold user data
          const participantData = [];
          
          // Add current user first
          if (currentUser) {
            participantData.push(currentUser);
          }
          
          // Fetch each participant's data
          const promises = currentChat.participants
            .filter(id => id !== currentUser?.id) // Skip current user
            .map(async (id) => {
              try {
                // Try to get user from API
                const user = await apiService.get(`/users/${id}`);
                return user;
              } catch (error) {
                console.error(`Error fetching user ${id}:`, error);
                // Return a placeholder user if fetch fails
                return {
                  id: id,
                  fullName: `User ${id}`,
                  email: 'Unknown',
                  active: false
                };
              }
            });
          
          // Wait for all user data to be fetched
          const fetchedUsers = await Promise.all(promises);
          setParticipants([...participantData, ...fetchedUsers]);
        } else {
          // Participants are already full objects
          console.log('Participants are already full objects');
          // Add the current user if not already included
          const participantIds = currentChat.participants.map(p => p.id);
          let allParticipants = [...currentChat.participants];
          
          if (currentUser && !participantIds.includes(currentUser.id)) {
            allParticipants = [currentUser, ...allParticipants];
          }
          
          setParticipants(allParticipants);
        }
      } catch (error) {
        console.error('Error fetching participants:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchParticipants();
  }, [currentChat]);
  
  if (!currentChat) return null;
  
  // Get avatar color based on user ID or name
  const getUserAvatarColor = (id) => {
    const colors = ['blue', 'green', 'purple', 'red', 'yellow', 'teal', 'indigo', 'pink'];
    const colorIndex = (typeof id === 'number' ? id : id?.charCodeAt(0) || 0) % colors.length;
    return colors[colorIndex];
  };
  
  // Get initials for avatar
  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  // Filter media messages from chat
  const mediaMessages = currentChat.messages?.filter(msg => 
    msg.messageType === 'FILE' && msg.fileType?.startsWith('image/')
  ) || [];
  
  // Filter document messages from chat
  const documentMessages = currentChat.messages?.filter(msg => 
    msg.messageType === 'FILE' && !msg.fileType?.startsWith('image/')
  ) || [];
  
  return (
    <div className="flex flex-col h-full">
      <div className={`${darkMode ? 'bg-gray-800 text-white' : 'bg-gray-50'} p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex items-center`}>
        <button 
          className={`p-2 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
          onClick={() => setShowAccountPage(false)}
        >
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-lg font-medium ml-4">Chat Info</h2>
      </div>
      
      <div className="overflow-y-auto flex-1">
        {/* Chat Information */}
        <div className="flex flex-col items-center p-6 border-b">
          <div className={`bg-${getUserAvatarColor(currentChat.id)}-500 rounded-full h-24 w-24 flex items-center justify-center text-white font-bold text-3xl mb-4`}>
            {currentChat.avatar || getInitials(currentChat.title)}
          </div>
          
          <h2 className="text-xl font-bold mb-2">{currentChat.title}</h2>
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-6`}>
            {currentChat.status === 'ARCHIVED' ? 'Archived chat' : 'Active chat'}
          </p>
          
          <div className="flex space-x-4">
            <button className={`p-3 rounded-full ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}>
              <Phone size={20} className={darkMode ? 'text-gray-300' : 'text-gray-600'} />
            </button>
            <button className={`p-3 rounded-full ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}>
              <Video size={20} className={darkMode ? 'text-gray-300' : 'text-gray-600'} />
            </button>
            <button className={`p-3 rounded-full ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}>
              <Mail size={20} className={darkMode ? 'text-gray-300' : 'text-gray-600'} />
            </button>
          </div>
        </div>
        
        {/* Participants Section */}
        <div className={`p-4 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-4 mb-4`}>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-medium">Participants ({participants.length})</h3>
              {loading && <span className="text-sm text-gray-500">Loading...</span>}
            </div>
            
            {/* List all participants */}
            <div className="space-y-2">
              {participants.length > 0 ? (
                <>
                  {/* Display participants */}
                  {participants.map(user => (
                    <div key={user.id} className={`flex items-center p-2 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
                      <div className={`bg-${getUserAvatarColor(user.id)}-500 rounded-full h-10 w-10 flex items-center justify-center text-white mr-3`}>
                        {getInitials(user.fullName)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center">
                          <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                            {user.fullName} 
                          </p>
                          {user.id === currentUser?.id && (
                            <span className={`ml-2 text-xs px-2 py-1 ${darkMode ? 'bg-teal-900 text-teal-300' : 'bg-teal-100 text-teal-800'} rounded-full`}>You</span>
                          )}
                        </div>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{user.email}</p>
                      </div>
                      <div className={`w-2 h-2 rounded-full ${user.active ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    </div>
                  ))}
                </>
              ) : loading ? (
                <div className={`p-3 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Loading participants...
                </div>
              ) : (
                <div className={`p-3 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  No participants found
                </div>
              )}
            </div>
          </div>
          
          {/* Media Section */}
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-4 mb-4`}>
            <h3 className="font-medium mb-3">Media ({mediaMessages.length})</h3>
            
            {mediaMessages.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {mediaMessages.slice(0, 9).map(msg => (
                  <a 
                    key={msg.id} 
                    href={msg.fileUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="block aspect-square rounded overflow-hidden bg-gray-200"
                  >
                    <div className="h-full w-full flex items-center justify-center">
                      <Image size={24} className="text-gray-400" />
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No media shared</p>
            )}
            
            {mediaMessages.length > 9 && (
              <button className={`mt-2 text-sm font-medium ${darkMode ? 'text-teal-400' : 'text-teal-600'}`}>
                View all
              </button>
            )}
          </div>
          
          {/* Documents Section */}
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-4 mb-4`}>
            <h3 className="font-medium mb-3">Documents ({documentMessages.length})</h3>
            
            {documentMessages.length > 0 ? (
              <div className="space-y-2">
                {documentMessages.slice(0, 5).map(msg => (
                  <a 
                    key={msg.id}
                    href={msg.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center p-2 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                  >
                    <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded p-2 mr-3`}>
                      <File size={20} className={darkMode ? 'text-gray-300' : 'text-gray-600'} />
                    </div>
                    <div className="flex-1">
                      <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>{msg.fileName}</p>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {formatFileSize(msg.fileSize)} · {new Date(msg.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No documents shared</p>
            )}
            
            {documentMessages.length > 5 && (
              <button className={`mt-2 text-sm font-medium ${darkMode ? 'text-teal-400' : 'text-teal-600'}`}>
                View all
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Format file size helper function
const formatFileSize = (bytes) => {
  if (!bytes) return 'Unknown size';
  if (bytes < 1024) return bytes + ' bytes';
  else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  else return (bytes / 1048576).toFixed(1) + ' MB';
};

export default AccountPage;