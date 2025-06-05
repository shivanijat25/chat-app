const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// In-memory storage for users
const users = new Map();

class UserModel {
  static createUser(username, password, isAdmin = false) {
    // Check if username already exists
    if (this.getUserByUsername(username)) {
      return { success: false, message: 'Username already exists' };
    }

    // Hash password
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    const user = {
      id: uuidv4(),
      username,
      password: hashedPassword,
      isAdmin,
      status: {
        online: false,
        lastSeen: new Date(),
        customStatus: ''
      },
      preferences: {
        theme: 'light',
        notifications: true
      },
      createdAt: new Date()
    };

    users.set(user.id, user);
    
    // Create a clean user object without password for return
    const { password: _, ...cleanUser } = user;
    return { success: true, user: cleanUser };
  }

  static authenticateUser(username, password) {
    const user = this.getUserByUsername(username);
    
    if (!user) {
      return { success: false, message: 'User not found' };
    }

    if (!bcrypt.compareSync(password, user.password)) {
      return { success: false, message: 'Invalid password' };
    }

    // Update user status
    user.status.online = true;
    user.status.lastSeen = new Date();
    
    // Return user without password
    const { password: _, ...cleanUser } = user;
    return { success: true, user: cleanUser };
  }

  static getUserById(id) {
    return users.get(id);
  }

  static getUserByUsername(username) {
    return Array.from(users.values()).find(user => user.username === username);
  }

  static getUserStats() {
    const allUsers = Array.from(users.values());
    const totalUsers = allUsers.length;
    const onlineUsers = allUsers.filter(user => user.status.online).length;
    const offlineUsers = totalUsers - onlineUsers;
    
    return {
      total: totalUsers,
      online: onlineUsers,
      offline: offlineUsers,
      users : allUsers
    };
  }

  static updateUserStatus(userId, status) {
    const user = this.getUserById(userId);
    if (user) {
      user.status = { ...user.status, ...status };
      return true;
    }
    return false;
  }

  static updateUserPreferences(userId, preferences) {
    const user = this.getUserById(userId);
    if (user) {
      user.preferences = { ...user.preferences, ...preferences };
      return true;
    }
    return false;
  }

  static getAllUsers() {
    return Array.from(users.values()).map(user => {
      const { password, ...cleanUser } = user;
      return cleanUser;
    });
  }

  static getOnlineUsers() {
    return Array.from(users.values())
      .filter(user => user.status.online)
      .map(user => {
        const { password, ...cleanUser } = user;
        return cleanUser;
      });
  }
}

module.exports = { UserModel };
