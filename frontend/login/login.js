// login.js - Updated with backend integration
const API_BASE_URL = 'http://localhost:3000/api';

document.getElementById('loginForm').addEventListener('submit', async function(e) {
  e.preventDefault();

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();

  if (!email || !password) {
    showError("Please fill out both fields.");
    return;
  }

  // Basic email validation
  if (!isValidEmail(email)) {
    showError("Please enter a valid email address.");
    return;
  }

  // Show loading state
  const submitButton = document.querySelector('button[type="submit"]');
  const originalText = submitButton.textContent;
  submitButton.textContent = 'Logging in...';
  submitButton.disabled = true;

  try {
    // Call backend login API
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        password: password
      })
    });

    const data = await response.json();

    if (response.ok) {
      // Login successful
      console.log("Login successful:", data);
      
      // Store user data in localStorage
      const userData = {
        ...data.user,
        loginTime: new Date().toISOString(),
        isLoggedIn: true
      };

      localStorage.setItem('currentUser', JSON.stringify(userData));
      localStorage.setItem('isLoggedIn', 'true');

      // Show success message
      showSuccess("Login successful! Redirecting to dashboard...");

      // Redirect based on user type
      setTimeout(() => {
        if (userData.isMinor) {
          window.location.href = "../dashboard/dashboard.html";
        } else {
          // Adult user - check if they have children to manage
          window.location.href = "../dashboard/dashboard.html";
        }
      }, 1500);

    } else {
      // Login failed
      console.error("Login failed:", data);
      showError(data.error || data.message || "Login failed. Please try again.");
    }

  } catch (error) {
    console.error("Login error:", error);
    showError("Network error. Please check your connection and try again.");
  } finally {
    // Reset button state
    submitButton.textContent = originalText;
    submitButton.disabled = false;
  }
});

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function showError(message) {
  const form = document.getElementById('loginForm');
  const existingMessage = document.querySelector('.message');
  
  if (existingMessage) {
    existingMessage.remove();
  }
  
  const messageDiv = document.createElement('div');
  messageDiv.className = 'message error-message';
  messageDiv.textContent = message;
  messageDiv.style.cssText = `
    color: #ff6b6b;
    fontSize: 14px;
    marginTop: 15px;
    textAlign: center;
    padding: 10px;
    backgroundColor: rgba(255, 107, 107, 0.1);
    borderRadius: 6px;
    border: 1px solid rgba(255, 107, 107, 0.3);
  `;
  
  form.appendChild(messageDiv);
  
  // Auto-remove error after 5 seconds
  setTimeout(() => {
    if (messageDiv.parentNode) {
      messageDiv.remove();
    }
  }, 5000);
}

function showSuccess(message) {
  const form = document.getElementById('loginForm');
  const existingMessage = document.querySelector('.message');
  
  if (existingMessage) {
    existingMessage.remove();
  }
  
  const messageDiv = document.createElement('div');
  messageDiv.className = 'message success-message';
  messageDiv.textContent = message;
  messageDiv.style.cssText = `
    color: #4caf50;
    fontSize: 14px;
    marginTop: 15px;
    textAlign: center;
    padding: 10px;
    backgroundColor: rgba(76, 175, 80, 0.1);
    borderRadius: 6px;
    border: 1px solid rgba(76, 175, 80, 0.3);
  `;
  
  form.appendChild(messageDiv);
}

// Check if user is already logged in
window.addEventListener('load', function() {
  const isLoggedIn = localStorage.getItem('isLoggedIn');
  
  if (isLoggedIn === 'true') {
    const userData = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (userData.isMinor) {
      window.location.href = "../dashboard/dashboard.html";
    } else {
      window.location.href = "../dashboard/dashboard.html";
    }
  }
});

// Test backend connection on page load
async function testBackendConnection() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (response.ok) {
      console.log("✅ Backend connection successful");
    } else {
      console.warn("⚠️ Backend health check failed");
    }
  } catch (error) {
    console.error("❌ Backend connection failed:", error);
    showError("Unable to connect to server. Please try again later.");
  }
}

// Test connection when page loads
testBackendConnection();

