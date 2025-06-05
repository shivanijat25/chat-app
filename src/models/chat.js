const { v4: uuidv4 } = require('uuid');

// In-memory storage for chats
const chats = new Map();

class ChatModel {
  static createChat(name, isPrivate = false, participants = []) {
    const chat = {
      id: uuidv4(),
      name,
      isPrivate,
      participants,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    chats.set(chat.id, chat);
    return chat;
  }

  static createDirectChat(participant1, participant2) {
    // Check if a direct chat already exists between these users
    const existingChat = this.getDirectChatByParticipants(participant1, participant2);
    if (existingChat) return existingChat;

    const chatName = `${participant1}-${participant2}`;
    return this.createChat(chatName, true, [participant1, participant2]);
  }

  static getChat(id) {
    if (!id) {
      console.error('Invalid chat ID: undefined or null');
      return null;
    }
    
    const chat = chats.get(id);
    
    if (!chat) {
      console.log(`Chat not found with ID: ${id}`);
      console.log('Available chats:', Array.from(chats.keys()));
    }
    
    return chat;
  }

  static getUserChats(userId) {
    return Array.from(chats.values())
      .filter(chat => chat.participants.includes(userId))
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }

  static getDirectChatByParticipants(user1Id, user2Id) {
    return Array.from(chats.values()).find(chat => 
      chat.isPrivate && 
      chat.participants.length === 2 &&
      chat.participants.includes(user1Id) &&
      chat.participants.includes(user2Id)
    );
  }

  static addParticipant(chatId, userId) {
    const chat = this.getChat(chatId);
    if (!chat) return false;

    if (!chat.participants.includes(userId)) {
      chat.participants.push(userId);
      chat.updatedAt = new Date();
    }
    
    return chat;
  }

  static removeParticipant(chatId, userId) {
    const chat = this.getChat(chatId);
    if (!chat) return false;

    chat.participants = chat.participants.filter(id => id !== userId);
    chat.updatedAt = new Date();
    
    return chat;
  }

  // Initialize a general chat room
  static initialize() {
    // Check if general chat exists, if not create it
    let generalChat = this.getChat('general');
    
    if (!generalChat) {
      console.log('Creating general chat room');
      generalChat = {
        id: 'general',
        name: 'General',
        isPrivate: false,
        participants: [], // Empty array means everyone can join
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      chats.set('general', generalChat);
      console.log('General chat room created:', generalChat);
    } else {
      console.log('General chat room already exists');
    }
    
    return generalChat;
  }
}

// Initialize default chat
ChatModel.initialize();

module.exports = { ChatModel };
