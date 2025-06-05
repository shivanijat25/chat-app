document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const loginToggle = document.getElementById('login-toggle');
  const registerToggle = document.getElementById('register-toggle');
  const errorMessage = document.getElementById('error-message');
  const passwordToggles = document.querySelectorAll('.toggle-password');

  // Handle form toggle (login/register)
  loginToggle.addEventListener('click', () => {
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
    loginToggle.classList.add('active');
    registerToggle.classList.remove('active');
    errorMessage.textContent = '';
  });

  registerToggle.addEventListener('click', () => {
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
    loginToggle.classList.remove('active');
    registerToggle.classList.add('active');
    errorMessage.textContent = '';
  });

  // Handle password visibility toggle
  passwordToggles.forEach(toggle => {
    toggle.addEventListener('click', () => {
      const passwordInput = toggle.previousElementSibling;
      
      if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggle.classList.replace('fa-eye-slash', 'fa-eye');
      } else {
        passwordInput.type = 'password';
        toggle.classList.replace('fa-eye', 'fa-eye-slash');
      }
    });
  });

  // Handle login form submission
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    
    if (!username || !password) {
      showError('Please enter both username and password');
      return;
    }
    
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
          // Save user data to localStorage
          localStorage.setItem('currentUser', JSON.stringify(data.user));
          
          // Redirect to main page
          window.location.href = '/';
        } else {
          showError(data.message || 'Invalid username or password');
        }
      })
      .catch(error => {
        console.error('Login error:', error);
        showError('An error occurred during login. Please try again.');
      });
  });

  // Handle register form submission
  registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;
    
    if (!username || !password) {
      showError('Please fill in all fields');
      return;
    }
    
    if (password !== confirmPassword) {
      showError('Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      showError('Password must be at least 6 characters long');
      return;
    }
    
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
          // Save user data to localStorage
          localStorage.setItem('currentUser', JSON.stringify(data.user));
          
          // Redirect to main page
          window.location.href = '/';
        } else {
          showError(data.message || 'Registration failed');
        }
      })
      .catch(error => {
        console.error('Registration error:', error);
        showError('An error occurred during registration. Please try again.');
      });
  });

  // Function to show error message
  function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.opacity = 1;
    
    // Fade out after 5 seconds
    setTimeout(() => {
      errorMessage.style.opacity = 0;
    }, 5000);
  }

  // Check if user is already logged in
  const storedUser = localStorage.getItem('currentUser');
  if (storedUser) {
    try {
      const user = JSON.parse(storedUser);
      if (user && user.id) {
        // User is already logged in, redirect to main page
        window.location.href = '/';
      }
    } catch (e) {
      console.error('Error parsing stored user data', e);
      localStorage.removeItem('currentUser');
    }
  }
});
