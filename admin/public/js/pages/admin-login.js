document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('login-form');
    
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        // Hardcoded credentials (replace with secure authentication in production)
        if (username === 'admin' && password === 'password') {
            document.cookie = 'isLoggedIn=true; path=/';
            window.location.href = '/admin-dashboard';
        } else {
            alert('Invalid credentials. Please try again.');
        }
    });
});