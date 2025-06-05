const express = require('express');
const http = require('http');
const path = require('path');
const cookieParser = require('cookie-parser');
const socketio = require('socket.io');

// Create Express app and HTTP server
const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Middleware - ensure src directory is not accessible to clients
app.use('/src', (req, res) => {
  res.status(403).send('Access Forbidden');
});

// Use express static middleware only for public directory
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Import models
const { UserModel } = require('./src/models/user');
const { MessageModel } = require('./src/models/message');
const { ChatModel } = require('./src/models/chat');

// Import socket handlers
const { setupSocketHandlers } = require('./src/socket/handlers');

// Initialize models
console.log('Initializing chat model...');
const generalChat = ChatModel.initialize();
console.log('General chat initialized:', generalChat);

// Set up socket handlers
setupSocketHandlers(io);

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

// API routes for authentication
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  const result = UserModel.authenticateUser(username, password);
  if (result.success) {
    res.json({ success: true, user: result.user });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

app.post('/api/register', (req, res) => {
  const { username, password } = req.body;
  
  const result = UserModel.createUser(username, password, false); // false = not admin
  if (result.success) {
    res.json({ success: true, user: result.user });
  } else {
    res.status(400).json({ success: false, message: result.message });
  }
});

// Create admin user if none exists
const adminResult = UserModel.createUser('SHIVANI', 'SHIVANI', true);
console.log('Admin user created/verified:', adminResult.success);

// Pre-load user list for better debugging
const allUsers = UserModel.getAllUsers();
console.log(`Loaded ${allUsers.length} users`);

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
