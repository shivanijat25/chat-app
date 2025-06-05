// Add settings link to navigation
function setupNavigation() {
  const nav = document.querySelector('nav') || document.createElement('nav');
  
  // Add settings link
  const settingsLink = document.createElement('a');
  settingsLink.href = '/settings';
  settingsLink.textContent = 'Settings';
  settingsLink.classList.add('nav-link');
  nav.appendChild(settingsLink);
  
  // Check if nav is already in the document
  if (!document.body.contains(nav)) {
    document.querySelector('header').appendChild(nav);
  }
}

// Call this function when the page loads
document.addEventListener('DOMContentLoaded', () => {
  // ...existing initialization code...
  
  setupNavigation();
});

// ...existing code...