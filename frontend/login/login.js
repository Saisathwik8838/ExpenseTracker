document.getElementById('loginForm').addEventListener('submit', function(e) {
  e.preventDefault(); // Prevent default form submission

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();

  if (!email || !password) {
    alert("Please fill out both fields.");
    return;
  }

  // Later this part will be replaced with actual authentication logic
  console.log("Login attempted with:", email, password);
  alert("Login successful (placeholder)! Redirecting...");

  // Simulate redirect
  window.location.href = "../dashboard.html"; // Replace with actual page
});
