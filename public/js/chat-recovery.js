// Simple recovery script that runs if Chat fails to initialize
document.addEventListener('DOMContentLoaded', () => {
  // Wait sufficient time for normal initialization to happen
  setTimeout(() => {
    // Only add recovery panel if Chat isn't initialized
    if (!window.Chat || !window.Chat.socket || !window.Chat.socket.connected) {
      console.log('Chat not properly initialized after timeout, adding recovery panel');
      
      const recoveryPanel = document.createElement('div');
      recoveryPanel.style.position = 'fixed';
      recoveryPanel.style.bottom = '10px';
      recoveryPanel.style.right = '10px';
      recoveryPanel.style.backgroundColor = 'rgba(255,0,0,0.8)';
      recoveryPanel.style.color = 'white';
      recoveryPanel.style.padding = '15px';
      recoveryPanel.style.borderRadius = '5px';
      recoveryPanel.style.zIndex = '9999';
      recoveryPanel.style.fontWeight = 'bold';
      
      const refreshBtn = document.createElement('button');
      refreshBtn.textContent = 'Refresh Page';
      refreshBtn.style.padding = '8px 16px';
      refreshBtn.addEventListener('click', () => {
        window.location.reload();
      });
      
      const diagBtn = document.createElement('button');
      diagBtn.textContent = 'Show Diagnostics';
      diagBtn.style.padding = '8px 16px';
      diagBtn.style.marginLeft = '10px';
      diagBtn.addEventListener('click', () => {
        const status = {
          auth: !!window.Auth,
          chat: !!window.Chat,
          socket: !!(window.Chat && window.Chat.socket),
          connected: !!(window.Chat && window.Chat.socket && window.Chat.socket.connected),
          socketId: (window.Chat && window.Chat.socket) ? window.Chat.socket.id : null,
          userId: window.Auth ? window.Auth.getUserId() : null
        };
        
        console.log('Chat system diagnostics:', status);
        alert('Diagnostics info:\n' + JSON.stringify(status, null, 2));
      });
      
      const statusLabel = document.createElement('div');
      statusLabel.textContent = 'Chat system not connected';
      statusLabel.style.marginBottom = '10px';
      
      recoveryPanel.appendChild(statusLabel);
      recoveryPanel.appendChild(refreshBtn);
      recoveryPanel.appendChild(diagBtn);
      document.body.appendChild(recoveryPanel);
    }
  }, 5000);
});
