// Connection helper utility

const ConnectionHelper = {
  init() {
    // Create a button in the corner to access connection tools
    const helperBtn = document.createElement('button');
    helperBtn.textContent = '🔌 Fix Connection';
    helperBtn.style.position = 'fixed';
    helperBtn.style.bottom = '10px';
    helperBtn.style.right = '10px';
    helperBtn.style.zIndex = '9999';
    helperBtn.style.padding = '8px 12px';
    helperBtn.style.backgroundColor = '#2980b9';
    helperBtn.style.color = 'white';
    helperBtn.style.border = 'none';
    helperBtn.style.borderRadius = '4px';
    helperBtn.style.cursor = 'pointer';
    helperBtn.addEventListener('click', () => this.showConnectionTools());
    document.body.appendChild(helperBtn);
    
    // Listen for connection errors
    window.addEventListener('error', (event) => {
      if (event.message && (
        event.message.includes('socket') || 
        event.message.includes('connection')
      )) {
        console.log('Connection-related error detected:', event.message);
      }
    });
  },
  
  showConnectionTools() {
    // Create modal with connection tools
    const modal = document.createElement('div');
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.right = '0';
    modal.style.bottom = '0';
    modal.style.backgroundColor = 'rgba(0,0,0,0.7)';
    modal.style.display = 'flex';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
    modal.style.zIndex = '10000';
    
    const panel = document.createElement('div');
    panel.style.backgroundColor = 'white';
    panel.style.borderRadius = '8px';
    panel.style.padding = '20px';
    panel.style.width = '80%';
    panel.style.maxWidth = '500px';
    panel.style.maxHeight = '80%';
    panel.style.overflow = 'auto';
    
    const heading = document.createElement('h2');
    heading.textContent = 'Connection Troubleshooter';
    heading.style.marginTop = '0';
    
    const statusInfo = document.createElement('div');
    statusInfo.style.margin = '15px 0';
    
    // Check connection status
    const isLoggedIn = window.Auth && window.Auth.isLoggedIn();
    const hasChatObject = typeof window.Chat !== 'undefined';
    const hasSocket = hasChatObject && window.Chat.socket;
    const isConnected = hasSocket && window.Chat.socket.connected;
    
    statusInfo.innerHTML = `
      <p><strong>Connection Status:</strong></p>
      <ul>
        <li>User logged in: <span style="color:${isLoggedIn ? 'green' : 'red'}">${isLoggedIn ? '✓' : '✗'}</span></li>
        <li>Chat initialized: <span style="color:${hasChatObject ? 'green' : 'red'}">${hasChatObject ? '✓' : '✗'}</span></li>
        <li>Socket exists: <span style="color:${hasSocket ? 'green' : 'red'}">${hasSocket ? '✓' : '✗'}</span></li>
        <li>Socket connected: <span style="color:${isConnected ? 'green' : 'red'}">${isConnected ? '✓' : '✗'}</span></li>
        ${hasSocket ? `<li>Socket ID: ${window.Chat.socket.id || 'none'}</li>` : ''}
        ${hasChatObject ? `<li>Current chat: ${window.Chat.currentChatId || 'none'}</li>` : ''}
      </ul>
    `;
    
    // Add action buttons
    const buttonsContainer = document.createElement('div');
    buttonsContainer.style.display = 'flex';
    buttonsContainer.style.flexDirection = 'column';
    buttonsContainer.style.gap = '10px';
    
    // Reconnect button
    const reconnectBtn = document.createElement('button');
    reconnectBtn.textContent = 'Reconnect Socket';
    reconnectBtn.style.padding = '10px';
    reconnectBtn.addEventListener('click', () => {
      try {
        if (window.Chat && window.Chat.socket) {
          // Force disconnect and reconnect
          window.Chat.socket.disconnect();
          setTimeout(() => {
            window.Chat.socket.connect();
            updateStatus('Reconnection attempted');
          }, 1000);
        } else {
          updateStatus('Chat or socket not available');
        }
      } catch (err) {
        updateStatus('Error: ' + err.message);
      }
    });
    
    // Reload page button
    const reloadBtn = document.createElement('button');
    reloadBtn.textContent = 'Refresh Page';
    reloadBtn.style.padding = '10px';
    reloadBtn.addEventListener('click', () => {
      window.location.reload();
    });
    
    // Test message button
    const testMsgBtn = document.createElement('button');
    testMsgBtn.textContent = 'Send Test Message';
    testMsgBtn.style.padding = '10px';
    testMsgBtn.addEventListener('click', () => {
      try {
        if (window.Chat && window.Chat.socket && window.Chat.socket.connected) {
          window.Chat.socket.emit('message:send', {
            content: 'Test message: ' + new Date().toLocaleTimeString(),
            chatId: window.Chat.currentChatId || 'general',
            replyTo: null
          });
          updateStatus('Test message sent');
        } else {
          updateStatus('Cannot send message: not connected');
        }
      } catch (err) {
        updateStatus('Error: ' + err.message);
      }
    });
    
    // Log connection details button
    const logDetailsBtn = document.createElement('button');
    logDetailsBtn.textContent = 'Log Connection Details';
    logDetailsBtn.style.padding = '10px';
    logDetailsBtn.addEventListener('click', () => {
      try {
        console.log('=== CONNECTION DETAILS ===');
        console.log('Auth:', window.Auth);
        console.log('Chat:', window.Chat);
        console.log('Socket:', window.Chat?.socket);
        console.log('Connected:', window.Chat?.socket?.connected);
        console.log('Socket ID:', window.Chat?.socket?.id);
        console.log('========================');
        updateStatus('Details logged to console');
      } catch (err) {
        updateStatus('Error: ' + err.message);
      }
    });
    
    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Close';
    closeBtn.style.padding = '10px';
    closeBtn.style.marginTop = '10px';
    closeBtn.addEventListener('click', () => {
      document.body.removeChild(modal);
    });
    
    // Status area
    const statusArea = document.createElement('div');
    statusArea.style.marginTop = '15px';
    statusArea.style.padding = '10px';
    statusArea.style.backgroundColor = '#f8f9fa';
    statusArea.style.borderRadius = '4px';
    statusArea.style.fontSize = '14px';
    statusArea.textContent = 'Ready';
    
    function updateStatus(message) {
      statusArea.textContent = message;
    }
    
    // Add all elements to the panel
    buttonsContainer.appendChild(reconnectBtn);
    buttonsContainer.appendChild(testMsgBtn);
    buttonsContainer.appendChild(logDetailsBtn);
    buttonsContainer.appendChild(reloadBtn);
    buttonsContainer.appendChild(closeBtn);
    
    panel.appendChild(heading);
    panel.appendChild(statusInfo);
    panel.appendChild(buttonsContainer);
    panel.appendChild(statusArea);
    modal.appendChild(panel);
    
    document.body.appendChild(modal);
  }
};

// Initialize the connection helper
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    ConnectionHelper.init();
  }, 2000);
});
