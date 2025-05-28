document.getElementById('loginForm').addEventListener('submit', function(e) {
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

  // In a real application, you would validate credentials against a server
  // For demo purposes, we'll simulate a successful login
  console.log("Login attempted with:", email, password);
  
  // Simulate login success
  const userData = {
    email: email,
    loginTime: new Date().toISOString(),
    isLoggedIn: true
  };

  localStorage.setItem('currentUser', JSON.stringify(userData));
  localStorage.setItem('isLoggedIn', 'true');

  alert("Login successful! Redirecting to dashboard...");

  // Redirect to dashboard
  window.location.href = "../dashboard/dashboard.html";
});

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function showError(message) {
  const form = document.getElementById('loginForm');
  const existingError = document.querySelector('.error-message');
  
  if (existingError) {
    existingError.remove();
  }
  
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.textContent = message;
  errorDiv.style.color = '#ff6b6b';
  errorDiv.style.fontSize = '12px';
  errorDiv.style.marginTop = '10px';
  errorDiv.style.textAlign = 'center';
  
  form.appendChild(errorDiv);
}

// Check if user is already logged in
window.addEventListener('load', function() {
  const isLoggedIn = localStorage.getItem('isLoggedIn');
  
  if (isLoggedIn === 'true') {
    window.location.href = "../dashboard/dashboard.html";
  }
});