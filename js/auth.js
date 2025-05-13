// Handle login form submission
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const errorMessage = document.getElementById('error-message');
        const loginBtn = document.getElementById('login-btn');
        
        // Disable login button and show loading state
        loginBtn.disabled = true;
        loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
        errorMessage.textContent = '';
        
        try {
            // Sign in with email and password
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });
            
            if (error) throw error;
            
            // Redirect to dashboard on successful login
            window.location.href = 'dashboard.html';
        } catch (error) {
            // Display error message
            errorMessage.textContent = error.message || 'Failed to login. Please check your credentials.';
            
            // Reset login button
            loginBtn.disabled = false;
            loginBtn.innerHTML = 'Login';
        }
    });
}

// Check authentication status on page load
document.addEventListener('DOMContentLoaded', async () => {
    // Check if we're on the login page
    const isLoginPage = window.location.pathname.includes('index.html') || 
                        window.location.pathname.endsWith('/');
    
    try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
            // If authenticated and on login page, redirect to dashboard
            if (isLoginPage) {
                window.location.href = 'dashboard.html';
            }
        } else {
            // If not authenticated and not on login page, redirect to login
            if (!isLoginPage) {
                window.location.href = 'index.html';
            }
        }
    } catch (error) {
        console.error('Authentication check failed:', error);
        // Redirect to login on error
        if (!isLoginPage) {
            window.location.href = 'index.html';
        }
    }
});
