import React, { useEffect, useState, useRef } from "react";
import {
  Check,
  CheckCheck,
  Reply,
  Image as ImageIcon,
  Video as VideoIcon,
  File as FileIcon,
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
  const uiMessage = useRef(null);

  useEffect(() => {
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

    if (message.messageType === "TEXT") {
      uiMessage.current = {
        id: message.id,
        text: message.content,
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
    } else if (message.messageType === "FILE") {
      uiMessage.current = {
        id: message.id,
        text: `📎 ${message.fileName}`,
        sender: message.sender.id === currentUserId ? "user" : "contact",
        senderName: senderName,
        senderAvatar: senderAvatar,
        senderId: message.sender.id,
        time: new Date(message.timestamp).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        readStatus: message.readStatus,
        isAttachment: true,
        fileUrl: message.fileUrl,
        fileName: message.fileName,
        fileType: message.fileType,
        fileSize: message.fileSize,
      };
    } else if (message.messageType === "SYSTEM") {
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

  useEffect(() => {
    if (isHighlighted) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isHighlighted]);

  useEffect(() => {
    if (isHighlighted && messageRef.current) {
      messageRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [isHighlighted]);

  const formatFileSize = (bytes) => {
    if (!bytes) return "";
    if (bytes < 1024) return bytes + " bytes";
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    else return (bytes / 1048576).toFixed(1) + " MB";
  };

  const handleFileDownload = async (e) => {
    e.stopPropagation();
    try {
      const response = await fetch(uiMessage.current.fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = uiMessage.current.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
      // Fallback to direct link
      window.open(uiMessage.current.fileUrl, "_blank");
    }
  };

  const renderFileMessage = () => {
    if (!uiMessage.current || !uiMessage.current.isAttachment) return null;

    const fileType = uiMessage.current.fileType || "";
    const isImage = fileType.startsWith("image/");
    const isVideo = fileType.startsWith("video/");
    const isAudio = fileType.startsWith("audio/");
    const isPDF = fileType === "application/pdf";
    const isDocument = [
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ].includes(fileType);

    return (
      <div
        className={`rounded-lg overflow-hidden ${
          darkMode ? "bg-gray-700" : "bg-gray-100"
        }`}
      >
        {/* Preview for images */}
        {isImage && (
          <div className="relative">
            <img
              src={uiMessage.current.fileUrl}
              alt={uiMessage.current.fileName}
              className="w-full h-auto max-h-96 object-contain"
              loading="lazy"
            />
          </div>
        )}

        {/* Preview for videos */}
        {isVideo && (
          <div className="relative">
            <video controls className="w-full max-h-96">
              <source
                src={uiMessage.current.fileUrl}
                type={uiMessage.current.fileType}
              />
              Your browser does not support the video tag.
            </video>
          </div>
        )}

        {/* Audio player for audio files */}
        {isAudio && (
          <div className="p-3">
            <audio controls className="w-full">
              <source
                src={uiMessage.current.fileUrl}
                type={uiMessage.current.fileType}
              />
              Your browser does not support the audio element.
            </audio>
          </div>
        )}

        {/* File info section */}
        <div className="p-3">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg ${
                darkMode ? "bg-gray-600" : "bg-gray-200"
              }`}
            >
              {isImage && <ImageIcon size={20} />}
              {isVideo && <VideoIcon size={20} />}
              {isAudio && <FileIcon size={20} className="text-blue-500" />}
              {isPDF && <FileIcon size={20} className="text-red-500" />}
              {isDocument && <FileIcon size={20} className="text-blue-500" />}
              {!isImage && !isVideo && !isAudio && !isPDF && !isDocument && (
                <FileIcon size={20} />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {uiMessage.current.fileName}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {formatFileSize(uiMessage.current.fileSize)}
              </p>
            </div>

            <button
              onClick={handleFileDownload}
              className={`p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600`}
              title={`Download ${uiMessage.current.fileName}`}
            >
              <Download size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const getSenderAvatarColor = () => {
    if (!uiMessage.current.senderId && !uiMessage.current.senderName)
      return "bg-gray-500";

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

  const isGroupChat =
    currentChat &&
    currentChat.participants &&
    currentChat.participants.length > 2;

  const showSenderName =
    isGroupChat &&
    uiMessage.current?.sender === "contact" &&
    uiMessage.current?.senderName;

  if (uiMessage.current?.isSystemMessage) {
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

  if (!uiMessage.current) return null;

  return (
    <div
      className={`flex flex-col ${
        uiMessage.current?.sender === "user" ? "items-end" : "items-start"
      } my-2 group relative`}
      ref={(node) => {
        messageRef.current = node;
        if (isHighlighted && highlightedMessageRef) {
          highlightedMessageRef.current = node;
        }
      }}
    >
      {showSenderName && (
        <div className="flex items-center mb-1 px-2">
          {uiMessage.current?.senderAvatar && (
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
            {uiMessage.current?.senderName}
          </span>
        </div>
      )}

      <div
        className={`flex ${
          uiMessage.current?.sender === "user" ? "justify-end" : "justify-start"
        } max-w-full`}
      >
        {uiMessage.current?.sender === "contact" && (
          <div className="self-center mr-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              className={`p-1 rounded-full ${
                darkMode
                  ? "bg-gray-800 hover:bg-gray-700"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
              onClick={() => handleReplyToMessage(uiMessage.current.id)}
            >
              <Reply
                size={16}
                className={darkMode ? "text-gray-300" : "text-gray-600"}
              />
            </button>
          </div>
        )}

        <div
          className={`relative max-w-xs md:max-w-md rounded-lg p-3 ${
            isHighlighted ? "ring-2 ring-teal-500 ring-offset-2" : ""
          } ${
            uiMessage.current?.sender === "user"
              ? darkMode
                ? "bg-green-800 text-white"
                : "bg-green-100 text-gray-800"
              : darkMode
              ? "bg-gray-700 text-white"
              : "bg-white text-gray-800"
          }`}
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

          {uiMessage.current?.isAttachment ? (
            renderFileMessage()
          ) : (
            <p className="whitespace-pre-wrap">{uiMessage.current?.text}</p>
          )}

          <div className="flex items-center justify-end mt-1">
            <span
              className={`text-xs ${
                darkMode ? "text-gray-400" : "text-gray-500"
              } mr-1`}
            >
              {uiMessage.current?.time}
            </span>
            {uiMessage.current?.sender === "user" &&
              (uiMessage.current.readStatus ? (
                <CheckCheck className="text-teal-500" size={14} />
              ) : (
                <Check
                  className={darkMode ? "text-gray-400" : "text-gray-500"}
                  size={14}
                />
              ))}
          </div>
        </div>

        {uiMessage.current?.sender === "user" && (
          <div className="self-center ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              className={`p-1 rounded-full ${
                darkMode
                  ? "bg-gray-800 hover:bg-gray-700"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
              onClick={() => handleReplyToMessage(uiMessage.current.id)}
            >
              <Reply
                size={16}
                className={darkMode ? "text-gray-300" : "text-gray-600"}
              />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageItem;
