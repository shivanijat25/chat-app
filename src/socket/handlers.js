const { UserModel } = require('../models/user');
const { MessageModel } = require('../models/message');
const { ChatModel } = require('../models/chat');

// Store active socket connections
const activeConnections = new Map();

// Track typing status
const typingUsers = new Map();

function setupSocketHandlers(io) {
  // Log active connections
  setInterval(() => {
    const sockets = io.sockets.sockets;
    const connectedSockets = Array.from(sockets).length;
    console.log(`Active socket connections: ${connectedSockets}`);
  }, 30000);

  io.on('connection', (socket) => {
    console.log(`New client connected: ${socket.id}`);

    // Send immediate connection acknowledgement
    socket.emit('server:ack', { message: 'Connected to server', socketId: socket.id });
    
    // User authentication and connection setup
    socket.on('user:login', (userId) => {
      console.log(`User logged in: ${userId} (socket: ${socket.id})`);
      
      // Validate userId
      if (!userId) {
        console.error('Invalid user ID in login attempt');
        socket.emit('server:error', { message: 'Invalid user ID' });
        return;
      }
      
      try {
        // Associate socket with user
        socket.userId = userId;
        activeConnections.set(userId, socket.id);
        
        // Update user status to online
        UserModel.updateUserStatus(userId, { online: true, lastSeen: new Date() });

        // Get and broadcast updated user stats
        const userStats = UserModel.getUserStats();
        io.emit('users:stats', userStats);
        
        // Join a default room
        socket.join('general');
        console.log(`User ${userId} joined general chat`);
        
        // Join user's private room (for direct messages)
        socket.join(`user:${userId}`);
        
        // Notify all clients about user status change
        io.emit('user:statusUpdate', {
          userId,
          status: { online: true, lastSeen: new Date() }
        });

        // Send list of online users to the newly connected user
        socket.emit('users:online', UserModel.getOnlineUsers());
        
        // Send user's chat list
        const userChats = ChatModel.getUserChats(userId);
        socket.emit('chats:list', userChats);
        
        // Get and send chat history immediately for general chat
        const messages = MessageModel.getMessagesByChat('general');
        console.log(`Sending chat history for general: ${messages.length} messages`);
        socket.emit('chat:history', { chatId: 'general', messages });
      } catch (error) {
        console.error('Error in user:login handler:', error);
        socket.emit('server:error', { message: 'Error processing login' });
      }
    });

    // Message handling with improved user info
    socket.on('message:send', (data) => {
      console.log('Message send event received:', data);
      const userId = socket.userId;
      
      if (!userId) {
        console.error('No user ID associated with socket');
        socket.emit('server:error', { message: 'Not authenticated' });
        return;
      }
      
      try {
        if (!data || !data.chatId) {
          console.error('Invalid message data - missing chatId:', data);
          socket.emit('server:error', { message: 'Invalid message format' });
          return;
        }
        
        // Get the sender's username
        const sender = UserModel.getUserById(userId);
        const senderName = sender ? sender.username : null;
        
        // Get chat to determine if it's private
        const chat = ChatModel.getChat(data.chatId);
        if (!chat) {
          console.error('Chat not found:', data.chatId);
          socket.emit('server:error', { message: "Chat not found" });
          
          // Try to recover by creating the general chat if needed
          if (data.chatId === 'general') {
            console.log('Attempting to recreate general chat');
            const generalChat = ChatModel.initialize();
            if (generalChat) {
              console.log('General chat recreated successfully');
            }
          }
          return;
        }

        const isPrivate = chat.isPrivate;
        
        // Create new message with sender name included
        const message = MessageModel.createMessage({
          content: data.content,
          sender: userId,
          senderName: senderName, // Include sender name
          chatId: data.chatId,
          replyTo: data.replyTo,
          isPrivate
        });

        console.log(`Message created: ${message.id} in chat ${message.chatId}`);

        // Send message to appropriate recipients
        if (isPrivate) {
          // Send to all participants in private chat
          chat.participants.forEach(participantId => {
            const socketId = activeConnections.get(participantId);
            if (socketId) {
              io.to(socketId).emit('message:new', message);
              console.log(`Private message sent to user ${participantId}`);
            }
          });
        } else {
          // Send to all users in the chat room
          io.to(data.chatId).emit('message:new', message);
          console.log(`Message broadcast to room ${data.chatId}`);
        }
        
        // Send acknowledgement to sender
        socket.emit('message:sent', { messageId: message.id });
      } catch (error) {
        console.error('Error processing message:', error);
        socket.emit('server:error', { message: 'Error processing message' });
      }
    });

    // Handle chat room joining with improved error handling
    socket.on('chat:join', ({ chatId }) => {
      console.log(`User ${socket.userId} joining chat: ${chatId}`);
      
      if (!chatId) {
        console.error('Invalid chatId in chat:join event');
        socket.emit('server:error', { message: 'Invalid chat ID' });
        return;
      }
      
      // Check if chat exists
      const chat = ChatModel.getChat(chatId);
      if (!chat) {
        console.error(`Chat not found: ${chatId}`);
        socket.emit('server:error', { message: 'Chat not found' });
        
        // Try to recover by creating the general chat if needed
        if (chatId === 'general') {
          console.log('Attempting to recreate general chat');
          ChatModel.initialize();
        }
        return;
      }
      
      socket.join(chatId);
      console.log(`User ${socket.userId} joined chat room: ${chatId}`);
      
      // Get chat history
      const messages = MessageModel.getMessagesByChat(chatId);
      console.log(`Sending ${messages.length} messages for chat history of ${chatId}`);
      socket.emit('chat:history', { chatId, messages });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      const userId = socket.userId;
      if (userId) {
        activeConnections.delete(userId);
        
        // Update user status to offline
        UserModel.updateUserStatus(userId, { 
          online: false, 
          lastSeen: new Date() 
        });

        // Notify all clients about user status change
        io.emit('user:statusUpdate', {
          userId,
          status: { online: false, lastSeen: new Date() }
        });
        
        // Get and broadcast updated user stats
        const userStats = UserModel.getUserStats();
        io.emit('users:stats', userStats);
      }
      console.log('Client disconnected');
    });
    
    // Message reactions
    socket.on('message:react', ({ messageId, emoji }) => {
      const userId = socket.userId;
      if (!userId) return;

      const success = MessageModel.addReaction(messageId, userId, emoji);
      if (success) {
        const message = MessageModel.getMessage(messageId);
        const chat = ChatModel.getChat(message.chatId);

        // Notify appropriate users
        if (chat.isPrivate) {
          chat.participants.forEach(participantId => {
            const socketId = activeConnections.get(participantId);
            if (socketId) {
              io.to(socketId).emit('message:reactionUpdate', {
                messageId,
                reactions: message.reactions
              });
            }
          });
        } else {
          io.to(message.chatId).emit('message:reactionUpdate', {
            messageId,
            reactions: message.reactions
          });
        }
      }
    });

    // Message read receipts
    socket.on('message:read', ({ messageId }) => {
      const userId = socket.userId;
      if (!userId) return;

      const success = MessageModel.markAsRead(messageId, userId);
      if (success) {
        const message = MessageModel.getMessage(messageId);
        // Notify other users that message was read
        io.to(message.chatId).emit('message:readUpdate', {
          messageId,
          readBy: message.readBy
        });
      }
    });

    // Delete message
    socket.on('message:delete', ({ messageId }) => {
      const userId = socket.userId;
      if (!userId) return;

      const success = MessageModel.deleteMessage(messageId, userId);
      if (success) {
        const message = MessageModel.getMessage(messageId);
        io.to(message.chatId).emit('message:deleted', { 
          messageId, 
          updatedContent: message.content 
        });
      }
    });

    // Explicitly handle chat join with improved logging
    socket.on('chat:join', ({ chatId }) => {
      console.log(`User ${socket.userId} joining chat: ${chatId}`);
      
      if (!chatId) {
        console.error('Invalid chatId in chat:join event');
        return;
      }
      
      socket.join(chatId);
      console.log(`User ${socket.userId} joined chat room: ${chatId}`);
      
      // Get chat history
      const messages = MessageModel.getMessagesByChat(chatId);
      console.log(`Sending ${messages.length} messages for chat history of ${chatId}`);
      socket.emit('chat:history', { chatId, messages });
    });

    // Create direct chat
    socket.on('chat:createDirect', ({ otherUserId }) => {
      const userId = socket.userId;
      if (!userId) return;

      const chat = ChatModel.createDirectChat(userId, otherUserId);
      
      // Notify both users about the new chat
      const userSocketId = activeConnections.get(userId);
      const otherUserSocketId = activeConnections.get(otherUserId);
      
      if (userSocketId) {
        io.to(userSocketId).emit('chat:new', chat);
      }
      
      if (otherUserSocketId) {
        io.to(otherUserSocketId).emit('chat:new', chat);
      }
    });

    // Typing indicators
    socket.on('user:typing', ({ chatId }) => {
      const userId = socket.userId;
      if (!userId) return;

      typingUsers.set(userId, { 
        chatId, 
        timestamp: Date.now() 
      });
      
      socket.to(chatId).emit('user:typingStart', { userId, chatId });
    });

    socket.on('user:stopTyping', ({ chatId }) => {
      const userId = socket.userId;
      if (!userId) return;

      if (typingUsers.has(userId)) {
        typingUsers.delete(userId);
        socket.to(chatId).emit('user:typingStop', { userId, chatId });
      }
    });

    // User preferences
    socket.on('user:updatePreferences', (preferences) => {
      const userId = socket.userId;
      if (!userId) return;

      const success = UserModel.updateUserPreferences(userId, preferences);
      if (success) {
        const user = UserModel.getUserById(userId);
        socket.emit('user:preferencesUpdated', user.preferences);
      }
    });

    // Admin features
    socket.on('admin:createUser', ({ username, password }) => {
      const userId = socket.userId;
      const user = UserModel.getUserById(userId);
      console.log(`Admin user ${userId} creating new user: ${username}, `, user);
      if (!user?.isAdmin) return;
      
      const result = UserModel.createUser(username, password, false);
      socket.emit('admin:userCreated', result);
    });

    socket.on('admin:getConnections', () => {
      const userId = socket.userId;
      const user = UserModel.getUserById(userId);
      
      if (!user?.isAdmin) return;
      
      const connections = Array.from(activeConnections).map(([userId, socketId]) => {
        const user = UserModel.getUserById(userId);
        return {
          userId,
          username: user?.username,
          socketId
        };
      });
      
      socket.emit('admin:connections', connections);
    });

    // Search messages
    socket.on('messages:search', ({ query, chatId }) => {
      const results = MessageModel.searchMessages(query, chatId);
      socket.emit('messages:searchResults', results);
    });
    
    // Add handler for requesting user stats
    socket.on('users:getStats', () => {
      const stats = {
        total: UserModel.getAllUsers().length,
        online: UserModel.getOnlineUsers().length,
        offline: UserModel.getAllUsers().length - UserModel.getOnlineUsers().length,
        users: UserModel.getAllUsers().map(user => {
          // Return safe user object without password
          const { password, ...safeUser } = user;
          return safeUser;
        })
      };
      
      socket.emit('users:stats', stats);
    });
    
    // Add handler for user info requests
    socket.on('user:getInfo', ({ userId }) => {
      if (!userId) return;
      
      const user = UserModel.getUserById(userId);
      if (user) {
        // Don't send password
        const { password, ...safeUser } = user;
        socket.emit('user:info', safeUser);
      }
    });
  });
}

module.exports = { setupSocketHandlers };
