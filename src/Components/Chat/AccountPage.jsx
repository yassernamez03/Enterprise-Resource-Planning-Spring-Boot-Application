// components/AccountPage.js
import React, { useEffect, useState } from 'react';
import { ChevronLeft, Mail, Phone, Video, User, Image, File, Download, Play, Eye, X } from 'lucide-react';
import authService from '../../services/authService';
import userService from '../../services/userService';
import apiService from '../../services/apiInterceptor';

const AccountPage = ({ currentChat, darkMode, setShowAccountPage }) => {
  // State to store participants data
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [showMediaViewer, setShowMediaViewer] = useState(false);
  const [showAllMedia, setShowAllMedia] = useState(false);
  const [showAllDocuments, setShowAllDocuments] = useState(false);
  
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
  
  // Helper function to determine file type
  const getFileType = (message) => {
    if (message.messageType === 'IMAGE') return 'image';
    if (message.messageType === 'FILE') {
      const fileName = message.fileName || message.content || '';
      const extension = fileName.split('.').pop()?.toLowerCase();
      
      if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension)) return 'image';
      if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'].includes(extension)) return 'video';
      if (['mp3', 'wav', 'flac', 'aac', 'ogg'].includes(extension)) return 'audio';
      if (['pdf', 'doc', 'docx', 'txt', 'rtf'].includes(extension)) return 'document';
      if (['xls', 'xlsx', 'csv'].includes(extension)) return 'spreadsheet';
      if (['ppt', 'pptx'].includes(extension)) return 'presentation';
      if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) return 'archive';
    }
    return 'file';
  };
  
  // Filter messages by type
  const mediaMessages = currentChat.messages?.filter(msg => {
    const fileType = getFileType(msg);
    return ['image', 'video', 'audio'].includes(fileType);
  }) || [];
  
  const documentMessages = currentChat.messages?.filter(msg => {
    const fileType = getFileType(msg);
    return !['image', 'video', 'audio'].includes(fileType) && (msg.messageType === 'FILE' || msg.fileName);
  }) || [];
  
  // Get file icon based on type
  const getFileIcon = (message) => {
    const fileType = getFileType(message);
    switch (fileType) {
      case 'image': return <Image size={20} />;
      case 'video': return <Video size={20} />;
      case 'audio': return <File size={20} />; // You can add a music icon
      case 'document': 
      case 'pdf': return <File size={20} />;
      default: return <File size={20} />;
    }
  };
  
  // Handle media click - only for playable content
  const handleMediaClick = (message) => {
    const fileType = getFileType(message);
    if (['image', 'video', 'audio'].includes(fileType)) {
      setSelectedMedia(message);
      setShowMediaViewer(true);
    }
  };
  
  // Download file
  const downloadFile = async (message) => {
    try {
      // If you have a file URL, create a download link
      if (message.fileUrl) {
        const link = document.createElement('a');
        link.href = message.fileUrl;
        link.download = message.fileName || 'download';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // If you need to fetch from API
        const response = await apiService.get(`/files/${message.id}`, { responseType: 'blob' });
        const blob = new Blob([response.data]);
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = message.fileName || 'download';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };
  
  // Media Viewer Modal
  const MediaViewer = () => {
    if (!showMediaViewer || !selectedMedia) return null;
    
    const fileType = getFileType(selectedMedia);
    
    return (
      <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
        <div className="relative max-w-4xl max-h-full p-4 w-full h-full flex items-center justify-center">
          <button
            onClick={() => setShowMediaViewer(false)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 z-20 bg-black/50 rounded-full p-2"
          >
            <X size={24} />
          </button>
          
          {fileType === 'image' && (
            <img
              src={selectedMedia.fileUrl || selectedMedia.content}
              alt={selectedMedia.fileName || 'Image'}
              className="max-w-full max-h-full object-contain"
            />
          )}
          
          {fileType === 'video' && (
            <video
              src={selectedMedia.fileUrl || selectedMedia.content}
              controls
              className="max-w-full max-h-full"
            >
              Your browser does not support the video tag.
            </video>
          )}
          
          {fileType === 'audio' && (
            <div className="bg-gray-800 rounded-lg p-6 min-w-96 max-w-lg">
              <div className="text-center mb-4">
                <div className="bg-teal-600 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-3">
                  <File size={32} className="text-white" />
                </div>
                <h3 className="text-white text-lg font-medium">{selectedMedia.fileName}</h3>
                <p className="text-gray-400 text-sm">
                  {formatFileSize(selectedMedia.fileSize)} • Audio File
                </p>
              </div>
              <audio
                src={selectedMedia.fileUrl || selectedMedia.content}
                controls
                className="w-full"
              >
                Your browser does not support the audio tag.
              </audio>
            </div>
          )}
          
          {/* File info overlay - only for image and video */}
          {['image', 'video'].includes(fileType) && (
            <div className="absolute bottom-20 left-4 text-white bg-black/70 px-3 py-2 rounded backdrop-blur-sm">
              <p className="font-medium">{selectedMedia.fileName}</p>
              <p className="text-sm opacity-75">
                {formatFileSize(selectedMedia.fileSize)} • {new Date(selectedMedia.timestamp).toLocaleDateString()}
              </p>
            </div>
          )}
          
          {/* Download button - only for image and video */}
          {['image', 'video'].includes(fileType) && (
            <button
              onClick={() => downloadFile(selectedMedia)}
              className="absolute bottom-20 right-4 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded flex items-center space-x-2 backdrop-blur-sm"
            >
              <Download size={16} />
              <span>Download</span>
            </button>
          )}
          
          {/* Download button for audio - positioned differently */}
          {fileType === 'audio' && (
            <button
              onClick={() => downloadFile(selectedMedia)}
              className="absolute top-4 left-4 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded flex items-center space-x-2"
            >
              <Download size={16} />
              <span>Download</span>
            </button>
          )}
        </div>
      </div>
    );
  };
  
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
            <h3 className="font-medium mb-3">Media, Videos & Audio ({mediaMessages.length})</h3>
            
            {mediaMessages.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {(showAllMedia ? mediaMessages : mediaMessages.slice(0, 9)).map(msg => {
                  const fileType = getFileType(msg);
                  return (
                    <div
                      key={msg.id}
                      className="relative aspect-square rounded overflow-hidden bg-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => handleMediaClick(msg)}
                    >
                      {fileType === 'image' && (
                        <img
                          src={msg.fileUrl || msg.content}
                          alt={msg.fileName || 'Image'}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      )}
                      
                      {fileType === 'video' && (
                        <div className="relative w-full h-full">
                          <video
                            src={msg.fileUrl || msg.content}
                            className="w-full h-full object-cover"
                            muted
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                            <Play className="text-white" size={24} />
                          </div>
                        </div>
                      )}
                      
                      {fileType === 'audio' && (
                        <div className="w-full h-full bg-gradient-to-br from-teal-500 to-teal-700 flex flex-col items-center justify-center text-white">
                          <File size={32} className="mb-2" />
                          <Play className="absolute" size={20} />
                        </div>
                      )}
                      
                      {/* Fallback icon */}
                      <div className="hidden h-full w-full flex items-center justify-center">
                        {getFileIcon(msg)}
                      </div>
                      
                      {/* Overlay with file info */}
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1">
                        <p className="truncate">{msg.fileName || 'Media'}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No media shared</p>
            )}
            
            {mediaMessages.length > 9 && (
              <button 
                onClick={() => setShowAllMedia(!showAllMedia)}
                className={`mt-2 text-sm font-medium ${darkMode ? 'text-teal-400 hover:text-teal-300' : 'text-teal-600 hover:text-teal-700'}`}
              >
                {showAllMedia ? 'Show less' : `View all (${mediaMessages.length})`}
              </button>
            )}
          </div>
          
          {/* Documents Section */}
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-4 mb-4`}>
            <h3 className="font-medium mb-3">Documents ({documentMessages.length})</h3>
            
            {documentMessages.length > 0 ? (
              <div className="space-y-2">
                {(showAllDocuments ? documentMessages : documentMessages.slice(0, 5)).map(msg => (
                  <div 
                    key={msg.id}
                    className={`flex items-center p-2 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                  >
                    <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded p-2 mr-3`}>
                      {getFileIcon(msg)}
                    </div>
                    <div className="flex-1">
                      <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                        {msg.fileName || msg.content || 'Unknown file'}
                      </p>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {formatFileSize(msg.fileSize)} · {new Date(msg.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => downloadFile(msg)}
                        className={`p-2 rounded-full ${darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'}`}
                        title="Download"
                      >
                        <Download size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No documents shared</p>
            )}
            
            {documentMessages.length > 5 && (
              <button 
                onClick={() => setShowAllDocuments(!showAllDocuments)}
                className={`mt-2 text-sm font-medium ${darkMode ? 'text-teal-400 hover:text-teal-300' : 'text-teal-600 hover:text-teal-700'}`}
              >
                {showAllDocuments ? 'Show less' : `View all (${documentMessages.length})`}
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Media Viewer Modal */}
      <MediaViewer />
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