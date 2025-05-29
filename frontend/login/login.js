const API_BASE_URL = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', function() {
    // Check for existing session
    if (checkAuth()) {
        redirectToDashboard();
    }

    // Forgot Password Link
    document.getElementById('forgot-password').addEventListener('click', function(e) {
        e.preventDefault();
        handleForgotPassword();
    });

    // Login Form
    document.getElementById('loginForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        await handleLogin();
    });
});

// Handle Login
async function handleLogin() {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!email || !password) {
        showError("Please fill in all fields");
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) throw new Error(data.message || "Login failed");

        // Successful login
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        redirectToDashboard();

    } catch (error) {
        showError(error.message);
    }
}

// Handle Forgot Password → Temporary Dashboard Access
async function handleForgotPassword() {
    const email = prompt("Enter your email for verification:");
    if (!email) return;

    try {
        // In production: Send email with verification link
        // For demo: Grant immediate temporary access
        localStorage.setItem('tempAccess', 'true');
        showSuccess("Temporary access granted. Redirecting...");
        
        setTimeout(() => {
            redirectToDashboard();
        }, 1500);

    } catch (error) {
        showError("Could not process your request");
    }
}

// Redirect to Dashboard
function redirectToDashboard() {
    window.location.href = '/frontend/dashboard/dashboard.html';
}

// Auth Check
function checkAuth() {
    return localStorage.getItem('authToken') || localStorage.getItem('tempAccess');
}

// UI Helpers
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    document.getElementById('loginForm').appendChild(errorDiv);
}

function showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    document.getElementById('loginForm').appendChild(successDiv);
}