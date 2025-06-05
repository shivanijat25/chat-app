// Client-side user model (browser compatible version)
const UserClient = {
  // Get current user from local storage
  getCurrentUser() {
    try {
      const userData = localStorage.getItem('currentUser');
      return userData ? JSON.parse(userData) : null;
    } catch (e) {
      console.error('Error parsing user data from localStorage', e);
      return null;
    }
  },
  
  // Update user preferences locally
  updatePreferences(preferences) {
    try {
      const userData = this.getCurrentUser();
      if (!userData) return false;
      
      userData.preferences = { ...userData.preferences, ...preferences };
      localStorage.setItem('currentUser', JSON.stringify(userData));
      return true;
    } catch (e) {
      console.error('Error updating preferences', e);
      return false;
    }
  },
  
  // Format user display name
  formatUserName(user) {
    console.log('Formatting user name:', user);
    if (!user) return 'Unknown User';
    return user.username || 'User';
  }
};
