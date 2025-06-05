// Chat functionality using Socket.io
const Chat = {
  // Socket.io connection
  socket: null,
  
  // Current active chat
  currentChatId: 'general',
  
  // Chats data
  chats: [],
  
  // Messages data
  messages: {},
  
  // Users data
  users: [],
  
  // Message being replied to
  replyToMessage: null,
  
  // Typing timeout
  typingTimeout: null,
  
  // Safe UI access function
  safeUI: function(callback) {
    if (typeof UI !== 'undefined') {
      try {
        callback(UI);
      } catch (error) {
        console.error('Error in UI callback:', error);
      }
    } else {
      console.warn('UI not available, queueing callback');
      if (!window.uiCallbackQueue) {
        window.uiCallbackQueue = [];
      }
      window.uiCallbackQueue.push(callback);
    }
  },
  
  // Initialize chat functionality
  init() {
    if (!Auth.isLoggedIn()) return;
    
    console.log('Initializing Chat module...');
    
    // Connect to socket.io
    this.socket = io();
    
    // Set up socket event listeners
    this.setupSocketListeners();
    
    // Join the default chat
    this.joinChat('general');
    
    // Send user login event
    this.socket.emit('user:login', Auth.getUserId());
    
    // Set up UI event listeners
    this.setupUIListeners();
    
    console.log('Chat initialized');
    return true;
  },
  
  // Set up socket.io event listeners
  setupSocketListeners() {
    // New message received
    this.socket.on('message:new', (message) => {
      this.addMessage(message);
      const self = this;
      
      this.safeUI(function(ui) {
        ui.renderMessage(message);
        ui.scrollToBottomIfNeeded();
      });
      
      // Mark message as read
      this.markMessageAsRead(message.id);
    });
    
    // Chat history received
    this.socket.on('chat:history', ({ chatId, messages }) => {
      this.messages[chatId] = messages;
      const self = this;
      
      this.safeUI(function(ui) {
        ui.renderChatHistory(messages);
      });
    });
    
    // Online users list received
    this.socket.on('users:online', (users) => {
      this.users = users;
      const self = this;
      
      this.safeUI(function(ui) {
        ui.renderUserList(users);
      });
    });
    
    // User status update received
    this.socket.on('user:statusUpdate', ({ userId, status }) => {
      const userIndex = this.users.findIndex(user => user.id === userId);
      if (userIndex !== -1) {
        this.users[userIndex].status = status;
        const self = this;
        
        this.safeUI(function(ui) {
          ui.updateUserStatus(userId, status);
        });
      }
    });
    
    // User typing indication received
    this.socket.on('user:typingStart', ({ userId, chatId }) => {
      if (chatId === this.currentChatId && userId !== Auth.getUserId()) {
        const user = this.users.find(u => u.id === userId);
        if (user) {
          const self = this;
          
          this.safeUI(function(ui) {
            ui.showTypingIndicator(user.username);
          });
        }
      }
    });
    
    // User stopped typing indication
    this.socket.on('user:typingStop', ({ userId, chatId }) => {
      if (chatId === this.currentChatId && userId !== Auth.getUserId()) {
        const self = this;
        
        this.safeUI(function(ui) {
          ui.hideTypingIndicator();
        });
      }
    });
    
    // User statistics received
    this.socket.on('users:stats', (stats) => {
      console.log('Received user stats:', stats);
      
      // Store the stats in localStorage for offline access
      if (stats && stats.users) {
        localStorage.setItem('userStats', JSON.stringify(stats));
        
        // Also update our local users array if the data includes users
        if (Array.isArray(stats.users)) {
          this.users = stats.users;
        }
      }
      
      // Update UI if available
      this.safeUI(function(ui) {
        ui.updateUserStats(stats);
      });
    });
    
    // Message reaction update received
    this.socket.on('message:reactionUpdate', ({ messageId, reactions }) => {
      const chatId = this.findChatIdByMessageId(messageId);
      if (chatId) {
        const msgIndex = this.messages[chatId].findIndex(m => m.id === messageId);
        if (msgIndex !== -1) {
          this.messages[chatId][msgIndex].reactions = reactions;
          const self = this;
          
          this.safeUI(function(ui) {
            ui.updateMessageReactions(messageId, reactions);
          });
        }
      }
    });
    
    // Message read update received
    this.socket.on('message:readUpdate', ({ messageId, readBy }) => {
      const chatId = this.findChatIdByMessageId(messageId);
      if (chatId) {
        const msgIndex = this.messages[chatId].findIndex(m => m.id === messageId);
        if (msgIndex !== -1) {
          this.messages[chatId][msgIndex].readBy = readBy;
          UI.updateReadReceipt(messageId, readBy);
        }
      }
    });
    
    // Message deleted event
    this.socket.on('message:deleted', ({ messageId, updatedContent }) => {
      const chatId = this.findChatIdByMessageId(messageId);
      if (chatId) {
        const msgIndex = this.messages[chatId].findIndex(m => m.id === messageId);
        if (msgIndex !== -1) {
          this.messages[chatId][msgIndex].content = updatedContent;
          this.messages[chatId][msgIndex].deleted = true;
          UI.updateDeletedMessage(messageId, updatedContent);
        }
      }
    });
    
    // Chat list received
    this.socket.on('chats:list', (chats) => {
      this.chats = chats;
      UI.renderChatList(chats, this.currentChatId);
    });
    
    // New chat created
    this.socket.on('chat:new', (chat) => {
      this.chats.push(chat);
      UI.addChatToList(chat);
    });
    
    // User preferences updated
    this.socket.on('user:preferencesUpdated', (preferences) => {
      Auth.updatePreferences(preferences);
      UI.applyTheme(preferences.theme);
    });
    
    // Admin: User created
    this.socket.on('admin:userCreated', (result) => {
      if (result.success) {
        UI.showNotification('User created successfully');
      } else {
        UI.showNotification('Failed to create user: ' + result.message, 'error');
      }
    });
    
    // Admin: Connections list
    this.socket.on('admin:connections', (connections) => {
      UI.showConnectionsList(connections);
    });
    
    // Search results
    this.socket.on('messages:searchResults', (results) => {
      UI.showSearchResults(results);
    });
    
    // Socket disconnection
    this.socket.on('disconnect', () => {
      UI.showNotification('Disconnected from server', 'error');
    });
    
    // Socket reconnection
    this.socket.on('reconnect', () => {
      UI.showNotification('Reconnected to server');
      
      // Re-authenticate and join current chat
      this.socket.emit('user:login', Auth.getUserId());
      this.joinChat(this.currentChatId);
    });
    
    // Add handler for server errors
    this.socket.on('server:error', (error) => {
      console.error('Server error:', error);
      
      if (error.message === 'Chat not found') {
        // Try to recover by rejoining the general chat
        console.log('Attempting to recover by joining general chat');
        this.currentChatId = 'general';
        this.socket.emit('chat:join', { chatId: 'general' });
        UI.showNotification('Error: Chat not found. Switched to general chat.', 'error');
        UI.setActiveChat('general');
      } else {
        UI.showNotification('Server error: ' + error.message, 'error');
      }
    });
    
    // Handle user info response
    this.socket.on('user:info', (user) => {
      try {
        if (!user || !user.id) return;
        
        // Check if user already exists in users array
        const existingUserIndex = this.users.findIndex(u => u.id === user.id);
        
        if (existingUserIndex !== -1) {
          // Update existing user
          this.users[existingUserIndex] = { ...this.users[existingUserIndex], ...user };
        } else {
          // Add new user
          this.users.push(user);
        }
        
        // Check if UI is defined before using it
        if (typeof UI !== 'undefined') {
          UI.updateUserNames(user);
        } else {
          console.warn('UI module not available when receiving user info');
        }
      } catch (error) {
        console.error('Error handling user info:', error);
      }
    });
  },
  
  // Request user stats
  requestUserStats() {
    if (this.socket && this.socket.connected) {
      this.socket.emit('users:getStats');
    }
  },
  
  // Set up UI event listeners for chat functionality
  setupUIListeners() {
    console.log('Setting up UI listeners');
    
    // Send message when send button is clicked
    const sendButton = document.getElementById('send-button');
    if (sendButton) {
      console.log('Send button found, adding event listener');
      sendButton.addEventListener('click', () => {
        console.log('Send button clicked');
        this.sendMessage();
      });
    } else {
      console.error('Send button not found in the DOM');
    }
    
    // Send message when Enter is pressed (without Shift)
    const messageInput = document.getElementById('message-input');
    if (messageInput) {
      messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage();
        }
      });
    }

    // Typing indicator
    messageInput.addEventListener('input', () => {
      this.handleTyping();
    });
    
    // Cancel reply button
    const cancelReplyBtn = document.getElementById('cancel-reply');
    if (cancelReplyBtn) {
      cancelReplyBtn.addEventListener('click', () => {
        this.cancelReply();
      });
    }
    
    // Search input
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const query = searchInput.value.trim();
          if (query) {
            this.searchMessages(query);
          }
        }
      });
    }
  },
  
  // Send a message
  sendMessage() {
    console.log('sendMessage function called');
    const messageInput = document.getElementById('message-input');
    const content = messageInput.value.trim();
    
    if (!content) {
      console.log('Message content is empty, not sending');
      return;
    }
    
    // Check if chat ID exists
    if (!this.currentChatId) {
      console.error('No current chat ID');
      this.currentChatId = 'general'; // Default to general
      UI.showNotification('No chat selected. Defaulting to general chat.', 'error');
      UI.setActiveChat('general');
    }
    
    console.log('Sending message to chat:', this.currentChatId);
    
    // Make sure socket exists before sending
    if (!this.socket || !this.socket.connected) {
      console.error('Socket not connected!');
      UI.showNotification('Not connected to server. Please refresh the page.', 'error');
      return;
    }
    
    this.socket.emit('message:send', {
      content,
      chatId: this.currentChatId,
      replyTo: this.replyToMessage ? this.replyToMessage.id : null
    });
    
    // Clear input and reply state
    messageInput.value = '';
    this.cancelReply();
    
    // Reset typing indicator
    clearTimeout(this.typingTimeout);
    this.socket.emit('user:stopTyping', { chatId: this.currentChatId });
  },
  
  // Join a chat room
  joinChat(chatId) {
    this.currentChatId = chatId;
    this.socket.emit('chat:join', { chatId });
    
    // Update UI
    UI.setActiveChat(chatId);
    
    // Clear reply state
    this.cancelReply();
  },
  
  // Handle user typing
  handleTyping() {
    // Send typing indicator
    this.socket.emit('user:typing', { chatId: this.currentChatId });
    
    // Clear previous timeout
    clearTimeout(this.typingTimeout);
    
    // Set timeout to stop typing indicator after 2 seconds of inactivity
    this.typingTimeout = setTimeout(() => {
      this.socket.emit('user:stopTyping', { chatId: this.currentChatId });
    }, 2000);
  },
  
  // Add a reaction to a message
  addReaction(messageId, emoji) {
    this.socket.emit('message:react', { messageId, emoji });
  },
  
  // Mark a message as read
  markMessageAsRead(messageId) {
    this.socket.emit('message:read', { messageId });
  },
  
  // Delete a message
  deleteMessage(messageId) {
    this.socket.emit('message:delete', { messageId });
  },
  
  // Start replying to a message
  replyToMessageFunc(message) {
    this.replyToMessage = message;
    UI.showReplyPreview(message);
    document.getElementById('message-input').focus();
  },
  
  // Cancel replying to a message
  cancelReply() {
    this.replyToMessage = null;
    UI.hideReplyPreview();
  },
  
  // Create a direct chat with another user
  createDirectChat(userId) {
    this.socket.emit('chat:createDirect', { otherUserId: userId });
  },
  
  // Search messages
  searchMessages(query) {
    this.socket.emit('messages:search', { 
      query,
      chatId: this.currentChatId 
    });
  },
  
  // Find chat ID by message ID
  findChatIdByMessageId(messageId) {
    for (const chatId in this.messages) {
      if (this.messages[chatId].some(m => m.id === messageId)) {
        return chatId;
      }
    }
    return null;
  },
  
  // Add a message to the local store
  addMessage(message) {
    if (!message || !message.id || !message.chatId) {
      console.error('Invalid message object:', message);
      return;
    }
    
    if (!this.messages[message.chatId]) {
      this.messages[message.chatId] = [];
    }
    
    // Check if message already exists to prevent duplicates
    const exists = this.messages[message.chatId].some(m => m.id === message.id);
    
    if (!exists) {
      this.messages[message.chatId].push(message);
      console.log(`Added message ${message.id} to local store for chat ${message.chatId}`);
    } else {
      console.log(`Message ${message.id} already exists in local store`);
    }
  },
  
  // Admin: Create new user
  adminCreateUser(username, password) {
    if (!Auth.isAdmin()) return;
    this.socket.emit('admin:createUser', { username, password });
    return {success: true, message: 'User creation request sent'};
  },
  
  // Admin: Get active connections
  adminGetConnections() {
    if (!Auth.isAdmin()) return;
    this.socket.emit('admin:getConnections');
  },
  
  // Update user preferences
  updatePreferences(preferences) {
    this.socket.emit('user:updatePreferences', preferences);
  },
  
  // Check connection status and reconnect if needed
  checkConnection() {
    if (!this.socket || !this.socket.connected) {
      console.log('Socket not connected, attempting to reconnect...');
      
      // If socket exists but is disconnected, try to reconnect
      if (this.socket) {
        this.socket.connect();
      } else {
        // If socket doesn't exist, reinitialize
        this.init();
      }
      
      return false;
    }
    
    return true;
  },
};

// Initialize chat system when page loads
document.addEventListener('DOMContentLoaded', () => {
  // Wait a moment to ensure UI is loaded first
  setTimeout(() => {
    if (Auth.isLoggedIn()) {
      Chat.init();
    }
  }, 100);
});
