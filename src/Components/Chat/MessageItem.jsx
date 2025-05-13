// components/MessageItem.js
import React, { useEffect, useState, useRef } from "react";
import {
  Check,
  CheckCheck,
  Reply,
  Mic,
  Image,
  Camera,
  File,
  Download,
} from "lucide-react";

const MessageItem = ({
  message,
  currentChat,
  isHighlighted,
  darkMode,
  highlightedMessageRef,
  originalMessage,
  handleReplyToMessage,
  currentUserId,
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const messageRef = useRef(null);

  // Animation effect when highlighted changes
  useEffect(() => {
    if (isHighlighted) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isHighlighted]);

  // Handle mapping backend message to UI message
  const uiMessage = useRef(null);

  useEffect(() => {
    // If message is already in UI format (has sender as "user" or "contact")
    if (message.sender === "user" || message.sender === "contact") {
      uiMessage.current = {
        ...message,
        // Add sender name and avatar even for UI format messages
        senderName:
          message.sender === "user" ? "You" : message.senderName || "Unknown",
        senderAvatar:
          message.sender === "user"
            ? null
            : message.senderName
            ? message.senderName.charAt(0).toUpperCase()
            : "?",
      };
      return;
    }

    // Extract sender information
    const senderName =
      message.sender.id === currentUserId
        ? "You"
        : message.sender.fullName || message.sender.username || "Unknown";

    const senderAvatar =
      message.sender.id === currentUserId
        ? null
        : message.sender.fullName
        ? message.sender.fullName.charAt(0).toUpperCase()
        : message.sender.username
        ? message.sender.username.charAt(0).toUpperCase()
        : "?";

    // Convert backend format to UI format
    if (message.messageType === "TEXT" || message.messageType === "FILE") {
      uiMessage.current = {
        id: message.id,
        text:
          message.messageType === "TEXT"
            ? message.content
            : message.messageType === "FILE"
            ? `📎 ${message.fileName}`
            : "Unknown message type",
        sender: message.sender.id === currentUserId ? "user" : "contact",
        senderName: senderName,
        senderAvatar: senderAvatar,
        senderId: message.sender.id,
        time: new Date(message.timestamp).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        readStatus: message.readStatus,
        isAttachment: message.messageType === "FILE",
        fileUrl: message.messageType === "FILE" ? message.fileUrl : null,
        fileName: message.messageType === "FILE" ? message.fileName : null,
        fileType: message.messageType === "FILE" ? message.fileType : null,
        fileSize: message.messageType === "FILE" ? message.fileSize : null,
      };
    } else if (message.messageType === "SYSTEM") {
      // Add this new condition for system messages
      uiMessage.current = {
        id: message.id,
        text: message.content,
        isSystemMessage: true,
        sender: "system",
        time: new Date(message.timestamp).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
    } else {
      // Fallback for unknown message types
      uiMessage.current = {
        id: message.id,
        text: "Unsupported message type",
        sender: message.sender.id === currentUserId ? "user" : "contact",
        senderName: senderName,
        senderAvatar: senderAvatar,
        senderId: message.sender.id,
        time: new Date(message.timestamp).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        readStatus: message.readStatus,
      };
    }
  }, [message, currentUserId]);

  // Define the animation styles
  const highlightAnimation = isAnimating
    ? {
        animation: "highlightPulse 2s ease-in-out",
        background:
          uiMessage.current?.sender === "user"
            ? darkMode
              ? "rgba(22, 163, 74, 0.8)"
              : "rgba(220, 252, 231, 0.9)"
            : darkMode
            ? "rgba(55, 65, 81, 0.8)"
            : "rgba(255, 255, 255, 0.9)",
      }
    : {};

  // Add the animation keyframes to the document
  useEffect(() => {
    const styleElement = document.createElement("style");
    styleElement.textContent = `
      @keyframes highlightPulse {
        0%, 100% { 
          background: ${
            uiMessage.current?.sender === "user"
              ? darkMode
                ? "rgba(22, 163, 74, 1)"
                : "rgba(220, 252, 231, 1)"
              : darkMode
              ? "rgba(55, 65, 81, 1)"
              : "rgba(255, 255, 255, 1)"
          };
          box-shadow: 0 0 0 0 rgba(20, 184, 166, 0); 
        }
        50% { 
          background: ${
            uiMessage.current?.sender === "user"
              ? darkMode
                ? "rgba(6, 95, 70, 1)"
                : "rgba(167, 243, 208, 1)"
              : darkMode
              ? "rgba(31, 41, 55, 1)"
              : "rgba(229, 231, 235, 1)"
          };
          box-shadow: 0 0 0 4px rgba(20, 184, 166, 0.3); 
        }
      }
      
      @keyframes ellipsis {
        0%, 100% { content: "."; }
        33% { content: ".."; }
        66% { content: "..."; }
      }
      
      .animate-ellipsis:after {
        content: "...";
        animation: ellipsis 1.5s infinite;
      }
    `;
    document.head.appendChild(styleElement);
    return () => {
      document.head.removeChild(styleElement);
    };
  }, [darkMode]);

  // Scroll into view if this is the highlighted message
  useEffect(() => {
    if (isHighlighted && messageRef.current) {
      messageRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [isHighlighted]);

  // Handle file attachments
  const renderAttachment = () => {
    if (!uiMessage.current) return null;

    if (uiMessage.current.isAttachment || uiMessage.current.fileUrl) {
      let Icon = File;

      // Choose the right icon based on file type
      if (uiMessage.current.fileType) {
        if (uiMessage.current.fileType.startsWith("image/")) {
          Icon = Image;
        } else if (uiMessage.current.fileType.startsWith("video/")) {
          Icon = Camera;
        }
      } else if (uiMessage.current.attachmentType) {
        // For locally simulated attachments
        if (uiMessage.current.attachmentType === "image") {
          Icon = Image;
        } else if (uiMessage.current.attachmentType === "camera") {
          Icon = Camera;
        }
      }

      return (
        <div className="flex items-center space-x-2 cursor-pointer hover:opacity-80">
          <div
            className={`${
              darkMode ? "bg-gray-600" : "bg-gray-200"
            } rounded-full p-2`}
          >
            <Icon size={16} />
          </div>
          <div className="flex-1">
            <div className="text-sm">{uiMessage.current.text}</div>
            {uiMessage.current.fileSize && (
              <div className="text-xs opacity-70">
                {formatFileSize(uiMessage.current.fileSize)}
              </div>
            )}
          </div>
          {uiMessage.current.fileUrl && (
            <a
              href={uiMessage.current.fileUrl}
              download
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className={`p-2 rounded-full ${
                darkMode ? "hover:bg-gray-600" : "hover:bg-gray-200"
              }`}
            >
              <Download size={16} />
            </a>
          )}
        </div>
      );
    }
    return null;
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return "";
    if (bytes < 1024) return bytes + " bytes";
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    else return (bytes / 1048576).toFixed(1) + " MB";
  };

  // Render voice message
  const renderVoiceMessage = () => {
    if (!uiMessage.current) return null;

    if (uiMessage.current.isVoice) {
      return (
        <div className="flex items-center space-x-2">
          <div
            className={`${
              darkMode ? "bg-gray-600" : "bg-gray-200"
            } rounded-full p-2`}
          >
            <Mic size={16} />
          </div>
          <div className="flex-1">
            <div
              className={`h-2 ${
                darkMode ? "bg-gray-600" : "bg-gray-300"
              } rounded-full`}
            >
              <div
                className={`h-2 ${
                  darkMode ? "bg-gray-400" : "bg-gray-500"
                } rounded-full w-1/2`}
              ></div>
            </div>
          </div>
          <span className="text-xs">{uiMessage.current.duration}</span>
        </div>
      );
    }
    return null;
  };

  if (!uiMessage.current) return null;

  // Generate sender avatar color based on sender ID or name
  const getSenderAvatarColor = () => {
    if (!uiMessage.current.senderId && !uiMessage.current.senderName)
      return "bg-gray-500";

    // Simple hash function to determine a consistent color
    const hashSource = uiMessage.current.senderId
      ? uiMessage.current.senderId.toString()
      : uiMessage.current.senderName;

    const nameHash = hashSource
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);

    const colors = [
      "bg-blue-500",
      "bg-green-500",
      "bg-yellow-500",
      "bg-red-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-teal-500",
    ];

    return colors[nameHash % colors.length];
  };

  // Check if this is a group chat - always show sender for non-user messages in chats with more than 2 participants
  const isGroupChat =
    currentChat &&
    currentChat.participants &&
    currentChat.participants.length > 2;

  // Always show the sender name for contact messages in group chats
  const showSenderName =
    isGroupChat &&
    uiMessage.current.sender === "contact" &&
    uiMessage.current.senderName;

  if (uiMessage.current && uiMessage.current.isSystemMessage) {
    return (
      <div className="text-center my-2">
        <span
          className={`px-3 py-1 ${
            darkMode ? "bg-gray-800 text-gray-400" : "bg-gray-100 text-gray-500"
          } bg-opacity-20 rounded-full text-sm inline-block`}
        >
          {uiMessage.current.text}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col ${
        uiMessage.current.sender === "user" ? "items-end" : "items-start"
      } my-2 group`}
      ref={(node) => {
        messageRef.current = node;
        if (isHighlighted && highlightedMessageRef) {
          highlightedMessageRef.current = node;
        }
      }}
    >
      {/* Always show sender name for non-user messages in group chats */}
      {showSenderName && (
        <div className="flex items-center mb-1 px-2">
          {uiMessage.current.senderAvatar && (
            <div
              className={`flex-shrink-0 w-6 h-6 rounded-full ${getSenderAvatarColor()} flex items-center justify-center text-white text-xs font-medium mr-2`}
            >
              {uiMessage.current.senderAvatar}
            </div>
          )}
          <span
            className={`text-xs font-medium ${
              darkMode ? "text-gray-300" : "text-gray-600"
            }`}
          >
            {uiMessage.current.senderName}
          </span>
        </div>
      )}

      <div
        className={`flex ${
          uiMessage.current.sender === "user" ? "justify-end" : "justify-start"
        } max-w-full`}
      >
        <div
          className={`relative max-w-xs md:max-w-md rounded-lg p-3 ${
            isHighlighted ? "ring-2 ring-teal-500 ring-offset-2" : ""
          } ${
            uiMessage.current.sender === "user"
              ? `${
                  darkMode
                    ? "bg-green-800 text-white"
                    : "bg-green-100 text-gray-800"
                }`
              : `${
                  darkMode ? "bg-gray-700 text-white" : "bg-white text-gray-800"
                }`
          }`}
          style={highlightAnimation}
        >
          {originalMessage && (
            <div
              className={`mb-2 p-2 text-sm rounded-md ${
                darkMode
                  ? "bg-gray-800 text-gray-300"
                  : "bg-gray-100 text-gray-600"
              } border-l-2 border-teal-500`}
            >
              <div className="font-medium text-xs">
                {originalMessage.sender === "user"
                  ? "You"
                  : originalMessage.sender.fullName || currentChat.title}
              </div>
              <div className="truncate">
                {typeof originalMessage.text === "string"
                  ? originalMessage.text.length > 50
                    ? `${originalMessage.text.substring(0, 50)}...`
                    : originalMessage.text
                  : typeof originalMessage.content === "string"
                  ? originalMessage.content.length > 50
                    ? `${originalMessage.content.substring(0, 50)}...`
                    : originalMessage.content
                  : "Attachment"}
              </div>
            </div>
          )}

          {uiMessage.current.isVoice ? (
            renderVoiceMessage()
          ) : uiMessage.current.isAttachment || uiMessage.current.fileUrl ? (
            renderAttachment()
          ) : (
            <p>{uiMessage.current.text}</p>
          )}

          <div className="flex items-center justify-end mt-1">
            <span
              className={`text-xs ${
                darkMode ? "text-gray-400" : "text-gray-500"
              } mr-1`}
            >
              {uiMessage.current.time}
            </span>
            {uiMessage.current.sender === "user" &&
              (uiMessage.current.readStatus ? (
                <CheckCheck className="text-teal-500" size={14} />
              ) : (
                <Check
                  className={darkMode ? "text-gray-400" : "text-gray-500"}
                  size={14}
                />
              ))}
          </div>

          {/* Message actions on hover */}
          <div
            className={`absolute -left-10 top-0 h-full flex items-center ${
              uiMessage.current.sender === "user" ? "hidden" : ""
            }`}
          >
            <div
              className={`p-1 rounded-full ${
                darkMode
                  ? "bg-gray-800 hover:bg-gray-700"
                  : "bg-gray-100 hover:bg-gray-200"
              } opacity-0 group-hover:opacity-100 cursor-pointer`}
            >
              <Reply
                size={16}
                className={darkMode ? "text-gray-300" : "text-gray-600"}
                onClick={() => handleReplyToMessage(uiMessage.current.id)}
              />
            </div>
          </div>

          <div
            className={`absolute -right-10 top-0 h-full flex items-center ${
              uiMessage.current.sender === "contact" ? "hidden" : ""
            }`}
          >
            <div
              className={`p-1 rounded-full ${
                darkMode
                  ? "bg-gray-800 hover:bg-gray-700"
                  : "bg-gray-100 hover:bg-gray-200"
              } opacity-0 group-hover:opacity-100 cursor-pointer`}
            >
              <Reply
                size={16}
                className={darkMode ? "text-gray-300" : "text-gray-600"}
                onClick={() => handleReplyToMessage(uiMessage.current.id)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageItem;
