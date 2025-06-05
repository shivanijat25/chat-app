// Browser-compatible version of UserModel
const UserModel = {
  // Get user by ID from localStorage
  getUserById(id) {
    if (!id) return null;
    
    try {
      
      // Try to find user in stored stats
      const userStats = this.getUserStats();
      if (userStats && userStats.users) {
        const user = userStats.users.find(u => u.id === id);
        if (user) return user;
      }
      
      // If not found, return basic user object with just the ID
      return { id, username: `User (${id.substring(0, 6)}...)` };
    } catch (error) {
      console.error('Error retrieving user by ID:', error);
      return null;
    }
  },
  
  // Get user statistics from localStorage
  getUserStats() {
    try {
      const statsData = localStorage.getItem('userStats');
      return statsData ? JSON.parse(statsData) : null;
    } catch (error) {
      console.error('Error parsing user stats:', error);
      return null;
    }
  },
  
  // Get all users from localStorage
  getAllUsers() {
    const stats = this.getUserStats();
    return (stats && stats.users) ? stats.users : [];
  },
  
  // Get current user from localStorage
  getCurrentUser() {
    try {
      const userData = localStorage.getItem('currentUser');
      return userData ? JSON.parse(userData) : null;
    } catch (e) {
      console.error('Error parsing user data:', e);
      return null;
    }
  },
  
  // Format user display name
  formatUserName(user) {
    if (!user) return 'Unknown User';
    console.log('Formatting user name:', user);
    return user.username || `User (${user.id ? user.id.substring(0, 6) : 'Unknown'}...)`;
  },
  
  // Get user status class
  getUserStatusClass(status) {
    if (!status) return 'offline';
    return status.online ? 'online' : 'offline';
  }
};
