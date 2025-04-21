// File: ChatApp.js (Main component)
import React, { useState, useEffect } from "react";
import { ArrowLeft, MoreVertical } from "lucide-react";
import ConversationList from "../Components/Chat/ConversationList";
import ChatView from "../Components/Chat/ChatView";
import AccountPage from "../Components/Chat/AccountPage";
import MainMenu from "../Components/Chat/MainMenu";
import SearchBar from "../Components/Chat/SearchBar";
import FilterMenu from "../Components/Chat/FilterMenu";
import { Link } from "react-router-dom";

const ChatApp = () => {
  const [activeChat, setActiveChat] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterOptions, setFilterOptions] = useState({
    unread: false,
    recent: true,
    all: false,
    archived: false
  });
  const [mobileView, setMobileView] = useState(window.innerWidth < 768);
  const [showChatView, setShowChatView] = useState(false);
  const [showAccountPage, setShowAccountPage] = useState(false);
  const [showMainMenu, setShowMainMenu] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [highlightedMessageId, setHighlightedMessageId] = useState(null);

  const [conversations, setConversations] = useState([
    {
      id: 1,
      name: "John Smith",
      avatar: "J",
      lastMessage: "Can you share the project timeline?",
      time: "10:42 AM",
      unread: 2,
      archived: false,
      messages: [
        { id: 1, text: "Hi there!", sender: "contact", time: "10:30 AM" },
        { id: 2, text: "Hello! How are you?", sender: "user", time: "10:31 AM" },
        { id: 3, text: "I'm good, thanks! Can you share the project timeline?", sender: "contact", time: "10:42 AM" },
      ]
    },
    {
      id: 2,
      name: "Marketing Team",
      avatar: "M",
      lastMessage: "Meeting at 2pm today",
      time: "9:15 AM",
      unread: 0,
      archived: false,
      messages: [
        { id: 1, text: "Good morning team!", sender: "contact", time: "9:00 AM" },
        { id: 2, text: "Don't forget we have a meeting at 2pm today", sender: "contact", time: "9:15 AM" },
      ]
    },
    {
      id: 3,
      name: "Sarah Wilson",
      avatar: "S",
      lastMessage: "The reports are ready for review",
      time: "Yesterday",
      unread: 0,
      archived: false,
      messages: [
        { id: 1, text: "Hi, I've finished the quarterly reports", sender: "contact", time: "Yesterday" },
        { id: 2, text: "The reports are ready for review", sender: "contact", time: "Yesterday" },
        { id: 3, text: "Great, I'll take a look", sender: "user", time: "Yesterday" },
      ]
    },
    {
      id: 4,
      name: "Tech Support",
      avatar: "T",
      lastMessage: "Your ticket #45678 has been resolved",
      time: "Tuesday",
      unread: 0,
      archived: false,
      messages: [
        { id: 1, text: "Your ticket #45678 has been resolved", sender: "contact", time: "Tuesday" },
        { id: 2, text: "Please let us know if you need further assistance", sender: "contact", time: "Tuesday" },
      ]
    },
    {
      id: 5,
      name: "David Lee",
      avatar: "D",
      lastMessage: "Thanks for your help with the presentation",
      time: "Tuesday",
      unread: 0,
      archived: true,
      messages: [
        { id: 1, text: "Thanks for your help with the presentation", sender: "contact", time: "Tuesday" },
        { id: 2, text: "No problem! Happy to help", sender: "user", time: "Tuesday" },
      ]
    },
    {
      id: 6,
      name: "Project Updates",
      avatar: "P",
      lastMessage: "The client approved our proposal",
      time: "Last week",
      unread: 0,
      archived: true,
      messages: [
        { id: 1, text: "Team, I have some news", sender: "contact", time: "Last week" },
        { id: 2, text: "The client approved our proposal for the new project", sender: "contact", time: "Last week" },
        { id: 3, text: "That's excellent news!", sender: "user", time: "Last week" },
      ]
    }
  ]);

  // Handle window resize for responsive design
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      setMobileView(isMobile);
      if (!isMobile) {
        setShowChatView(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleChatSelect = (id) => {
    setActiveChat(id);
    setHighlightedMessageId(null);
    
    if (mobileView) {
      setShowChatView(true);
    }
  };

  const handleCreateNewChat = (newConversation) => {
    // Add the new conversation to the beginning of the conversations array
    setConversations(prev => [newConversation, ...prev]);
    
    // Automatically select the new conversation
    setActiveChat(newConversation.id);
    
    // On mobile, show the chat view
    if (mobileView) {
      setShowChatView(true);
    }
  };

  const handleApplyFilter = (filterType) => {
    const newFilters = {
      unread: false,
      recent: false,
      all: false,
      archived: false
    };
    newFilters[filterType] = true;
    setFilterOptions(newFilters);
    setFilterOpen(false);
  };

  const getFilteredConversations = () => {
    let filtered = [...conversations];
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(conv => 
        conv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.messages.some(msg => msg.text.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    // Apply other filters
    if (filterOptions.unread) {
      filtered = filtered.filter(conv => conv.unread > 0);
    } else if (filterOptions.recent) {
      filtered = filtered.sort((a, b) => {
        const timeA = a.time === "Just now" ? new Date() : new Date(a.time);
        const timeB = b.time === "Just now" ? new Date() : new Date(b.time);
        return timeB - timeA;
      });
    } else if (filterOptions.archived) {
      filtered = filtered.filter(conv => conv.archived);
    } else {
      // All filter doesn't need additional filtering, but exclude archived by default
      if (!filterOptions.archived) {
        filtered = filtered.filter(conv => !conv.archived);
      }
    }
    
    return filtered;
  };

  const handleGlobalSearchSelect = (convId, msgId) => {
    setActiveChat(convId);
    setHighlightedMessageId(msgId);
    if (mobileView) {
      setShowChatView(true);
    }
  };

  const toggleArchiveChat = (id) => {
    setConversations(prev => 
      prev.map(conv => 
        conv.id === id 
          ? { ...conv, archived: !conv.archived } 
          : conv
      )
    );
  };

  const getCurrentChat = () => {
    return conversations.find(conv => conv.id === activeChat);
  };

  const handleSendMessage = (newMessage) => {
    setConversations(prev => 
      prev.map(conv => 
        conv.id === activeChat 
          ? { 
              ...conv, 
              messages: [...conv.messages, newMessage],
              lastMessage: newMessage.text,
              time: "Just now"
            } 
          : conv
      )
    );
    
    // Simulate response after short delay
    setTimeout(() => {
      const responseMessage = {
        id: Date.now() + 1,
        text: "I've received your message. I'll get back to you soon.",
        sender: "contact",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      setConversations(prev => 
        prev.map(conv => 
          conv.id === activeChat 
            ? { 
                ...conv, 
                messages: [...conv.messages, responseMessage],
                lastMessage: responseMessage.text,
                time: "Just now"
              } 
            : conv
        )
      );
    }, 1000);
  };

  const renderSearchResults = () => {
    if (!searchQuery) return null;
    
    const results = [];
    conversations.forEach(conv => {
      // Find messages that match the search query
      const matchedMessages = conv.messages.filter(msg => 
        msg.text.toLowerCase().includes(searchQuery.toLowerCase())
      );
      
      if (matchedMessages.length > 0 || conv.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        results.push(
          <div key={conv.id} className="p-2 border-b border-gray-100">
            <div className={`font-medium text-sm mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{conv.name}</div>
            {matchedMessages.map(msg => (
              <div 
                key={msg.id}
                className={`text-sm ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'} p-2 rounded cursor-pointer`}
                onClick={() => handleGlobalSearchSelect(conv.id, msg.id)}
              >
                <div className="flex justify-between mb-1">
                  <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{msg.sender === "user" ? "You" : conv.name}</span>
                  <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{msg.time}</span>
                </div>
                <div>
                  {msg.text.length > 50 ? `${msg.text.substring(0, 50)}...` : msg.text}
                </div>
              </div>
            ))}
          </div>
        );
      }
    });
    
    return (
      <div className={`absolute top-full left-0 right-0 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg z-10 border ${darkMode ? 'border-gray-700' : 'border-gray-200'} mt-1 max-h-64 overflow-y-auto`}>
        {results.length > 0 ? (
          results
        ) : (
          <div className={`p-3 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No results found</div>
        )}
      </div>
    );
  };

  return (
    <div className={`flex h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100'}`}>
      {/* Left sidebar with conversation list - hidden on mobile when chat is open */}
      {(!mobileView || !showChatView) && (
        <div className={`${mobileView ? 'w-full' : 'w-1/3'} ${darkMode ? 'bg-gray-800' : 'bg-white'} border-r ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex flex-col`}>
          {/* Header */}
          <div className={`p-4 ${darkMode ? 'bg-gray-800' : 'bg-gray-50'} border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex justify-between items-center`}>
            <div className="flex items-center">
              <Link to="/" className="flex items-center">
                <button className={`p-2 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}>
                  <ArrowLeft className={darkMode ? 'text-gray-300' : 'text-gray-600'} size={20} />
                </button>
              </Link>
            </div>
            <div className="flex items-center space-x-3">
              <div className="relative">
                <button 
                  className={`p-2 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
                  onClick={() => setShowMainMenu(!showMainMenu)}
                >
                  <MoreVertical className={darkMode ? 'text-gray-300' : 'text-gray-600'} size={20} />
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
            activeChat={activeChat} 
            handleChatSelect={handleChatSelect} 
            darkMode={darkMode}
            onCreateNewChat={handleCreateNewChat}
          />
        </div>
      )}

      {/* Right side - active chat */}
      {(!mobileView || showChatView) && !showAccountPage && (
        <ChatView 
          currentChat={getCurrentChat()} 
          darkMode={darkMode} 
          mobileView={mobileView}
          setShowChatView={setShowChatView}
          setShowAccountPage={setShowAccountPage}
          toggleArchiveChat={toggleArchiveChat}
          highlightedMessageId={highlightedMessageId}
          setHighlightedMessageId={setHighlightedMessageId}
          handleSendMessage={handleSendMessage}
        />
      )}

      {/* Account Page */}
      {showAccountPage && (
        <div className={`${mobileView ? 'w-full' : 'w-2/3'} flex flex-col ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
          <AccountPage 
            currentChat={getCurrentChat()} 
            darkMode={darkMode} 
            setShowAccountPage={setShowAccountPage} 
          />
        </div>
      )}
    </div>
  );
};

export default ChatApp;