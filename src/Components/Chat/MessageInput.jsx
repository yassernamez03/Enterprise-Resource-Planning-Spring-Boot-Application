// components/MessageInput.js
import React, { useState, useRef } from 'react';
import { Send, Paperclip, Smile, Mic, X, Image, Camera, File } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import ReplyBar from './ReplyBar';
import useOutsideClick from '../../hooks/useOutsideClick';

const MessageInput = ({ 
  darkMode, 
  handleSendMessage, 
  currentChat,
  showReplyTo,
  setShowReplyTo
}) => {
  const [message, setMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [timerInterval, setTimerInterval] = useState(null);
  const [showAttachmentOptions, setShowAttachmentOptions] = useState(false);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  
  const messageInputRef = useRef(null);
  const emojiPickerRef = useOutsideClick(() => setEmojiPickerOpen(false));
  const attachmentMenuRef = useOutsideClick(() => setShowAttachmentOptions(false));

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const submitMessage = () => {
    if (message.trim()) {
      const newMessage = {
        id: Date.now(),
        text: message,
        sender: "user",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        replyTo: showReplyTo
      };
      
      handleSendMessage(newMessage);
      setMessage("");
      setShowReplyTo(null);
    }
  };

  const startRecording = () => {
    setIsRecording(true);
    // Reset timer
    setRecordingTime(0);
    // Start timer
    const interval = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
    setTimerInterval(interval);
  };

  const stopRecording = () => {
    setIsRecording(false);
    clearInterval(timerInterval);
    setTimerInterval(null);
    
    // Simulate sending a voice message
    const voiceMessage = {
      id: Date.now(),
      text: "🎤 Voice message",
      sender: "user",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isVoice: true,
      duration: `${Math.floor(recordingTime / 60)}:${(recordingTime % 60).toString().padStart(2, '0')}`
    };
    
    handleSendMessage(voiceMessage);
  };

  const handleAttachment = (type) => {
    setShowAttachmentOptions(false);
    
    // Simulate sending an attachment
    const attachmentTypes = {
      image: "📷 Image",
      camera: "📸 Photo",
      file: "📎 File"
    };
    
    const attachmentMessage = {
      id: Date.now(),
      text: attachmentTypes[type],
      sender: "user",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isAttachment: true,
      attachmentType: type
    };
    
    handleSendMessage(attachmentMessage);
  };

  const handleEmojiClick = (emojiData, event) => {
    setMessage(prev => prev + emojiData.emoji);
    messageInputRef.current?.focus();
  };

  return (
    <>
      {showReplyTo && (
        <ReplyBar 
          currentChat={currentChat}
          showReplyTo={showReplyTo}
          setShowReplyTo={setShowReplyTo}
          darkMode={darkMode}
        />
      )}

      <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'} p-3 border-t`}>
        {isRecording ? (
          <div className={`flex items-center ${darkMode ? 'bg-gray-700' : 'bg-white'} rounded-full px-4 py-2`}>
            <div className="flex-1 flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded-full mr-2 animate-pulse"></div>
              <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Recording... {formatTime(recordingTime)}</span>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setIsRecording(false)}
                className={darkMode ? 'text-gray-300 hover:text-gray-100' : 'text-gray-500 hover:text-gray-700'}
              >
                <X size={20} />
              </button>
              <button
                onClick={stopRecording}
                className="bg-teal-500 rounded-full p-2 text-white"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        ) : (
          <div className={`flex items-center ${darkMode ? 'bg-gray-700' : 'bg-white'} rounded-full px-4 py-2`}>
            <div className="relative">
              <button 
                onClick={() => setEmojiPickerOpen(!emojiPickerOpen)}
                className={darkMode ? 'text-gray-300 hover:text-gray-100' : 'text-gray-500 hover:text-gray-700'}
              >
                <Smile size={20} />
              </button>
              
              {emojiPickerOpen && (
                <div 
                  ref={emojiPickerRef}
                  className="absolute bottom-full left-0 mb-2 z-10"
                >
                  <EmojiPicker 
                    onEmojiClick={handleEmojiClick} 
                    theme={darkMode ? 'dark' : 'light'}
                    searchDisabled={false}
                    skinTonesDisabled={false}
                    width={300}
                    height={400}
                  />
                </div>
              )}
            </div>
            <input
              type="text"
              placeholder="Type a message"
              className={`bg-transparent flex-1 outline-none mx-2 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") submitMessage();
              }}
              ref={messageInputRef}
            />
            <div className="flex items-center space-x-3">
              <div className="relative">
                <button
                  onClick={() => setShowAttachmentOptions(!showAttachmentOptions)}
                  className={darkMode ? 'text-gray-300 hover:text-gray-100' : 'text-gray-500 hover:text-gray-700'}
                >
                  <Paperclip size={20} />
                </button>
                
                {showAttachmentOptions && (
                  <div 
                    ref={attachmentMenuRef}
                    className={`absolute bottom-full right-0 mb-2 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg shadow-lg border p-2`}
                  >
                    <div className="flex flex-col space-y-2">
                      <button 
                        className={`flex items-center p-2 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} rounded`}
                        onClick={() => handleAttachment('image')}
                      >
                        <Image size={20} className="mr-2" />
                        <span>Gallery</span>
                      </button>
                      <button 
                        className={`flex items-center p-2 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} rounded`}
                        onClick={() => handleAttachment('camera')}
                      >
                        <Camera size={20} className="mr-2" />
                        <span>Camera</span>
                      </button>
                      <button 
                        className={`flex items-center p-2 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} rounded`}
                        onClick={() => handleAttachment('file')}
                      >
                        <File size={20} className="mr-2" />
                        <span>Document</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              {message.trim() ? (
                <button
                  onClick={submitMessage}
                  className="bg-teal-500 rounded-full p-2 text-white"
                >
                  <Send size={16} />
                </button>
              ) : (
                <button
                  onClick={startRecording}
                  className="bg-teal-500 rounded-full p-2 text-white"
                >
                  <Mic size={16} />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default MessageInput;