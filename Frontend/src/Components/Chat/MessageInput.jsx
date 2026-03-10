import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Paperclip,
  Smile,
  Mic,
  X,
  Image,
  Video,
  File,
  Music,
} from "lucide-react";
import EmojiPicker from "emoji-picker-react";
import ReplyBar from "./ReplyBar";
import useOutsideClick from "../../hooks/useOutsideClick";
import { apiService } from "../../services/apiInterceptor";

const MessageInput = ({
  darkMode,
  handleSendMessage,
  currentChat,
  showReplyTo,
  setShowReplyTo,
  onTypingStatusChange,
}) => {
  const [message, setMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [timerInterval, setTimerInterval] = useState(null);
  const [showAttachmentOptions, setShowAttachmentOptions] = useState(false);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);

  const messageInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const audioInputRef = useRef(null);
  const emojiPickerRef = useOutsideClick(() => setEmojiPickerOpen(false));
  const attachmentMenuRef = useOutsideClick(() =>
    setShowAttachmentOptions(false)
  );

  // Handle typing indicator logic
  useEffect(() => {
    if (message.trim() && onTypingStatusChange) {
      onTypingStatusChange(true);

      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }

      const newTimeout = setTimeout(() => {
        onTypingStatusChange(false);
      }, 2000);

      setTypingTimeout(newTimeout);
    }

    return () => {
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
    };
  }, [message, onTypingStatusChange]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const submitMessage = () => {
    if (message.trim()) {
      const newMessage = {
        id: Date.now(),
        text: message,
        sender: "user",
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        messageType: "TEXT",
        replyTo: showReplyTo,
      };

      handleSendMessage(newMessage);
      setMessage("");
      setShowReplyTo(null);

      if (onTypingStatusChange) {
        onTypingStatusChange(false);
      }
    }
  };

  const startRecording = async () => {
    try {
      console.log("Requesting microphone access...");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log("Microphone access granted");

      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' }); // Use WebM for better compatibility
      setMediaRecorder(recorder);
      setAudioChunks([]);

      recorder.ondataavailable = (event) => {
        console.log("New audio chunk available:", event.data.size, "bytes");
        if (event.data.size > 0) {
          setAudioChunks((prev) => [...prev, event.data]);
        }
      };

      recorder.onerror = (event) => {
        console.error("MediaRecorder error:", event.error);
      };

      recorder.start(1000); // Collect data every 1 second
      console.log("Recording started");
      setIsRecording(true);
      setRecordingTime(0);
      
      const interval = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
      setTimerInterval(interval);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = async () => {
    if (!mediaRecorder) {
      console.error("No media recorder instance found");
      return;
    }

    console.log("Stopping recording...");
    mediaRecorder.stop();
    setIsRecording(false);
    clearInterval(timerInterval);
    setTimerInterval(null);

    mediaRecorder.onstop = async () => {
      console.log("Recording stopped. Audio chunks:", audioChunks);
      
      if (audioChunks.length === 0) {
        console.error("No audio data recorded");
        return;
      }

      try {
        // Combine chunks into a single Blob (WebM format)
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        console.log("Created audio blob:", {
          size: audioBlob.size,
          type: audioBlob.type
        });

        setUploading(true);
        setUploadProgress(0);

        const formData = new FormData();
        formData.append('file', audioBlob, `voice-message-${Date.now()}.webm`);

        console.log("FormData prepared, starting upload...");
        const uploadResponse = await apiService.upload('/files/upload', formData, {
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            console.log(`Upload progress: ${percentCompleted}%`);
            setUploadProgress(percentCompleted);
          }
        });

        console.log("Upload complete. Server response:", uploadResponse);

        const voiceMessage = {
          id: Date.now(),
          sender: "user",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          messageType: "FILE",
          isAttachment: true,
          fileUrl: uploadResponse.fileUrl,
          fileName: uploadResponse.fileName,
          fileType: uploadResponse.fileType,
          fileSize: uploadResponse.size,
          replyTo: showReplyTo
        };

        handleSendMessage(voiceMessage);
        setShowReplyTo(null);
      } catch (error) {
        console.error('Error uploading voice message:', error);
      } finally {
        setUploading(false);
        setUploadProgress(0);
        if (mediaRecorder.stream) {
          mediaRecorder.stream.getTracks().forEach(track => track.stop());
        }
        setMediaRecorder(null);
        setAudioChunks([]);
        console.log("Recording cleanup complete");
      }
    };
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      setUploadProgress(0);

      const formData = new FormData();
      formData.append("file", file);

      const uploadResponse = await apiService.upload(
        "/files/upload",
        formData,
        {
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(percentCompleted);
          },
        }
      );

      console.log("File uploaded successfully:", uploadResponse);

      const fileMessage = {
        id: Date.now(),
        sender: "user",
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        messageType: "FILE",
        isAttachment: true,
        fileUrl: uploadResponse.fileUrl,
        fileName: uploadResponse.fileName,
        fileType: uploadResponse.fileType,
        fileSize: uploadResponse.size,
        replyTo: showReplyTo,
      };

      handleSendMessage(fileMessage);
      setShowReplyTo(null);
    } catch (error) {
      console.error("Error uploading file:", error);
      // Show error to user
    } finally {
      setUploading(false);
      setUploadProgress(0);
      event.target.value = "";
    }
  };

  const handleEmojiClick = (emojiData) => {
    setMessage((prev) => prev + emojiData.emoji);
    messageInputRef.current?.focus();
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submitMessage();
    }
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

      <div
        className={`${
          darkMode
            ? "bg-gray-800 border-gray-700"
            : "bg-gray-50 border-gray-200"
        } p-3 border-t`}
      >
        {uploading && (
          <div className="mb-2">
            <div className="flex justify-between text-xs mb-1">
              <span>Uploading...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div
              className={`w-full ${
                darkMode ? "bg-gray-700" : "bg-gray-200"
              } rounded-full h-2`}
            >
              <div
                className={`bg-teal-500 h-2 rounded-full`}
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {isRecording ? (
          <div
            className={`flex items-center ${
              darkMode ? "bg-gray-700" : "bg-white"
            } rounded-full px-4 py-2`}
          >
            <div className="flex-1 flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded-full mr-2 animate-pulse"></div>
              <span className={darkMode ? "text-gray-300" : "text-gray-600"}>
                Recording... {formatTime(recordingTime)}
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  setIsRecording(false);
                  clearInterval(timerInterval);
                  setTimerInterval(null);
                  mediaRecorder?.stop();
                }}
                className={
                  darkMode
                    ? "text-gray-300 hover:text-gray-100"
                    : "text-gray-500 hover:text-gray-700"
                }
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
          <div
            className={`flex items-center ${
              darkMode ? "bg-gray-700" : "bg-white"
            } rounded-full px-4 py-2`}
          >
            <div className="relative">
              <button
                onClick={() => setEmojiPickerOpen(!emojiPickerOpen)}
                className={
                  darkMode
                    ? "text-gray-300 hover:text-gray-100"
                    : "text-gray-500 hover:text-gray-700"
                }
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
                    theme={darkMode ? "dark" : "light"}
                    searchDisabled={false}
                    skinTonesDisabled={false}
                    width={300}
                    height={400}
                  />
                </div>
              )}
            </div>
            <textarea
              rows="1"
              placeholder="Type a message"
              className={`bg-transparent flex-1 outline-none mx-2 py-2 resize-none ${
                darkMode ? "text-gray-100" : "text-gray-800"
              }`}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              ref={messageInputRef}
              style={{ maxHeight: "100px", overflow: "auto" }}
            />
            <div className="flex items-center space-x-3">
              <div className="relative">
                <button
                  onClick={() =>
                    setShowAttachmentOptions(!showAttachmentOptions)
                  }
                  className={
                    darkMode
                      ? "text-gray-300 hover:text-gray-100"
                      : "text-gray-500 hover:text-gray-700"
                  }
                >
                  <Paperclip size={20} />
                </button>

                <input
                  type="file"
                  ref={imageInputRef}
                  className="hidden"
                  onChange={handleFileUpload}
                  accept="image/*"
                />
                <input
                  type="file"
                  ref={videoInputRef}
                  className="hidden"
                  onChange={handleFileUpload}
                  accept="video/*"
                />
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleFileUpload}
                  accept="application/pdf,text/*,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                />
                <input
                  type="file"
                  ref={audioInputRef}
                  className="hidden"
                  onChange={handleFileUpload}
                  accept="audio/*"
                />

                {showAttachmentOptions && (
                  <div
                    ref={attachmentMenuRef}
                    className={`absolute bottom-full right-0 mb-2 ${
                      darkMode
                        ? "bg-gray-800 border-gray-700"
                        : "bg-white border-gray-200"
                    } rounded-lg shadow-lg border p-2`}
                  >
                    <div className="flex flex-col space-y-2">
                      <button
                        className={`flex items-center p-2 ${
                          darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
                        } rounded`}
                        onClick={() => {
                          imageInputRef.current.click();
                          setShowAttachmentOptions(false);
                        }}
                      >
                        <Image size={20} className="mr-2" />
                        <span>Image</span>
                      </button>
                      <button
                        className={`flex items-center p-2 ${
                          darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
                        } rounded`}
                        onClick={() => {
                          videoInputRef.current.click();
                          setShowAttachmentOptions(false);
                        }}
                      >
                        <Video size={20} className="mr-2" />
                        <span>Video</span>
                      </button>
                      <button
                        className={`flex items-center p-2 ${
                          darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
                        } rounded`}
                        onClick={() => {
                          fileInputRef.current.click();
                          setShowAttachmentOptions(false);
                        }}
                      >
                        <File size={20} className="mr-2" />
                        <span>Document</span>
                      </button>
                      <button
                        className={`flex items-center p-2 ${
                          darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
                        } rounded`}
                        onClick={() => {
                          audioInputRef.current.click();
                          setShowAttachmentOptions(false);
                        }}
                      >
                        <Music size={20} className="mr-2" />
                        <span>Music</span>
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
