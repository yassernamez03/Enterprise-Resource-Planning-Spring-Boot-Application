// src/pages/ChatApp.js (Updated)
import React, { useState, useEffect } from "react";
import { ArrowLeft, MoreVertical } from "lucide-react";
import ConversationList from "../Components/Chat/ConversationList";
import ChatView from "../Components/Chat/ChatView";
import AccountPage from "../Components/Chat/AccountPage";
import MainMenu from "../Components/Chat/MainMenu";
import SearchBar from "../Components/Chat/SearchBar";
import FilterMenu from "../Components/Chat/FilterMenu";
import { Link } from "react-router-dom";
import { useChat } from "../context/ChatContext";
import authService from "../services/authService";

const ChatApp = () => {
  const {
    conversations,
    loading,
    activeChat,
    setActiveChat,
    typingUsers,
    sendMessage,
    sendTextMessage,
    markMessageAsRead,
    updateTypingStatus,
    archiveChat,
    unarchiveChat,
    leaveChat,
    createNewChat,
    isWebSocketConnected, // Add this
  } = useChat();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterOptions, setFilterOptions] = useState({
    unread: false,
    recent: true,
    all: false,
    archived: false,
    closed: false,
  });
  const [mobileView, setMobileView] = useState(window.innerWidth < 768);
  const [showChatView, setShowChatView] = useState(false);
  const [showAccountPage, setShowAccountPage] = useState(false);
  const [showMainMenu, setShowMainMenu] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [highlightedMessageId, setHighlightedMessageId] = useState(null);

  // Handle window resize for responsive design
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      setMobileView(isMobile);
      if (!isMobile) {
        setShowChatView(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Handle search functionality
  useEffect(() => {
    if (searchQuery) {
      let results = [];

      conversations.forEach((conv) => {
        // Find messages that match the search query
        const matchedMessages = conv.messages.filter((msg) => {
          if (msg.messageType === "TEXT") {
            return msg.content
              ?.toLowerCase()
              .includes(searchQuery.toLowerCase());
          }
          return false;
        });

        if (
          matchedMessages.length > 0 ||
          (conv.title && conv.title.toLowerCase().includes(searchQuery.toLowerCase()))
        ) {
          results.push({
            conversation: conv,
            matchedMessages,
          });
        }
      });

      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, conversations]);

  const handleChatSelect = (id) => {
    const selected = conversations.find((conv) => conv.id === id);
    setActiveChat(selected);
    setHighlightedMessageId(null);

    if (mobileView) {
      setShowChatView(true);
    }

    // Mark unread messages as read
    if (selected && selected.messages) {
      selected.messages.forEach((message) => {
        if (!message.readStatus && message.sender.id !== currentUserId) {
          markMessageAsRead(message.id);
        }
      });
    }
  };

  // Modified handler for creating new chats with multiple participants
  const handleCreateNewChat = async (newConversationInfo) => {
    try {
      console.log("Creating new chat with:", newConversationInfo);

      // Extract title and participants directly from the input
      const { title, participants } = newConversationInfo;

      // Call API to create a new chat
      const newChat = await createNewChat(participants, title);

      // Automatically select the new conversation
      setActiveChat(newChat);

      // On mobile, show the chat view
      if (mobileView) {
        setShowChatView(true);
      }

      return newChat;
    } catch (error) {
      console.error("Error creating new chat:", error);
    }
  };

  const handleApplyFilter = (filterType) => {
    const newFilters = {
      unread: false,
      recent: false,
      all: false,
      archived: false,
    };
    newFilters[filterType] = true;
    setFilterOptions(newFilters);
    setFilterOpen(false);
  };

  const getFilteredConversations = () => {
    if (loading) {
      return [];
    }

    let filtered = [...conversations];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (conv) =>
          (conv.title && conv.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
          conv.messages.some((msg) => {
            if (msg.messageType === "TEXT") {
              return msg.content
                ?.toLowerCase()
                .includes(searchQuery.toLowerCase());
            }
            return false;
          })
      );
    }

    // Apply other filters
    if (filterOptions.unread) {
      filtered = filtered.filter((conv) => conv.unread > 0);
    } else if (filterOptions.archived) {
      filtered = filtered.filter((conv) => conv.status === "ARCHIVED");
    } else if (filterOptions.closed) {
      filtered = filtered.filter((conv) => conv.status === "CLOSED");
    } else if (filterOptions.all) {
      // All filter shows everything including archived conversations
      // No additional filtering needed
    } else {
      // Default case (recent filter) - exclude archived and closed conversations
       filtered = filtered.filter(conv => conv.status !== 'ARCHIVED' && conv.status !== 'CLOSED');
    }

    // Sort by recent message
    if (filterOptions.recent) {
      filtered = filtered.sort((a, b) => {
        const getLastMessageTime = (conv) => {
          if (conv.messages.length === 0) return 0;
          const lastMessage = conv.messages[conv.messages.length - 1];
          return new Date(lastMessage.timestamp).getTime();
        };

        return getLastMessageTime(b) - getLastMessageTime(a);
      });
    }

    return filtered;
  };

  const handleGlobalSearchSelect = (convId, msgId) => {
    setActiveChat(conversations.find((conv) => conv.id === convId));
    setHighlightedMessageId(msgId);
    if (mobileView) {
      setShowChatView(true);
    }
  };

  const toggleArchiveChat = async (id) => {
    try {
      // Get the current chat from the conversations list
      const chat = conversations.find((conv) => conv.id === id);
      if (!chat) return;

      // Check current status to determine action
      const isArchived = chat.status === "ARCHIVED";

      if (isArchived) {
        await unarchiveChat(id);
      } else {
        await archiveChat(id);
      }
    } catch (error) {
      console.error("Error toggling chat archive status:", error);
    }
  };

  const handleSendMessage = (message) => {
  if (!activeChat) return;

  try {
    let messageData;
    console.log("Sending message:", message);
    console.log("  isAttachment:", message.isAttachment);

    if (message.isAttachment) {
      // File message
      messageData = {
        fileUrl: message.fileUrl,
        fileName: message.fileName,
        fileType: message.fileType,
        fileSize: message.fileSize,
        messageType: 'FILE'
      };
    } else if (message.isVoice) {
      // Voice message
      messageData = {
        audioUrl: message.audioUrl,
        duration: message.duration,
        messageType: 'VOICE'
      };
    } else {
      // Text message
      messageData = {
        content: message.text,
        messageType: 'TEXT',
        replyTo: message.replyTo
      };
    }

    // Send via WebSocket
    sendMessage(activeChat.id, messageData);

  } catch (error) {
    console.error("Error sending message:", error);
  }
};

  const handleTypingStatusChange = (isTyping) => {
    if (activeChat) {
      updateTypingStatus(activeChat.id, isTyping);
    }
  };

  const handleLeaveChat = async (id) => {
    try {
      await leaveChat(id);

      // If we're currently viewing this chat, go back to the conversation list on mobile
      if (activeChat && activeChat.id === id && mobileView) {
        setShowChatView(false);
      }
    } catch (error) {
      console.error("Error leaving chat:", error);
    }
  };

  const renderSearchResults = () => {
    if (!searchQuery) return null;

    return (
      <div
        className={`absolute top-full left-0 right-0 ${
          darkMode ? "bg-gray-800" : "bg-white"
        } shadow-lg z-10 border ${
          darkMode ? "border-gray-700" : "border-gray-200"
        } mt-1 max-h-64 overflow-y-auto`}
      >
        {searchResults.length > 0 ? (
          searchResults.map((result) => (
            <div
              key={result.conversation.id}
              className="p-2 border-b border-gray-100"
            >
              <div
                className={`font-medium text-sm mb-1 ${
                  darkMode ? "text-gray-200" : "text-gray-800"
                }`}
              >
                {result.conversation.title}
              </div>
              {result.matchedMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`text-sm ${
                    darkMode
                      ? "text-gray-300 hover:bg-gray-700"
                      : "text-gray-600 hover:bg-gray-100"
                  } p-2 rounded cursor-pointer`}
                  onClick={() =>
                    handleGlobalSearchSelect(result.conversation.id, msg.id)
                  }
                >
                  <div className="flex justify-between mb-1">
                    <span
                      className={`text-xs ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      {msg.sender.id === currentUserId
                        ? "You"
                        : msg.sender.fullName}
                    </span>
                    <span
                      className={`text-xs ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div>
                    {msg.messageType === "TEXT" &&
                      (msg.content.length > 50
                        ? `${msg.content.substring(0, 50)}...`
                        : msg.content)}
                  </div>
                </div>
              ))}
            </div>
          ))
        ) : (
          <div
            className={`p-3 text-center ${
              darkMode ? "text-gray-400" : "text-gray-500"
            }`}
          >
            No results found
          </div>
        )}
      </div>
    );
  };

  // Get current user ID from auth service
  const currentUserId = authService.getCurrentUser()?.id || -1;

  // Show loading if WebSocket is not connected
  if (loading || !isWebSocketConnected) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500 mx-auto mb-4"></div>
          <p>{loading ? "Loading chats..." : "Connecting to chat service..."}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex h-screen ${
        darkMode ? "bg-gray-900 text-white" : "bg-gray-100"
      }`}
    >
      {/* Left sidebar with conversation list - hidden on mobile when chat is open */}
      {(!mobileView || !showChatView) && (
        <div
          className={`${mobileView ? "w-full" : "w-1/3"} ${
            darkMode ? "bg-gray-800" : "bg-white"
          } border-r ${
            darkMode ? "border-gray-700" : "border-gray-200"
          } flex flex-col`}
        >
          {/* Header */}
          <div
            className={`p-4 ${
              darkMode ? "bg-gray-800" : "bg-gray-50"
            } border-b ${
              darkMode ? "border-gray-700" : "border-gray-200"
            } flex justify-between items-center`}
          >
            <div className="flex items-center">
              <Link to="/" className="flex items-center">
                <button
                  className={`p-2 rounded-full ${
                    darkMode ? "hover:bg-gray-700" : "hover:bg-gray-200"
                  }`}
                >
                  <ArrowLeft
                    className={darkMode ? "text-gray-300" : "text-gray-600"}
                    size={20}
                  />
                </button>
              </Link>
            </div>
            <div className="flex items-center space-x-3">
              <div className="relative">
                <button
                  className={`p-2 rounded-full ${
                    darkMode ? "hover:bg-gray-700" : "hover:bg-gray-200"
                  }`}
                  onClick={() => setShowMainMenu(!showMainMenu)}
                >
                  <MoreVertical
                    className={darkMode ? "text-gray-300" : "text-gray-600"}
                    size={20}
                  />
                </button>

                {showMainMenu && (
                  <MainMenu
                    darkMode={darkMode}
                    setDarkMode={setDarkMode}
                    setShowMainMenu={setShowMainMenu}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Search */}
          <SearchBar
            darkMode={darkMode}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            renderSearchResults={renderSearchResults}
          />

          {/* Filter */}
          <FilterMenu
            darkMode={darkMode}
            filterOpen={filterOpen}
            setFilterOpen={setFilterOpen}
            filterOptions={filterOptions}
            handleApplyFilter={handleApplyFilter}
          />

          {/* Conversation list */}
          <ConversationList
            conversations={getFilteredConversations()}
            activeChat={activeChat ? activeChat.id : null}
            handleChatSelect={handleChatSelect}
            darkMode={darkMode}
            onCreateNewChat={handleCreateNewChat}
          />
        </div>
      )}

      {/* Right side - active chat */}
      {(!mobileView || showChatView) && activeChat && !showAccountPage && (
        <ChatView
          currentChat={activeChat}
          darkMode={darkMode}
          mobileView={mobileView}
          setShowChatView={setShowChatView}
          setShowAccountPage={setShowAccountPage}
          toggleArchiveChat={toggleArchiveChat}
          handleLeaveChat={handleLeaveChat}
          highlightedMessageId={highlightedMessageId}
          setHighlightedMessageId={setHighlightedMessageId}
          handleSendMessage={handleSendMessage}
          onTypingStatusChange={handleTypingStatusChange}
          isUserTyping={Object.keys(typingUsers).some(
            (userId) =>
              typingUsers[userId] && typingUsers[userId][activeChat.id]
          )}
          currentUserId={currentUserId}
        />
      )}

      {/* Account Page */}
      {showAccountPage && activeChat && (
        <div
          className={`${mobileView ? "w-full" : "w-2/3"} flex flex-col ${
            darkMode ? "bg-gray-900" : "bg-white"
          }`}
        >
          <AccountPage
            currentChat={activeChat}
            darkMode={darkMode}
            setShowAccountPage={setShowAccountPage}
          />
        </div>
      )}
    </div>
  );
};

export default ChatApp;
