document.getElementById('signupForm').addEventListener('submit', function(e) {
  e.preventDefault();

  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const birthdate = document.getElementById('birthdate').value;
  const guardianEmail = document.getElementById('guardianEmail').value.trim();
  const password = document.getElementById('password').value.trim();
  const confirmPassword = document.getElementById('confirmPassword').value.trim();
  const termsAccepted = document.getElementById('terms').checked;

  // Clear previous error messages
  clearErrors();

  // Validation
  if (!name || !email || !birthdate || !password || !confirmPassword) {
    showError('Please fill out all required fields.');
    return;
  }

  if (!termsAccepted) {
    showError('Please accept the Terms and Conditions.');
    return;
  }

  if (password !== confirmPassword) {
    showError('Passwords do not match.');
    return;
  }

  if (password.length < 6) {
    showError('Password must be at least 6 characters long.');
    return;
  }

  const age = calculateAge(birthdate);
  
  if (age < 13) {
    showError('You must be at least 13 years old to create an account.');
    return;
  }

  if (age < 18 && !guardianEmail) {
    showError('Guardian email is required for users under 18.');
    return;
  }

  // Store user data (in a real app, this would be sent to a server)
  const userData = {
    name,
    email,
    birthdate,
    age,
    guardianEmail: age < 18 ? guardianEmail : null,
    isMinor: age < 18,
    createdAt: new Date().toISOString()
  };

  // Simulate saving to localStorage for demo purposes
  localStorage.setItem('userData', JSON.stringify(userData));
  localStorage.setItem('isLoggedIn', 'true');

  console.log("Signup attempted with:", userData);
  alert("Signup successful! Redirecting to dashboard...");

  // Redirect to dashboard
  window.location.href = "../dashboard/dashboard.html";
});

// Check age and show/hide guardian email field
document.getElementById('birthdate').addEventListener('change', function() {
  const birthdate = this.value;
  const age = calculateAge(birthdate);
  const guardianGroup = document.getElementById('guardianEmailGroup');
  const signupBox = document.querySelector('.signup-box');
  
  // Remove existing age warning
  const existingWarning = document.querySelector('.age-warning');
  if (existingWarning) {
    existingWarning.remove();
  }

  if (age < 18 && age >= 13) {
    guardianGroup.style.display = 'block';
    guardianGroup.querySelector('input').required = true;
    
    // Show age warning
    const warning = document.createElement('div');
    warning.className = 'age-warning';
    warning.textContent = 'Since you are under 18, we require a guardian\'s email address for account verification.';
    signupBox.insertBefore(warning, document.getElementById('signupForm'));
  } else {
    guardianGroup.style.display = 'none';
    guardianGroup.querySelector('input').required = false;
  }
});

function calculateAge(birthdate) {
  const today = new Date();
  const birth = new Date(birthdate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDifference = today.getMonth() - birth.getMonth();
  
  if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
}

function showError(message) {
  const form = document.getElementById('signupForm');
  const existingError = document.querySelector('.error-message');
  
  if (existingError) {
    existingError.remove();
  }
  
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.textContent = message;
  
  form.appendChild(errorDiv);
}

function clearErrors() {
  const errorMessages = document.querySelectorAll('.error-message');
  errorMessages.forEach(error => error.remove());
}