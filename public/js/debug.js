// Debug helper functions
const Debug = {
  init() {
    console.log('Debug mode initialized');
    
    // Monitor socket.io connection
    window.addEventListener('load', () => {
      setTimeout(() => {
        if (window.io) {
          console.log('socket.io is loaded');
          
          // Check if Chat object has socket connection
          if (window.Chat && window.Chat.socket) {
            console.log('Chat.socket exists. Connected:', window.Chat.socket.connected);
            
            // Log connection events
            window.Chat.socket.on('connect', () => {
              console.log('Socket connected!');
            });
            
            window.Chat.socket.on('disconnect', () => {
              console.log('Socket disconnected!');
            });
            
            window.Chat.socket.on('connect_error', (error) => {
              console.error('Connection error:', error);
            });
          } else {
            console.error('Chat.socket not found');
          }
        } else {
          console.error('socket.io not loaded!');
        }
      }, 1000);
    });
    
    // Add debug controls
    this.addDebugControls();
  },
  
  addDebugControls() {
    const debugPanel = document.createElement('div');
    debugPanel.style.position = 'fixed';
    debugPanel.style.bottom = '10px';
    debugPanel.style.left = '10px';
    debugPanel.style.zIndex = '9999';
    debugPanel.style.background = 'rgba(0,0,0,0.7)';
    debugPanel.style.padding = '10px';
    debugPanel.style.borderRadius = '5px';
    debugPanel.style.color = 'white';
    
    const sendTestBtn = document.createElement('button');
    sendTestBtn.innerText = 'Send Test Message';
    sendTestBtn.style.padding = '5px';
    sendTestBtn.style.marginRight = '5px';
    sendTestBtn.addEventListener('click', () => {
      if (window.Chat && window.Chat.socket) {
        window.Chat.socket.emit('message:send', {
          content: 'Test message from debug panel',
          chatId: 'general',
          replyTo: null
        });
        console.log('Test message sent');
      } else {
        console.error('Cannot send test message - Chat or socket not initialized');
      }
    });
    
    const checkConnBtn = document.createElement('button');
    checkConnBtn.innerText = 'Check Connection';
    checkConnBtn.style.padding = '5px';
    checkConnBtn.addEventListener('click', () => {
      if (window.Chat && window.Chat.socket) {
        console.log('Socket connected:', window.Chat.socket.connected);
        console.log('Socket ID:', window.Chat.socket.id);
      } else {
        console.error('Chat or socket not initialized');
      }
    });
    
    debugPanel.appendChild(sendTestBtn);
    debugPanel.appendChild(checkConnBtn);
    
    document.body.appendChild(debugPanel);
  }
};

// Debug utility for the chat application
const ChatDebug = {
  initialized: false,
  checkInterval: null,

  init() {
    console.log('Debug utility initialization starting');
    
    // Create a simple indicator in the corner first
    this.createConnectionIndicator();
    
    // Check for Chat initialization periodically
    this.checkInterval = setInterval(() => {
      this.checkChatStatus();
    }, 2000);
    
    // Immediate first check
    setTimeout(() => this.checkChatStatus(), 500);
  },
  
  checkChatStatus() {
    // Check if window.Chat exists first
    if (typeof window.Chat === 'undefined') {
      console.log('Debug: Chat object not available yet');
      return;
    }
    
    // Then carefully check if socket exists and is connected
    const socketExists = window.Chat.hasOwnProperty('socket') && window.Chat.socket !== null;
    const isConnected = socketExists && window.Chat.socket.connected === true;
    
    // Update indicator if it exists
    const indicator = document.getElementById('debug-connection-indicator');
    if (indicator) {
      indicator.style.backgroundColor = isConnected ? '#44b700' : '#ff4757';
      indicator.title = isConnected ? 'Socket Connected' : 'Socket Disconnected or Not Initialized';
    }
    
    // Initialize full debug panel only when fully connected
    if (isConnected && !this.initialized) {
      console.log('Debug: Chat and socket fully initialized, setting up debug tools');
      this.initialized = true;
      clearInterval(this.checkInterval);
      this.setupFullDebugPanel();
    }
  },
  
  createConnectionIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'debug-connection-indicator';
    indicator.style.position = 'fixed';
    indicator.style.bottom = '10px';
    indicator.style.left = '10px';
    indicator.style.width = '15px';
    indicator.style.height = '15px';
    indicator.style.borderRadius = '50%';
    indicator.style.backgroundColor = '#f1c40f'; // Yellow while initializing
    indicator.style.border = '2px solid white';
    indicator.style.boxShadow = '0 0 5px rgba(0,0,0,0.5)';
    indicator.style.zIndex = '9999';
    indicator.style.cursor = 'pointer';
    indicator.title = 'Checking connection...';
    
    // Add click event to show status
    indicator.addEventListener('click', () => {
      this.showSimpleStatus();
    });
    
    document.body.appendChild(indicator);
  },
  
  showSimpleStatus() {
    const chatExists = typeof window.Chat !== 'undefined';
    const socketExists = chatExists && window.Chat.hasOwnProperty('socket') && window.Chat.socket !== null;
    const socketConnected = socketExists && window.Chat.socket.connected === true;
    
    const statusInfo = [
      `Chat object exists: ${chatExists}`,
      `Socket exists: ${socketExists}`,
      `Socket connected: ${socketConnected}`
    ].join('\n');
    
    alert(statusInfo);
    console.log(statusInfo.replace(/\n/g, ', '));
  },
  
  setupFullDebugPanel() {
    // Only initialize if we've confirmed Chat and socket exist
    if (!window.Chat || !window.Chat.socket) {
      console.error('Cannot set up debug panel - Chat or socket not available');
      return;
    }
    
    // Create debug panel container
    const debugPanel = document.createElement('div');
    debugPanel.id = 'debug-panel';
    debugPanel.style.position = 'fixed';
    debugPanel.style.bottom = '10px';
    debugPanel.style.left = '30px';
    debugPanel.style.backgroundColor = 'rgba(0,0,0,0.7)';
    debugPanel.style.padding = '8px';
    debugPanel.style.borderRadius = '4px';
    debugPanel.style.zIndex = '9998';
    
    // Add send test message button
    const sendButton = document.createElement('button');
    sendButton.textContent = 'Send Test';
    sendButton.style.marginRight = '5px';
    sendButton.addEventListener('click', () => {
      try {
        const testMsg = {
          content: `Test message at ${new Date().toLocaleTimeString()}`,
          chatId: window.Chat.currentChatId || 'general',
          replyTo: null
        };
        window.Chat.socket.emit('message:send', testMsg);
        console.log('Debug: Test message sent', testMsg);
      } catch (err) {
        console.error('Error sending test message:', err);
      }
    });
    
    // Add socket info button
    const infoButton = document.createElement('button');
    infoButton.textContent = 'Socket Info';
    infoButton.addEventListener('click', () => {
      try {
        console.log('Chat current state:', {
          socketId: window.Chat.socket.id,
          connected: window.Chat.socket.connected,
          currentChat: window.Chat.currentChatId,
          messages: window.Chat.messages
        });
      } catch (err) {
        console.error('Error showing socket info:', err);
      }
    });
    
    debugPanel.appendChild(sendButton);
    debugPanel.appendChild(infoButton);
    document.body.appendChild(debugPanel);
    
    // Set up socket event monitoring
    try {
      const origEmit = window.Chat.socket.emit;
      window.Chat.socket.emit = function(...args) {
        console.log('Socket EMIT:', args[0], ...args.slice(1));
        return origEmit.apply(this, args);
      };
      
      window.Chat.socket.onAny((event, ...args) => {
        if (event !== 'ping' && event !== 'pong') { // Filter out noise
          console.log('Socket RECEIVED:', event, ...args);
        }
      });
    } catch (err) {
      console.error('Error setting up socket monitoring:', err);
    }
  }
};

// Initialize debug tools
document.addEventListener('DOMContentLoaded', () => {
  Debug.init();
  setTimeout(() => {
    ChatDebug.init();
  }, 1000);
});
