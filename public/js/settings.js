document.addEventListener('DOMContentLoaded', () => {
    // Get user data from local storage
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        window.location.href = '/login';
        return;
    }

    // Connect to socket.io
    const socket = io();
    
    socket.on('connect', () => {
        console.log('Connected to server');
        
        // Authenticate the socket connection
        socket.emit('user:login', currentUser.id);
    });
    
    // Show admin section if user is admin
    if (currentUser.isAdmin) {
        document.getElementById('admin-section').classList.remove('hidden');
    }
    
    // Handle preference saving
    document.getElementById('save-preferences').addEventListener('click', () => {
        const theme = document.getElementById('theme').value;
        const notifications = document.getElementById('notifications').checked;
        
        // Send preferences to server
        socket.emit('user:updatePreferences', { theme, notifications });
    });
    
    // Handle preference update confirmation
    socket.on('user:preferencesUpdated', (preferences) => {
        showMessage('Preferences saved successfully!', 'success');
        
        // Update local storage user data
        currentUser.preferences = preferences;
        localStorage.setItem('user', JSON.stringify(currentUser));
    });
    
    // Only setup admin handlers if user is admin
    if (currentUser.isAdmin) {
        // Handle user creation form
        document.getElementById('add-user-form').addEventListener('submit', (e) => {
            e.preventDefault();
            
            const username = document.getElementById('new-username').value.trim();
            const password = document.getElementById('new-password').value;
            
            if (!username || !password) {
                showAddUserMessage('Username and password are required', 'error');
                return;
            }
            
            // Send user creation request
            socket.emit('admin:createUser', { username, password });
            
            // Clear form
            document.getElementById('new-username').value = '';
            document.getElementById('new-password').value = '';
        });
        
        // Handle user creation response
        socket.on('admin:userCreated', (result) => {
            if (result.success) {
                showAddUserMessage(`User ${result.user.username} created successfully!`, 'success');
            } else {
                showAddUserMessage(`Failed to create user: ${result.message}`, 'error');
            }
        });
        
        // Handle viewing active connections
        document.getElementById('view-connections').addEventListener('click', () => {
            socket.emit('admin:getConnections');
        });
        
        // Display active connections
        socket.on('admin:connections', (connections) => {
            const connectionsList = document.getElementById('connections-list');
            connectionsList.innerHTML = '';
            
            if (connections.length === 0) {
                connectionsList.innerHTML = '<p>No active connections</p>';
                return;
            }
            
            const ul = document.createElement('ul');
            connections.forEach(conn => {
                const li = document.createElement('li');
                li.textContent = `${conn.username} (${conn.userId}) - Socket: ${conn.socketId}`;
                ul.appendChild(li);
            });
            
            connectionsList.appendChild(ul);
        });
    }
    
    // Helper function to show messages in the add user section
    function showAddUserMessage(message, type) {
        const messageElement = document.getElementById('add-user-message');
        messageElement.textContent = message;
        messageElement.className = `message ${type}`;
        
        // Clear message after 5 seconds
        setTimeout(() => {
            let messageElement1 = document?.getElementById('add-user-message');
            if(messageElement1){
                messageElement1.textContent = '';
                messageElement1.className = 'message';
            }            
        }, 3000);
    }
    
    // Helper function for general messages
    function showMessage(message, type) {
        // You could implement a general message display area
        console.log(`${type}: ${message}`);
    }
    
    // Handle server errors
    socket.on('server:error', (data) => {
        console.error('Server error:', data.message);
        showAddUserMessage(`Server error: ${data.message}`, 'error');
    });
});
