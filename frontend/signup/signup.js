 document.getElementById('signupForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const birthdate = document.getElementById('birthdate').value;
    const guardianEmail = document.getElementById('guardianEmail').value.trim();
    const password = document.getElementById('password').value.trim();
    const confirmPassword = document.getElementById('confirmPassword').value.trim();
    const termsAccepted = document.getElementById('terms').checked;

    clearErrors();

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

    if (age < 18) {
        if (!guardianEmail) {
            showError('Guardian email is required for users under 18.');
            return;
        }
        if (email.toLowerCase() === guardianEmail.toLowerCase()) {
            showError('Guardian email must be different from your own email.');
            return;
        }

        const key = `approval_${name}_${guardianEmail}`;
        const approvalStatus = localStorage.getItem(key);

        if (approvalStatus !== 'approved') {
            sendApprovalEmail(name, guardianEmail);
            localStorage.setItem('pendingSignup', JSON.stringify({
                name, email, birthdate, password, age
            }));
            alert("Approval request sent to guardian. Please wait for their response.");
            return;
        }
    }

    completeSignup(name, email, birthdate, guardianEmail, password, age, age < 18);
  });

  document.getElementById('birthdate').addEventListener('change', function () {
    const birthdate = this.value;
    if (!birthdate) return;

    const age = calculateAge(birthdate);
    const guardianGroup = document.getElementById('guardianEmailGroup');
    const signupContainer = document.querySelector('.signup-container');

    const existingWarning = document.querySelector('.age-warning');
    if (existingWarning) existingWarning.remove();

    if (age < 18 && age >= 13) {
        guardianGroup.style.display = 'block';
        guardianGroup.querySelector('input').required = true;

        const warning = document.createElement('div');
        warning.className = 'age-warning';
        warning.textContent = 'Since you are under 18, parental verification is required. You will be redirected to complete age verification after submitting this form.';
        signupContainer.insertBefore(warning, document.getElementById('signupForm'));
    } else {
        guardianGroup.style.display = 'none';
        guardianGroup.querySelector('input').required = false;
    }
  });

  document.addEventListener('DOMContentLoaded', function () {
    const urlParams = new URLSearchParams(window.location.search);
    const verificationSuccess = urlParams.get('verificationSuccess');
    const guardianEmail = urlParams.get('guardianEmail');

    if (verificationSuccess === 'true' && guardianEmail) {
        const pendingSignup = JSON.parse(sessionStorage.getItem('pendingSignup'));
        if (pendingSignup) {
            completeSignup(
                pendingSignup.name,
                pendingSignup.email,
                pendingSignup.birthdate,
                guardianEmail,
                pendingSignup.password,
                pendingSignup.age,
                true
            );
            sessionStorage.removeItem('pendingSignup');
        }
    }
  });

  function completeSignup(name, email, birthdate, guardianEmail, password, age, isMinor) {
    const userData = {
        name,
        email,
        birthdate,
        age,
        guardianEmail: isMinor ? guardianEmail : null,
        isMinor,
        createdAt: new Date().toISOString()
    };

    localStorage.setItem('userData', JSON.stringify(userData));
    localStorage.setItem('isLoggedIn', 'true');

    alert("Signup successful! Redirecting to dashboard...");
    window.location.href = "../dashboard/dashboard.html";
  }

  function calculateAge(birthdate) {
    const today = new Date();
    const birth = new Date(birthdate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age;
  }

  function showError(message) {
    const form = document.getElementById('signupForm');
    const existingError = document.querySelector('.error-message');
    if (existingError) existingError.remove();

    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.color = 'red';
    errorDiv.textContent = message;
    form.appendChild(errorDiv);
  }

  function clearErrors() {
    const errorMessages = document.querySelectorAll('.error-message');
    errorMessages.forEach(error => error.remove());
  }

  function sendApprovalEmail(childName, guardianEmail) {
    emailjs.send("YOUR_SERVICE_ID", "YOUR_TEMPLATE_ID", {
      to_email: guardianEmail,
      child_name: childName,
      approval_form_link: "http://yourdomain.com/signup/guardian-approval.html?id=" + encodeURIComponent(`${childName}_${guardianEmail}`)
    })
    .then(() => {
      console.log("Approval request sent successfully.");
    })
    .catch(error => {
      console.error("EmailJS error:", error);
      alert("Failed to send email. Please try again.");
    });
  }

  function checkGuardianApproval(childName, guardianEmail) {
    const key = `approval_${childName}_${guardianEmail}`;
    const status = localStorage.getItem(key);
    return status === 'approved';
  }
