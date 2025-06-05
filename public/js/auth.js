// User authentication management
const Auth = {
  // Current user details
  currentUser: null,

  // Initialize authentication from local storage
  init() {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        this.currentUser = JSON.parse(storedUser);
        return true;
      } catch (e) {
        console.error('Error parsing stored user data', e);
        localStorage.removeItem('currentUser');
      }
    }
    return false;
  },

  // Login user
  login(username, password) {
    return new Promise((resolve, reject) => {
      fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            this.currentUser = data.user;
            localStorage.setItem('currentUser', JSON.stringify(data.user));
            resolve(data.user);
          } else {
            reject(new Error(data.message || 'Login failed'));
          }
        })
        .catch(error => {
          console.error('Login error:', error);
          reject(error);
        });
    });
  },

  // Register new user
  register(username, password) {
    return new Promise((resolve, reject) => {
      fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            this.currentUser = data.user;
            localStorage.setItem('currentUser', JSON.stringify(data.user));
            resolve(data.user);
          } else {
            reject(new Error(data.message || 'Registration failed'));
          }
        })
        .catch(error => {
          console.error('Registration error:', error);
          reject(error);
        });
    });
  },

  // Logout current user
  logout() {
    this.currentUser = null;
    localStorage.removeItem('currentUser');
    window.location.href = '/login';
  },

  // Check if user is logged in
  isLoggedIn() {
    return !!this.currentUser;
  },

  // Check if current user is an admin
  isAdmin() {
    return this.currentUser && this.currentUser.isAdmin;
  },

  // Get current user's ID
  getUserId() {
    return this.currentUser ? this.currentUser.id : null;
  },

  // Get current username
  getUsername() {
    return this.currentUser ? this.currentUser.username : null;
  },

  // Update user preferences
  updatePreferences(preferences) {
    if (!this.currentUser) return Promise.reject(new Error('Not logged in'));
    
    this.currentUser.preferences = {
      ...this.currentUser.preferences,
      ...preferences
    };
    
    localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
    return Promise.resolve(this.currentUser.preferences);
  },

  // Check if we need to redirect user based on auth state
  checkAuthState() {
    const isLoginPage = window.location.pathname === '/login';
    
    if (!this.isLoggedIn() && !isLoginPage) {
      // Not logged in and not on login page, redirect to login
      window.location.href = '/login';
      return false;
    } else if (this.isLoggedIn() && isLoginPage) {
      // Logged in but on login page, redirect to main page
      window.location.href = '/';
      return false;
    }
    
    return true;
  }
};

// Check auth state on page load
document.addEventListener('DOMContentLoaded', () => {
  Auth.init();
  Auth.checkAuthState();
});
