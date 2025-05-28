// Age verification and guardian section handling
document.getElementById('birthdate').addEventListener('change', function() {
  const birthdate = new Date(this.value);
  const today = new Date();
  const age = today.getFullYear() - birthdate.getFullYear();
  
  // Check if birthday has occurred this year
  const monthDiff = today.getMonth() - birthdate.getMonth();
  const dayDiff = today.getDate() - birthdate.getDate();
  
  const actualAge = (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) ? age - 1 : age;
  
  const guardianSection = document.getElementById('guardianSection');
  const ageConfirm = document.getElementById('ageConfirm');
  
  if (actualAge < 13) {
    alert('You must be at least 13 years old to create an account.');
    this.value = '';
    return;
  }
  
  if (actualAge < 18) {
    guardianSection.classList.add('show');
    // Make guardian fields required
    document.getElementById('guardianName').required = true;
    document.getElementById('guardianEmail').required = true;
    document.getElementById('guardianPhone').required = true;
  } else {
    guardianSection.classList.remove('show');
    // Remove required attribute from guardian fields
    document.getElementById('guardianName').required = false;
    document.getElementById('guardianEmail').required = false;
    document.getElementById('guardianPhone').required = false;
  }
});

// Form submission handling
document.getElementById('signupForm').addEventListener('submit', function(e) {
  e.preventDefault();

  // Get form values
  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const birthdate = document.getElementById('birthdate').value;
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  const ageConfirm = document.getElementById('ageConfirm').checked;
  const termsAgree = document.getElementById('termsAgree').checked;
  
  // Guardian info (if applicable)
  const guardianName = document.getElementById('guardianName').value.trim();
  const guardianEmail = document.getElementById('guardianEmail').value.trim();
  const guardianPhone = document.getElementById('guardianPhone').value.trim();

  // Validation
  if (!name || !email || !birthdate || !password || !confirmPassword) {
    alert("Please fill out all required fields.");
    return;
  }

  if (!ageConfirm) {
    alert("Please confirm that you are 13 years or older.");
    return;
  }

  if (!termsAgree) {
    alert("Please agree to the Terms & Conditions.");
    return;
  }

  if (password !== confirmPassword) {
    alert("Passwords do not match.");
    return;
  }

  if (password.length < 8) {
    alert("Password must be at least 8 characters long.");
    return;
  }

  // Check if guardian info is required
  const birthDate = new Date(birthdate);
  const today = new Date();
  const age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  const dayDiff = today.getDate() - birthDate.getDate();
  const actualAge = (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) ? age - 1 : age;

  if (actualAge < 18) {
    if (!guardianName || !guardianEmail || !guardianPhone) {
      alert("Guardian information is required for users under 18.");
      return;
    }
    
    // Validate guardian email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(guardianEmail)) {
      alert("Please enter a valid guardian email address.");
      return;
    }
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    alert("Please enter a valid email address.");
    return;
  }

  // Create user object
  const userData = {
    name: name,
    email: email,
    birthdate: birthdate,
    age: actualAge,
    password: password, // In real app, this would be hashed
    guardian: actualAge < 18 ? {
      name: guardianName,
      email: guardianEmail,
      phone: guardianPhone
    } : null,
    createdAt: new Date().toISOString()
  };

  // Store in localStorage for now (in real app, send to backend)
  const existingUsers = JSON.parse(localStorage.getItem('users') || '[]');
  
  // Check if email already exists
  if (existingUsers.some(user => user.email === email)) {
    alert("An account with this email already exists.");
    return;
  }

  existingUsers.push(userData);
  localStorage.setItem('users', JSON.stringify(existingUsers));

  console.log("Signup successful:", userData);
  
  if (actualAge < 18) {
    alert("Account created successfully! A verification email has been sent to your guardian. Please check your email to complete the registration.");
  } else {
    alert("Account created successfully! Please check your email to verify your account.");
  }

  // Redirect to login page
  window.location.href = "../login/login.html";
});

// Password strength indicator (optional enhancement)
document.getElementById('password').addEventListener('input', function() {
  const password = this.value;
  const strength = calculatePasswordStrength(password);
  // You can add visual feedback for password strength here
});

function calculatePasswordStrength(password) {
  let strength = 0;
  if (password.length >= 8) strength++;
  if (/[a-z]/.test(password)) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;
  return strength;
}