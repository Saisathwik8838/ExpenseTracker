document.getElementById('signupForm').addEventListener('submit', function(e) {
  e.preventDefault(); // prevent form submission

  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();

  if (!name || !email || !password) {
    alert("Please fill out all fields.");
    return;
  }

  console.log("Signup attempted with:", name, email, password);
  alert("Signup successful (placeholder)! Redirecting...");

  // Simulate redirect
  window.location.href = "../login/login.html"; // Redirect to login
});
