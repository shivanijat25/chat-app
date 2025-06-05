// UI functionality and DOM manipulation
const UI = {
  // Track if user has scrolled up (not at bottom)
  isScrolledUp: false,
  
  // Common emoji reactions
  commonEmojis: ['👍', '❤️', '😂', '😮', '😢', '👏', '🔥', '🎉'],
  
  // Initialize UI
  init() {
    if (!Auth.isLoggedIn()) return;
    
    // Apply theme from user preferences
    const theme = Auth.currentUser?.preferences?.theme || 'light';
    this.applyTheme(theme);
    
    // Set up theme toggle
    this.setupThemeToggle();
    
    // Set up settings modal
    this.setupSettingsModal();
    
    // Set up user info modal
    this.setupUserInfoModal();
    
    // Set up emoji picker
    this.setupEmojiPicker();
    
    // Set up logout button
    this.setupLogoutButton();
    
    // Set up status change buttons
    this.setupStatusChanges();
    
    // Set up admin features if the user is an admin
    if (Auth.isAdmin()) {
      this.setupAdminFeatures();
    }
    
    // Set up mobile responsive features
    this.setupMobileView();
    
    // Update user info in sidebar
    this.updateUserInfo();
    
    // Set up scroll detection
    this.setupScrollDetection();
    
    // Create user stats container
    this.createUserStatsContainer();

    // Process any pending messages or chat history
    this.processPendingMessages();

    // Process any queued UI callbacks
    this.processCallbackQueue();
  },
  
  // Apply theme to the body
  applyTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    document.querySelectorAll('.theme-option').forEach(btn => {
      btn.classList.remove('active');
      if (btn.getAttribute('data-theme') === theme) {
        btn.classList.add('active');
      }
    });
  },
  
  // Set up theme toggle in sidebar
  setupThemeToggle() {
    const toggle = document.getElementById('theme-toggle');
    if (toggle) {
      toggle.addEventListener('click', () => {
        const currentTheme = document.body.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme(newTheme);
        Auth.updatePreferences({ theme: newTheme });
        Chat.updatePreferences({ theme: newTheme });
      });
    }
  },
  
  // Set up settings modal
  setupSettingsModal() {
    const settingsButton = document.getElementById('settings-button');
    const settingsModal = document.getElementById('settings-modal');
    const closeButtons = settingsModal.querySelectorAll('.close-modal');

    settingsButton.addEventListener('click', () => {
      settingsModal.style.display = 'flex';
    });

    closeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        settingsModal.style.display = 'none';
      });
    });

    // Theme option buttons
    const themeButtons = document.querySelectorAll('.theme-option');
    themeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const theme = btn.getAttribute('data-theme');
        this.applyTheme(theme);
        Auth.updatePreferences({ theme });
        Chat.updatePreferences({ theme });
      });
    });

    // Notification toggle
    const notificationToggle = document.getElementById('notification-toggle');
    notificationToggle.addEventListener('change', () => {
      Auth.updatePreferences({ notifications: notificationToggle.checked });
      Chat.updatePreferences({ notifications: notificationToggle.checked });
    });

    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
      if (event.target === settingsModal) {
        settingsModal.style.display = 'none';
      }
    });
  },
  
  // Set up user info modal
  setupUserInfoModal() {
    const userInfoModal = document.getElementById('user-info-modal');
    const closeButtons = userInfoModal.querySelectorAll('.close-modal');

    closeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        userInfoModal.style.display = 'none';
      });
    });

    // Direct message button
    const directMessageBtn = document.getElementById('send-direct-message');
    directMessageBtn.addEventListener('click', () => {
      const userId = directMessageBtn.getAttribute('data-user-id');
      if (userId) {
        Chat.createDirectChat(userId);
        userInfoModal.style.display = 'none';
      }
    });

    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
      if (event.target === userInfoModal) {
        userInfoModal.style.display = 'none';
      }
    });
  },
  
  // Set up emoji picker
  setupEmojiPicker() {
    const emojiButton = document.getElementById('emoji-button');
    const emojiPicker = document.getElementById('emoji-picker');

    // Create emoji buttons
    this.commonEmojis.forEach(emoji => {
      const emojiElement = document.createElement('div');
      emojiElement.className = 'emoji';
      emojiElement.textContent = emoji;
      emojiElement.addEventListener('click', () => {
        const messageInput = document.getElementById('message-input');
        messageInput.value += emoji;
        messageInput.focus();
        emojiPicker.style.display = 'none';
      });
      emojiPicker.appendChild(emojiElement);
    });

    emojiButton.addEventListener('click', () => {
      if (emojiPicker.style.display === 'grid') {
        emojiPicker.style.display = 'none';
      } else {
        emojiPicker.style.display = 'grid';
      }
    });

    // Close emoji picker when clicking outside
    document.addEventListener('click', (event) => {
      if (!emojiButton.contains(event.target) && !emojiPicker.contains(event.target)) {
        emojiPicker.style.display = 'none';
      }
    });
  },
  
  // Set up logout button
  setupLogoutButton() {
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
      logoutButton.addEventListener('click', () => {
        Auth.logout();
      });
    }
  },
  
  // Set up status change buttons
  setupStatusChanges() {
    const statusDropdown = document.getElementById('status-dropdown');
    const statusOptions = statusDropdown.querySelectorAll('[data-status]');
    const customStatus = document.getElementById('custom-status');
    const currentStatus = document.getElementById('current-status');

    statusOptions.forEach(option => {
      option.addEventListener('click', (e) => {
        e.preventDefault();
        const status = option.getAttribute('data-status');
        currentStatus.textContent = option.textContent;
        Chat.socket.emit('user:updateStatus', { status });
      });
    });

    customStatus.addEventListener('click', (e) => {
      e.preventDefault();
      const statusText = prompt('Enter your custom status:');
      if (statusText) {
        currentStatus.textContent = statusText;
        Chat.socket.emit('user:updateStatus', { customStatus: statusText });
      }
    });
  },
  
  // Set up admin features
  setupAdminFeatures() {
    const adminSettings = document.getElementById('admin-settings');
    adminSettings.style.display = 'block';

    const addUserButton = document.getElementById('add-user-button');
    const viewConnectionsButton = document.getElementById('view-connections-button');
    const addUserModal = document.getElementById('add-user-modal');
    const addUserForm = document.getElementById('add-user-form');
    const addUserMessage = document.getElementById('add-user-message');

    // Open the modal when Add User button is clicked
    addUserButton.addEventListener('click', () => {
      addUserModal.style.display = 'flex';
      addUserForm.reset(); // Reset the form
      addUserMessage.textContent = ''; // Clear any messages
      addUserMessage.className = 'form-message';
    });

    // Close the modal with X or Cancel button
    const closeModal = () => {
      addUserModal.style.display = 'none';
    };

    addUserModal.querySelector('.close-modal').addEventListener('click', closeModal);
    document.getElementById('cancel-add-user').addEventListener('click', closeModal);

    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
      if (event.target === addUserModal) {
        closeModal();
      }
    });

    // Handle form submission
    addUserForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const usernameInput = document.getElementById('new-username');
      const passwordInput = document.getElementById('new-password');
      
      const username = usernameInput.value.trim();
      const password = passwordInput.value.trim();
      
      if (!username || !password) {
        this.showFormMessage(addUserMessage, 'Please fill in all fields', 'error');
        return;
      }
      
      // Disable the form during submission
      const submitButton = addUserForm.querySelector('button[type="submit"]');
      submitButton.disabled = true;
      submitButton.textContent = 'Creating...';
      
      try {
        const result = await Chat.adminCreateUser(username, password);
        
        if (result && result.success) {
          this.showFormMessage(addUserMessage, `User "${username}" created successfully!`, 'success');
          addUserForm.reset(); // Clear the form
          
          // Close modal after success (optional - keep it open to show the success message)
          // setTimeout(closeModal, 2000);
        } else {
          const errorMsg = (result && result.message) ? result.message : 'Failed to create user';
          this.showFormMessage(addUserMessage, errorMsg, 'error');
        }
      } catch (error) {
        this.showFormMessage(addUserMessage, error.message || 'An error occurred', 'error');
      } finally {
        // Re-enable the form
        submitButton.disabled = false;
        submitButton.textContent = 'Create User';
      }
    });

    viewConnectionsButton.addEventListener('click', () => {
      Chat.adminGetConnections();
    });
  },
  
  // Helper to show form messages
  showFormMessage(element, message, type) {
    element.textContent = message;
    element.className = `form-message ${type}`;
    element.style.display = 'block';
  },
  
  // Set up mobile responsive view
  setupMobileView() {
    const mobileWidth = 768;

    // Add menu button to header for mobile
    if (window.innerWidth <= mobileWidth) {
      const chatHeader = document.getElementById('chat-header');
      const menuButton = document.createElement('div');
      menuButton.className = 'menu-button';
      menuButton.innerHTML = '<i class="fas fa-bars"></i>';
      chatHeader.prepend(menuButton);

      menuButton.addEventListener('click', () => {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.toggle('show');
      });

      // Close sidebar when clicking on a chat in mobile view
      const chatItems = document.querySelectorAll('.chat-item');
      chatItems.forEach(item => {
        item.addEventListener('click', () => {
          sidebar.classList.toggle('show');
        });
      });
    }
  },
  
  // Update user info in sidebar
  updateUserInfo() {
    const userInfo = document.getElementById('user-info');
    if (userInfo && Auth.currentUser) {
      const usernameElement = userInfo.querySelector('.username');
      usernameElement.textContent = Auth.currentUser.username;

      if (Auth.isAdmin()) {
        const adminBadge = document.createElement('span');
        adminBadge.className = 'admin-badge';
        adminBadge.textContent = 'Admin';
        usernameElement.appendChild(adminBadge);
      }
    }
  },
  
  // Set up scroll detection for messages container
  setupScrollDetection() {
    const messagesContainer = document.getElementById('messages-container');

    messagesContainer.addEventListener('scroll', () => {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainer;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 50;
      this.isScrolledUp = !isAtBottom;
    });
  },
  
  // Process any messages that arrived before UI was initialized
  processPendingMessages() {
    try {
      // Render any pending chat history
      if (window.pendingChatHistory) {
        for (const [chatId, messages] of Object.entries(window.pendingChatHistory)) {
          console.log(`Rendering pending chat history for ${chatId}`);
          this.renderChatHistory(messages);
        }
        delete window.pendingChatHistory;
      }
      
      // Render any pending individual messages
      if (window.pendingMessages && window.pendingMessages.length > 0) {
        console.log(`Rendering ${window.pendingMessages.length} pending messages`);
        window.pendingMessages.forEach(message => {
          this.renderMessage(message);
        });
        delete window.pendingMessages;
      }
    } catch (error) {
      console.error('Error processing pending messages:', error);
    }
  },
  
  // Render a single message with improved user handling
  renderMessage(message) {
    console.log('Rendering message:', message);
    
    try {
      const messagesContainer = document.getElementById('messages-container');
      if (!messagesContainer) {
        console.error('Messages container not found in DOM');
        return;
      }
      
      // Check if message already exists to prevent duplicates
      if (document.getElementById(`message-${message.id}`)) {
        console.log('Message already rendered, skipping:', message.id);
        return;
      }
      
      const messageElement = document.createElement('div');
      messageElement.className = 'message';
      messageElement.id = `message-${message.id}`;
      
      // Add 'own' class if the message is from the current user
      if (message.sender === Auth.getUserId()) {
        messageElement.classList.add('own');
      }
      
      const messageContent = document.createElement('div');
      messageContent.className = 'message-content';

      // Get sender username with UserModel
      let senderName = 'User';
      if (message.sender === Auth.getUserId()) {
        // If it's the current user's message, use their username directly
        senderName = Auth.getUsername() || 'You';
      } else if (message.sender === 'system') {
        senderName = 'System';
      } else {
        // Try to find the user in the users array
        const senderUser = Chat.users.find(u => u.id === message.sender);
        if (senderUser && senderUser.username) {
          senderName = senderUser.username;
        } else if (message.senderName) {
          // If the message contains sender name, use it
          senderName = message.senderName;
        } else {
          // Use UserModel to format the name if available
          senderName = UserModel.formatUserName({ id: message.sender });
        }
      }
      
      // Create message sender element
      const messageSender = document.createElement('div');
      messageSender.className = 'message-sender';
      messageSender.textContent = senderName;
      messageSender.setAttribute('data-user-id', message.sender);
      messageContent.appendChild(messageSender);

      // Show reply content if it exists
      if (message.replyTo) {
        const replyMessage = Chat.messages[message.chatId]?.find(m => m.id === message.replyTo);
        if (replyMessage) {

          const senderUser = UserModel.getUserById(message.sender);
          const senderName = senderUser.username;


          const replyUsername = senderName;

          const replyElement = document.createElement('div');
          replyElement.className = 'reply-message';
          replyElement.innerHTML = `
            <span class="reply-username">${replyUsername}:</span>
            <span class="reply-text">${replyMessage.content}</span>
          `;
          replyElement.addEventListener('click', () => {
            this.scrollToMessage(replyMessage.id);
          });
          messageContent.appendChild(replyElement);
        }
      }

      // Create message text
      const messageText = document.createElement('div');
      messageText.className = 'message-text';

      // Handle deleted messages
      if (message.deleted) {
        messageText.innerHTML = `<em>${message.content}</em>`;
        messageText.classList.add('deleted-message');
      } else {
        // Process message content for @mentions
        const mentionRegex = /@(\w+)/g;
        const processedContent = message.content.replace(mentionRegex, (match, username) => {
          const mentionedUser = Chat.users.find(u =>
            u.username.toLowerCase() === username.toLowerCase()
          );
          if (mentionedUser) {
            return `<span class="mention" data-user-id="${mentionedUser.id}">@${username}</span>`;
          }
          return match;
        });

        messageText.innerHTML = processedContent;
      }

      messageContent.appendChild(messageText);

      // Create message timestamp
      const messageTime = document.createElement('div');
      messageTime.className = 'message-time';
      messageTime.textContent = moment(message.createdAt).format('h:mm A');
      messageContent.appendChild(messageTime);

      // Create message reactions container
      const reactionsContainer = document.createElement('div');
      reactionsContainer.className = 'message-reactions';
      messageContent.appendChild(reactionsContainer);

      // Add reactions if they exist
      if (message.reactions && message.reactions.length > 0) {
        this.renderReactions(reactionsContainer, message.reactions);
      }

      // Create read status indicator if it's the user's own message
      if (message.sender === Auth.getUserId()) {
        const readStatus = document.createElement('div');
        readStatus.className = 'message-read-status';
        readStatus.id = `read-${message.id}`;

        const readCount = message.readBy ? message.readBy.length - 1 : 0; // Minus 1 because the sender already read it
        if (readCount > 0) {
          readStatus.textContent = `Read by ${readCount} ${readCount === 1 ? 'person' : 'people'}`;
        }
        messageContent.appendChild(readStatus);
      }

      // Create message actions
      const messageActions = document.createElement('div');
      messageActions.className = 'message-actions';

      // Reply button
      const replyButton = document.createElement('button');
      replyButton.innerHTML = '<i class="fas fa-reply"></i>';
      replyButton.title = 'Reply';
      replyButton.addEventListener('click', () => {
        Chat.replyToMessageFunc(message);
      });
      messageActions.appendChild(replyButton);

      // React button
      const reactButton = document.createElement('button');
      reactButton.innerHTML = '<i class="far fa-smile"></i>';
      reactButton.title = 'React';
      reactButton.addEventListener('click', (e) => {
        e.stopPropagation();

        // Show mini emoji picker for reactions
        const miniPicker = document.createElement('div');
        miniPicker.className = 'mini-emoji-picker';
        miniPicker.style.position = 'absolute';
        miniPicker.style.top = '-40px';
        miniPicker.style.left = '0';
        miniPicker.style.backgroundColor = 'var(--input-bg)';
        miniPicker.style.borderRadius = '20px';
        miniPicker.style.padding = '5px';
        miniPicker.style.display = 'flex';
        miniPicker.style.zIndex = '100';

        this.commonEmojis.slice(0, 5).forEach(emoji => {
          const emojiBtn = document.createElement('div');
          emojiBtn.style.padding = '5px';
          emojiBtn.style.cursor = 'pointer';
          emojiBtn.textContent = emoji;
          emojiBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            Chat.addReaction(message.id, emoji);
            miniPicker.remove();
          });
          miniPicker.appendChild(emojiBtn);
        });

        messageActions.appendChild(miniPicker);

        // Remove picker when clicking elsewhere
        const removePicker = (e) => {
          if (!miniPicker.contains(e.target) && e.target !== reactButton) {
            miniPicker.remove();
            document.removeEventListener('click', removePicker);
          }
        };

        document.addEventListener('click', removePicker);
      });
      messageActions.appendChild(reactButton);

      // Delete button (only for own messages)
      if (message.sender === Auth.getUserId()) {
        const deleteButton = document.createElement('button');
        deleteButton.innerHTML = '<i class="fas fa-trash-alt"></i>';
        deleteButton.title = 'Delete';
        deleteButton.addEventListener('click', () => {
          if (confirm('Are you sure you want to delete this message?')) {
            Chat.deleteMessage(message.id);
          }
        });
        messageActions.appendChild(deleteButton);
      }

      messageContent.appendChild(messageActions);
      messageElement.appendChild(messageContent);

      // Add to messages container
      messagesContainer.appendChild(messageElement);

      // Console log to confirm successful rendering
      console.log('Message rendered successfully:', message.id);
    } catch (error) {
      console.error('Error rendering message:', error);
    }
  },
  
  // Request user info when not available
  requestUserInfo(userId) {
    if (!userId || userId === 'system') return;

    // Add to a set of pending user info requests to avoid duplicates
    if (!this.pendingUserRequests) {
      this.pendingUserRequests = new Set();
    }

    // Only request if not already requested
    if (!this.pendingUserRequests.has(userId)) {
      this.pendingUserRequests.add(userId);
      console.log(`Requesting info for unknown user: ${userId}`);

      if (Chat.socket && Chat.socket.connected) {
        Chat.socket.emit('user:getInfo', { userId });
      }
    }
  },
  
  // Update user name in messages after receiving user info
  updateUserNames(user) {
    if (!user || !user.id) return;

    // Update all messages from this user
    const senderElements = document.querySelectorAll(`.message-sender[data-user-id="${user.id}"]`);
    senderElements.forEach(element => {
      element.textContent = user.username;
    });

    // Remove from pending requests
    if (this.pendingUserRequests) {
      this.pendingUserRequests.delete(user.id);
    }
  },
  
  // Render chat history with improved error handling
  renderChatHistory(messages) {
    console.log('Rendering chat history:', messages);

    try {
      const messagesContainer = document.getElementById('messages-container');
      if (!messagesContainer) {
        console.error('Messages container not found in DOM');
        return;
      }

      messagesContainer.innerHTML = '';

      if (!messages || messages.length === 0) {
        const welcomeMessage = document.createElement('div');
        welcomeMessage.className = 'welcome-message';
        welcomeMessage.innerHTML = `
          <h3>Start a new conversation</h3>
          <p>No messages here yet. Be the first to send a message!</p>
        `;
        messagesContainer.appendChild(welcomeMessage);
      } else {
        messages.forEach(message => {
          this.renderMessage(message);
        });
      }

      this.scrollToBottom();
      console.log('Chat history rendered successfully');
    } catch (error) {
      console.error('Error rendering chat history:', error);
    }
  },
  
  // Render list of users
  renderUserList(users) {
    const userList = document.getElementById('user-list');
    userList.innerHTML = '';

    users.forEach(user => {
      // Don't show current user in the list
      if (user.id === Auth.getUserId()) return;

      const userItem = document.createElement('div');
      userItem.className = 'user-list-item';
      userItem.setAttribute('data-user-id', user.id);

      const userStatus = document.createElement('div');
      userStatus.className = `user-status ${user.status?.online ? 'online' : 'offline'}`;
      userItem.appendChild(userStatus);

      const userName = document.createElement('div');
      userName.className = 'user-name';
      userName.textContent = user.username;
      userItem.appendChild(userName);

      if (user.isAdmin) {
        const adminBadge = document.createElement('span');
        adminBadge.className = 'admin-badge';
        adminBadge.textContent = 'Admin';
        userItem.appendChild(adminBadge);
      }

      userItem.addEventListener('click', () => {
        this.showUserInfoModal(user);
      });

      userList.appendChild(userItem);
    });
  },
  
  // Render chat list
  renderChatList(chats, activeChatId) {
    const chatList = document.getElementById('chat-list');
    chatList.innerHTML = '';

    // Add general chat first
    const generalChat = {
      id: 'general',
      name: 'General',
      isPrivate: false
    };
    this.addChatToList(generalChat, activeChatId === 'general');

    // Add user's chats
    chats.forEach(chat => {
      if (chat.id !== 'general') {
        this.addChatToList(chat, chat.id === activeChatId);
      }
    });
  },
  
  // Add a chat to the list
  addChatToList(chat, isActive = false) {
    const chatList = document.getElementById('chat-list');

    const chatItem = document.createElement('div');
    chatItem.className = `chat-item ${isActive ? 'active' : ''}`;
    chatItem.setAttribute('data-chat-id', chat.id);

    const chatAvatar = document.createElement('div');
    chatAvatar.className = 'chat-item-avatar';

    if (chat.isPrivate) {
      // For direct chats, show the other user's initial
      const otherUserId = chat.participants.find(id => id !== Auth.getUserId());
      const otherUser = Chat.users.find(user => user.id === otherUserId);
      if (otherUser) {
        chatAvatar.textContent = otherUser.username.charAt(0).toUpperCase();
      } else {
        chatAvatar.innerHTML = '<i class="fas fa-user"></i>';
      }
    } else {
      chatAvatar.innerHTML = '<i class="fas fa-users"></i>';
    }

    chatItem.appendChild(chatAvatar);

    const chatInfo = document.createElement('div');
    chatInfo.className = 'chat-item-info';

    const chatName = document.createElement('div');
    chatName.className = 'chat-item-name';

    if (chat.isPrivate) {
      // For direct chats, show the other user's name
      const otherUserId = chat.participants.find(id => id !== Auth.getUserId());
      
      const otherUser = UserModel.getUserById(otherUserId);
      console.log('Other user:', otherUser);
      chatName.textContent = otherUser?.username;
    } else {
      chatName.textContent = chat.name;
    }

    chatInfo.appendChild(chatName);

    const lastMessage = document.createElement('div');
    lastMessage.className = 'chat-item-last-message';
    lastMessage.textContent = 'No messages yet';
    chatInfo.appendChild(lastMessage);

    chatItem.appendChild(chatInfo);

    chatItem.addEventListener('click', () => {
      Chat.joinChat(chat.id);
    });

    chatList.appendChild(chatItem);
  },
  
  // Set active chat in UI
  setActiveChat(chatId) {
    // Update chat header
    const chatHeader = document.getElementById('chat-header').querySelector('h2');

    // Find chat name
    if (chatId === 'general') {
      chatHeader.textContent = 'General Chat';
    } else {
      const chat = Chat.chats.find(c => c.id === chatId);
      if (chat) {
        if (chat.isPrivate) {
          const otherUserId = chat.participants.find(id => id !== Auth.getUserId());
          const otherUser = Chat.users.find(user => user.id === otherUserId);
          chatHeader.textContent = otherUser ? `Chat with ${otherUser.username}` : 'Private Chat';
        } else {
          chatHeader.textContent = chat.name;
        }
      } else {
        chatHeader.textContent = 'Chat';
      }
    }

    // Update active chat in list
    const chatItems = document.querySelectorAll('.chat-item');
    chatItems.forEach(item => {
      item.classList.remove('active');
      if (item.getAttribute('data-chat-id') === chatId) {
        item.classList.add('active');
      }
    });
  },
  
  // Show user typing indicator
  showTypingIndicator(username) {
    const typingElement = document.getElementById('users-typing');
    typingElement.textContent = `${username} is typing...`;
  },
  
  // Hide typing indicator
  hideTypingIndicator() {
    const typingElement = document.getElementById('users-typing');
    typingElement.textContent = '';
  },
  
  // Update user status in UI
  updateUserStatus(userId, status) {
    const userItem = document.querySelector(`.user-list-item[data-user-id="${userId}"]`);
    if (userItem) {
      const statusElement = userItem.querySelector('.user-status');
      statusElement.className = `user-status ${status.online ? 'online' : 'offline'}`;
    }
  },
  
  // Show reply preview
  showReplyPreview(message) {
    const replyPreview = document.getElementById('reply-preview');
    const replyUsername = document.getElementById('reply-username');
    const replyText = document.getElementById('reply-text');

    const user = Chat.users.find(u => u.id === message.sender);
    replyUsername.textContent =  user?.username;
    replyText.textContent = message.content;

    replyPreview.style.display = 'flex';
  },
  
  // Hide reply preview
  hideReplyPreview() {
    const replyPreview = document.getElementById('reply-preview');
    replyPreview.style.display = 'none';
  },
  
  // Render reactions for a message
  renderReactions(container, reactions) {
    container.innerHTML = '';

    // Group reactions by emoji
    const groupedReactions = {};
    reactions.forEach(reaction => {
      if (!groupedReactions[reaction.emoji]) {
        groupedReactions[reaction.emoji] = [];
      }
      groupedReactions[reaction.emoji].push(reaction.userId);
    });

    // Create reaction elements
    Object.keys(groupedReactions).forEach(emoji => {
      const reactionElement = document.createElement('div');
      reactionElement.className = 'reaction';

      // Add 'active' class if current user reacted with this emoji
      if (groupedReactions[emoji].includes(Auth.getUserId())) {
        reactionElement.classList.add('active');
      }

      reactionElement.innerHTML = `
        ${emoji} <span class="reaction-count">${groupedReactions[emoji].length}</span>
      `;

      container.appendChild(reactionElement);
    });
  },
  
  // Update reactions for a message
  updateMessageReactions(messageId, reactions) {
    const messageElement = document.getElementById(`message-${messageId}`);
    if (messageElement) {
      const reactionsContainer = messageElement.querySelector('.message-reactions');
      this.renderReactions(reactionsContainer, reactions);
    }
  },
  
  // Update read receipt for a message
  updateReadReceipt(messageId, readBy) {
    const readStatus = document.getElementById(`read-${messageId}`);
    if (readStatus) {
      const readCount = readBy.length - 1; // Minus 1 because the sender already read it
      if (readCount > 0) {
        readStatus.textContent = `Read by ${readCount} ${readCount === 1 ? 'person' : 'people'}`;
      } else {
        readStatus.textContent = '';
      }
    }
  },
  
  // Update deleted message in UI
  updateDeletedMessage(messageId, content) {
    const messageElement = document.getElementById(`message-${messageId}`);
    if (messageElement) {
      const messageText = messageElement.querySelector('.message-text');
      messageText.innerHTML = `<em>${content}</em>`;
      messageText.classList.add('deleted-message');
    }
  },
  
  // Scroll to bottom of messages container
  scrollToBottom() {
    const messagesContainer = document.getElementById('messages-container');
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    this.isScrolledUp = false;
  },
  
  // Scroll to bottom if user was already at bottom
  scrollToBottomIfNeeded() {
    if (!this.isScrolledUp) {
      this.scrollToBottom();
    }
  },
  
  // Scroll to specific message and highlight it
  scrollToMessage(messageId) {
    const messageElement = document.getElementById(`message-${messageId}`);
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      messageElement.classList.add('message-highlighted');

      // Remove highlight after animation completes
      setTimeout(() => {
        messageElement.classList.remove('message-highlighted');
      }, 2000);
    }
  },
  
  // Show user info modal
  showUserInfoModal(user) {
    const modal = document.getElementById('user-info-modal');
    const username = document.getElementById('modal-username');
    const statusBadge = document.getElementById('modal-status');
    const lastSeen = document.getElementById('modal-last-seen');
    const directMessageBtn = document.getElementById('send-direct-message');

    username.textContent = user.username;

    if (user.status?.online) {
      statusBadge.textContent = 'Online';
      statusBadge.style.backgroundColor = 'var(--online-color)';
      lastSeen.textContent = 'Active now';
    } else {
      statusBadge.textContent = 'Offline';
      statusBadge.style.backgroundColor = 'var(--offline-color)';
      lastSeen.textContent = `Last seen: ${moment(user.status?.lastSeen).fromNow()}`;
    }

    directMessageBtn.setAttribute('data-user-id', user.id);

    modal.style.display = 'flex';
  },
  
  // Show notification with improved implementation
  showNotification(message, type = 'success') {
    console.log(`Notification (${type}):`, message);

    // Create notification element if it doesn't exist
    let notification = document.querySelector('.notification-container');

    if (!notification) {
      notification = document.createElement('div');
      notification.className = 'notification-container';
      notification.style.position = 'fixed';
      notification.style.top = '20px';
      notification.style.right = '20px';
      notification.style.zIndex = '9999';
      document.body.appendChild(notification);
    }

    // Create the notification message
    const notif = document.createElement('div');
    notif.className = `notification ${type}`;
    notif.style.backgroundColor = type === 'success' ? 'var(--primary-color)' : '#ff4757';
    notif.style.color = 'white';
    notif.style.padding = '10px 15px';
    notif.style.borderRadius = '4px';
    notif.style.marginBottom = '10px';
    notif.style.boxShadow = '0 2px 5px var(--shadow-color)';
    notif.style.transform = 'translateX(100%)';
    notif.style.opacity = '0';
    notif.style.transition = 'all 0.3s ease';
    notif.textContent = message;

    // Add to container
    notification.appendChild(notif);

    // Show with animation
    setTimeout(() => {
      notif.style.transform = 'translateX(0)';
      notif.style.opacity = '1';
    }, 100);

    // Remove after timeout
    setTimeout(() => {
      notif.style.transform = 'translateX(100%)';
      notif.style.opacity = '0';
      setTimeout(() => {
        notif.remove();
      }, 300);
    }, 3000);
  },
  
  // Show search results
  showSearchResults(results) {
    const messagesContainer = document.getElementById('messages-container');
    messagesContainer.innerHTML = '';

    if (results.length === 0) {
      const noResults = document.createElement('div');
      noResults.className = 'welcome-message';
      noResults.innerHTML = `
        <h3>No Results Found</h3>
        <p>No messages match your search query.</p>
        <button id="back-to-chat" class="action-button">
          Back to chat
        </button>
      `;
      messagesContainer.appendChild(noResults);

      document.getElementById('back-to-chat').addEventListener('click', () => {
        Chat.joinChat(Chat.currentChatId);
      });
    } else {
      const searchHeader = document.createElement('div');
      searchHeader.className = 'welcome-message';
      searchHeader.innerHTML = `
        <h3>Search Results</h3>
        <p>Found ${results.length} matching messages.</p>
        <button id="back-to-chat" class="action-button">
          Back to chat
        </button>
      `;
      messagesContainer.appendChild(searchHeader);

      document.getElementById('back-to-chat').addEventListener('click', () => {
        Chat.joinChat(Chat.currentChatId);
      });

      results.forEach(message => {
        this.renderMessage(message);
      });
    }
  },
  
  // Show connections list for admins
  showConnectionsList(connections) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';

    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';

    modalContent.innerHTML = `
      <div class="modal-header">
        <h2>Active Connections</h2>
        <span class="close-modal">&times;</span>
      </div>
      <div class="modal-body">
        <table style="width:100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th style="text-align: left; padding: 8px; border-bottom: 1px solid var(--border-color);">Username</th>
              <th style="text-align: left; padding: 8px; border-bottom: 1px solid var(--border-color);">User ID</th>
              <th style="text-align: left; padding: 8px; border-bottom: 1px solid var(--border-color);">Socket ID</th>
            </tr>
          </thead>
          <tbody>
            ${connections.map(connection => `
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid var(--border-color);">${connection.username || 'Unknown'}</td>
                <td style="padding: 8px; border-bottom: 1px solid var(--border-color);">${connection.userId}</td>
                <td style="padding: 8px; border-bottom: 1px solid var(--border-color);">${connection.socketId}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    const closeBtn = modalContent.querySelector('.close-modal');
    closeBtn.addEventListener('click', () => {
      modal.remove();
    });

    window.addEventListener('click', (event) => {
      if (event.target === modal) {
        modal.remove();
      }
    });
  },
  
  // Create connection status indicator
  createConnectionIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'connection-indicator';
    indicator.className = 'connection-status offline';
    indicator.innerHTML = '<span class="status-dot"></span><span class="status-text">Offline</span>';
    indicator.style.position = 'fixed';
    indicator.style.top = '10px';
    indicator.style.right = '10px';
    indicator.style.padding = '5px 10px';
    indicator.style.borderRadius = '15px';
    indicator.style.backgroundColor = 'rgba(0,0,0,0.7)';
    indicator.style.color = 'white';
    indicator.style.fontSize = '12px';
    indicator.style.display = 'flex';
    indicator.style.alignItems = 'center';
    indicator.style.gap = '5px';
    indicator.style.zIndex = '9999';
    indicator.style.transition = 'opacity 0.3s ease';
    indicator.style.cursor = 'pointer';

    // Add click handler to show connection details
    indicator.addEventListener('click', () => {
      const connected = Chat.socket?.connected || false;
      const socketId = Chat.socket?.id || 'Not connected';
      const info = `Connection status: ${connected ? 'Connected' : 'Disconnected'}
Socket ID: ${socketId}
Chat room: ${Chat.currentChatId || 'None'}`;
      alert(info);
    });

    // Add status dot styles
    const style = document.createElement('style');
    style.textContent = `
      .connection-status .status-dot {
        display: inline-block;
        width: 8px;
        height: 8px;
        border-radius: 50%;
      }
      .connection-status.online .status-dot {
        background-color: #44b700;
        box-shadow: 0 0 0 2px rgba(68, 183, 0, 0.2);
      }
      .connection-status.offline .status-dot {
        background-color: #ff4757;
        box-shadow: 0 0 0 2px rgba(255, 71, 87, 0.2);
      }
      .connection-status.connecting .status-dot {
        background-color: #f1c40f;
        box-shadow: 0 0 0 2px rgba(241, 196, 15, 0.2);
        animation: pulse 1.5s infinite;
      }
      @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.4; }
        100% { opacity: 1; }
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(indicator);

    // Initial status
    this.updateConnectionStatus(false, 'Connecting...');
  },
  
  // Update connection status indicator
  updateConnectionStatus(connected, message = null) {
    const indicator = document.getElementById('connection-indicator');
    if (!indicator) return;

    if (connected) {
      indicator.className = 'connection-status online';
      indicator.querySelector('.status-text').textContent = 'Online';

      // Auto-hide after 5 seconds when connected
      setTimeout(() => {
        indicator.style.opacity = '0.5';
      }, 5000);
    } else {
      indicator.style.opacity = '1';

      if (message && message.toLowerCase().includes('connect')) {
        indicator.className = 'connection-status connecting';
        indicator.querySelector('.status-text').textContent = message || 'Connecting...';
      } else {
        indicator.className = 'connection-status offline';
        indicator.querySelector('.status-text').textContent = message || 'Offline';
      }
    }
  },
  
  // Create user statistics container in sidebar
  createUserStatsContainer() {
    const sidebarFooter = document.querySelector('.sidebar-footer');
    if (!sidebarFooter) return;

    // Create stats container above the footer
    const statsContainer = document.createElement('div');
    statsContainer.className = 'user-stats-container';
    statsContainer.innerHTML = `
      <div class="stats-header">User Statistics</div>
      <div class="stats-content">
        <div class="stat-item">
          <span class="stat-label">Total Users:</span>
          <span class="stat-value" id="total-users">-</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Online:</span>
          <span class="stat-value" id="online-users">-</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Offline:</span>
          <span class="stat-value" id="offline-users">-</span>
        </div>
      </div>
    `;

    // Insert before sidebar footer
    sidebarFooter.parentNode.insertBefore(statsContainer, sidebarFooter);

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      .user-stats-container {
        padding: 15px;
        border-top: 1px solid var(--border-color);
        font-size: 12px;
      }
      
      .stats-header {
        font-weight: 500;
        margin-bottom: 8px;
        color: var(--text-color);
      }
      
      .stats-content {
        display: flex;
        flex-direction: column;
        gap: 5px;
      }
      
      .stat-item {
        display: flex;
        justify-content: space-between;
      }
      
      .stat-label {
        color: var(--text-light);
      }
      
      .stat-value {
        font-weight: 500;
      }
    `;
    document.head.appendChild(style);
  },
  
  // Update user statistics in UI
  updateUserStats(stats) {
    if (!stats) return;

    const totalElement = document.getElementById('total-users');
    const onlineElement = document.getElementById('online-users');
    const offlineElement = document.getElementById('offline-users');

    if (totalElement) totalElement.textContent = stats.total;
    if (onlineElement) onlineElement.textContent = stats.online;
    if (offlineElement) offlineElement.textContent = stats.offline;
  },
  
  // Process any callbacks that were queued before UI was initialized
  processCallbackQueue() {
    if (window.uiCallbackQueue && window.uiCallbackQueue.length) {
      console.log(`Processing ${window.uiCallbackQueue.length} queued UI callbacks`);
      
      // Process all callbacks in the queue
      window.uiCallbackQueue.forEach(callback => {
        try {
          callback(this);
        } catch (error) {
          console.error('Error processing queued UI callback:', error);
        }
      });
      
      // Clear the queue
      window.uiCallbackQueue = [];
    }
  },
};

// Initialize UI when page loads
document.addEventListener('DOMContentLoaded', () => {
  if (typeof Auth !== 'undefined' && Auth.isLoggedIn()) {
    UI.init();
    // Announce UI is ready
    window.UIReady = true;
    console.log('UI initialized and ready');
    
    // Process any queued callbacks
    if (window.uiCallbackQueue && window.uiCallbackQueue.length) {
      console.log(`Processing ${window.uiCallbackQueue.length} queued UI callbacks`);
      
      // Process all callbacks in the queue
      window.uiCallbackQueue.forEach(callback => {
        try {
          callback(UI);
        } catch (error) {
          console.error('Error processing queued UI callback:', error);
        }
      });
      
      // Clear the queue
      window.uiCallbackQueue = [];
    }
  }
});
