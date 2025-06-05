const { v4: uuidv4 } = require('uuid');
const moment = require('moment');

// In-memory storage for messages
const messages = new Map();

// Add some test messages to the general chat
const createInitialMessages = () => {
  const testMessage = {
    id: uuidv4(),
    content: "Welcome to the chat application!",
    sender: "system",
    chatId: "general",
    replyTo: null,
    isPrivate: false,
    reactions: [],
    readBy: ["system"],
    createdAt: new Date(),
    updatedAt: new Date(),
    deleted: false
  };
  
  messages.set(testMessage.id, testMessage);
};

// Call once to set up test messages
createInitialMessages();

class MessageModel {
  static createMessage({ content, sender, senderName = null, chatId, replyTo = null, isPrivate = false }) {
    console.log('Creating message:', { content, sender, chatId, replyTo, isPrivate });
    
    const message = {
      id: uuidv4(),
      content,
      sender,
      senderName, // Add sender name to message
      chatId,
      replyTo,
      isPrivate,
      reactions: [],
      readBy: [sender], // Sender has read their own message
      createdAt: new Date(),
      updatedAt: new Date(),
      deleted: false
    };

    messages.set(message.id, message);
    console.log(`Message stored with ID: ${message.id}`);
    return message;
  }

  static getMessage(id) {
    return messages.get(id);
  }

  static getMessagesByChat(chatId) {
    console.log(`Getting messages for chat ${chatId}, total messages: ${messages.size}`);
    const result = Array.from(messages.values())
      .filter(msg => msg.chatId === chatId && !msg.deleted)
      .sort((a, b) => a.createdAt - b.createdAt);
      
    console.log(`Found ${result.length} messages for chat ${chatId}`);
    return result;
  }

  static getThreadMessages(parentMessageId) {
    return Array.from(messages.values())
      .filter(msg => msg.replyTo === parentMessageId && !msg.deleted)
      .sort((a, b) => a.createdAt - b.createdAt);
  }

  static addReaction(messageId, userId, emoji) {
    const message = this.getMessage(messageId);
    if (!message) return false;

    // Check if user already reacted with this emoji
    const existingReaction = message.reactions.find(
      r => r.userId === userId && r.emoji === emoji
    );

    if (existingReaction) {
      // Remove the reaction if it exists
      message.reactions = message.reactions.filter(
        r => !(r.userId === userId && r.emoji === emoji)
      );
    } else {
      // Add new reaction
      message.reactions.push({
        userId,
        emoji,
        timestamp: new Date()
      });
    }

    return true;
  }

  static markAsRead(messageId, userId) {
    const message = this.getMessage(messageId);
    if (!message) return false;

    if (!message.readBy.includes(userId)) {
      message.readBy.push(userId);
    }

    return true;
  }

  static deleteMessage(messageId, userId) {
    const message = this.getMessage(messageId);
    if (!message) return false;

    // Only the sender or an admin can delete the message
    if (message.sender === userId) {
      message.deleted = true;
      message.content = "This message has been deleted";
      message.updatedAt = new Date();
      return true;
    }

    return false;
  }

  static searchMessages(query, chatId = null) {
    query = query.toLowerCase();
    
    return Array.from(messages.values())
      .filter(msg => {
        const contentMatch = msg.content.toLowerCase().includes(query);
        const chatMatch = chatId ? msg.chatId === chatId : true;
        return contentMatch && chatMatch && !msg.deleted;
      })
      .sort((a, b) => b.createdAt - a.createdAt); // Newest first
  }
}

module.exports = { MessageModel };
