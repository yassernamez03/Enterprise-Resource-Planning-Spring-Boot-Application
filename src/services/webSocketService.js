// src/services/websocketService.js
import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';
import authService from './authService';

class WebSocketService {
  constructor() {
    this.stompClient = null;
    this.connected = false;
    this.subscriptions = new Map();
    this.reconnectTimeout = null;
    this.messageCallbacks = new Map();
    this.typingCallbacks = new Map();
    this.readStatusCallbacks = new Map();
    this.connectionPromise = null; // Add this to track connection promise
  }

  // Connect to WebSocket
  connect(onConnectCallback = null) {
    // If already connected, call callback immediately
    if (this.connected && onConnectCallback) {
      onConnectCallback();
      return Promise.resolve(true);
    }

    // If connection is in progress, return existing promise
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    // Clear any existing reconnect timeout
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    // Get authentication token
    const token = authService.getToken();
    if (!token) {
      console.error('No authentication token available');
      return Promise.reject(new Error('No authentication token'));
    }

    // Create connection promise
    this.connectionPromise = new Promise((resolve, reject) => {
      try {
        // Create SockJS connection to the WebSocket endpoint
        const socket = new SockJS('https://localhost:8443/ws');
        this.stompClient = Stomp.over(socket);

        // Disable debug logs in production
        this.stompClient.debug = process.env.NODE_ENV === 'development' 
          ? console.log 
          : () => {};

        // Configure connection headers with JWT token
        const headers = {
          'Authorization': `Bearer ${token}`
        };

        // Connect to the WebSocket server
        this.stompClient.connect(
          headers,
          () => {
            this.onConnect(onConnectCallback);
            this.connectionPromise = null;
            resolve(true);
          },
          (error) => {
            this.onError(error);
            this.connectionPromise = null;
            reject(error);
          }
        );
      } catch (error) {
        console.error('WebSocket connection error:', error);
        this.connectionPromise = null;
        this.scheduleReconnect();
        reject(error);
      }
    });

    return this.connectionPromise;
  }

  // Handler for successful connection
  onConnect(callback) {
    console.log('WebSocket connection established');
    this.connected = true;
    
    // Resubscribe to all previous subscriptions
    this.resubscribeAll();
    
    // Call the provided callback if available
    if (callback && typeof callback === 'function') {
      callback();
    }
  }

  // Handler for connection error
  onError = (error) => {
    console.error('WebSocket connection error:', error);
    this.connected = false;
    this.scheduleReconnect();
  }

  // Schedule a reconnection attempt
  scheduleReconnect() {
    if (!this.reconnectTimeout) {
      console.log('Scheduling WebSocket reconnection...');
      this.reconnectTimeout = setTimeout(() => {
        console.log('Attempting to reconnect WebSocket...');
        this.connect();
      }, 5000); // Try to reconnect after 5 seconds
    }
  }

  // Disconnect from WebSocket
  disconnect() {
    if (this.stompClient && this.connected) {
      // Unsubscribe from all topics
      this.unsubscribeAll();
      
      // Disconnect the client
      this.stompClient.disconnect();
      this.connected = false;
      console.log('WebSocket disconnected');
    }
    
    // Clear reconnect timeout if it exists
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  // Subscribe to chat messages for a specific chat
  subscribeToChatMessages(chatId, callback) {
    const destination = `/topic/chat/${chatId}`;
    return this.subscribe(destination, (message) => {
      const parsedMessage = JSON.parse(message.body);
      callback(parsedMessage);
    });
  }

  subscribeToReadStatus(chatId, callback) {
    const destination = `/topic/chat/${chatId}/read`;
    console.log(`Subscribing to read receipts for chat ${chatId}`);
    return this.subscribe(destination, (message) => {
      console.log(`Read receipt received for chat ${chatId}:`, message.body);
      try {
        const parsedMessage = JSON.parse(message.body);
        callback(parsedMessage);
      } catch (error) {
        console.error(`Error parsing read receipt:`, error);
      }
    });
  }
  
  // Subscribe to typing status updates for a specific chat
  subscribeToTypingStatus(chatId, callback) {
    const destination = `/topic/chat/${chatId}/typing`;
    console.log(`Subscribing to typing status for chat ${chatId}`);
    return this.subscribe(destination, (message) => {
      console.log(`Typing status received for chat ${chatId}:`, message.body);
      try {
        const parsedMessage = JSON.parse(message.body);
        callback(parsedMessage);
      } catch (error) {
        console.error(`Error parsing typing status:`, error);
      }
    });
  }
  
  // Mark message as read
  markMessageAsRead(messageId) {
    if (!this.stompClient || !this.connected) {
      console.warn('Cannot mark message as read, WebSocket not connected');
      return false;
    }
  
    try {
      console.log(`Marking message ${messageId} as read`);
      this.stompClient.send(
        `/app/chat/markAsRead`, 
        {}, 
        JSON.stringify({ messageId: messageId })
      );
      return true;
    } catch (error) {
      console.error('Error marking message as read:', error);
      return false;
    }
  }
  
  // Send typing status update
  sendTypingStatus(chatId, isTyping) {
    if (!this.stompClient || !this.connected) {
      console.warn('Cannot send typing status, WebSocket not connected');
      return false;
    }
  
    try {
      console.log(`Sending typing status for chat ${chatId}: ${isTyping}`);
      this.stompClient.send(
        `/app/chat/${chatId}/typing`, 
        {}, 
        JSON.stringify({ typing: isTyping })
      );
      return true;
    } catch (error) {
      console.error('Error sending typing status:', error);
      return false;
    }
  }

  // Subscribe to a destination
  subscribe(destination, callback) {
    if (!this.stompClient || !this.connected) {
      console.warn('Cannot subscribe, WebSocket not connected');
      // Store callback for later subscription when connection is established
      this.messageCallbacks.set(destination, callback);
      this.connect();
      return null;
    }

    try {
      const subscription = this.stompClient.subscribe(destination, callback);
      this.subscriptions.set(destination, subscription);
      this.messageCallbacks.set(destination, callback);
      return subscription;
    } catch (error) {
      console.error(`Error subscribing to ${destination}:`, error);
      return null;
    }
  }

  // Resubscribe to all previous subscriptions (used after reconnection)
  resubscribeAll() {
    this.messageCallbacks.forEach((callback, destination) => {
      try {
        if (!this.subscriptions.has(destination) || !this.subscriptions.get(destination).active) {
          const subscription = this.stompClient.subscribe(destination, callback);
          this.subscriptions.set(destination, subscription);
        }
      } catch (error) {
        console.error(`Error resubscribing to ${destination}:`, error);
      }
    });
  }

  // Unsubscribe from a specific destination
  unsubscribe(destination) {
    const subscription = this.subscriptions.get(destination);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(destination);
    }
  }

  // Unsubscribe from all destinations
  unsubscribeAll() {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
    this.subscriptions.clear();
  }

  // Add this method to WebSocketService class
sendMessage(chatId, messageData) {
  if (!this.stompClient || !this.connected) {
    console.warn('Cannot send message, WebSocket not connected');
    return false;
  }

  console.log(`Sending message to chat ${chatId}:`, messageData);

  try {
    this.stompClient.send(
      `/app/chat/${chatId}/sendMessage`, 
      {}, 
      JSON.stringify(messageData)
    );
    return true;
  } catch (error) {
    console.error('Error sending message:', error);
    return false;
  }
}

// Deprecate the old sendTextMessage method or modify it to use the new one
sendTextMessage(chatId, text) {
  return this.sendMessage(chatId, {
    content: text,
    messageType: 'TEXT'
  });
}

  // Send typing status update
  sendTypingStatus(chatId, isTyping) {
    if (!this.stompClient || !this.connected) {
      return false;
    }

    try {
      this.stompClient.send(
        `/app/chat/${chatId}/typing`, 
        {}, 
        JSON.stringify({ typing: isTyping })
      );
      return true;
    } catch (error) {
      console.error('Error sending typing status:', error);
      return false;
    }
  }

  // Mark message as read
  markMessageAsRead(messageId) {
    if (!this.stompClient || !this.connected) {
      return false;
    }

    try {
      this.stompClient.send(
        `/app/chat/markAsRead`, 
        {}, 
        JSON.stringify({ messageId: messageId })
      );
      return true;
    } catch (error) {
      console.error('Error marking message as read:', error);
      return false;
    }
  }

  // Check if the WebSocket is connected
  isConnected() {
    return this.connected;
  }
}

// Create a singleton instance
const websocketService = new WebSocketService();

export default websocketService;