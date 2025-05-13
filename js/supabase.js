// Supabase configuration
// Project URL: https://txurfebtzkwxfxfifsin.supabase.co
// Project API keys: txurfebtzkwxfxfifsin
// Callback URL for OAuth: https://txurfebtzkwxfxfifsin.supabase.co/auth/v1/callback
const SUPABASE_URL = 'https://txurfebtzkwxfxfifsin.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4dXJmZWJ0emt3eGZ4Zmlmc2luIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY5NDE5NTksImV4cCI6MjA2MjUxNzk1OX0.OGEin38-BgqSXq_bayomRqICzwFQNSUR2dGhryiSTbg';

// Initialize Supabase client - using the global supabase object from the CDN script
let supabase;

// Wait for the DOM to be fully loaded to ensure the Supabase library is available
document.addEventListener('DOMContentLoaded', () => {
    // Check if supabase is available from the CDN
    if (typeof window.supabase !== 'undefined') {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        // Make supabase client globally available
        window.supabaseClient = supabase;
        // Initialize the page after Supabase is ready
        initPage();
    } else {
        console.error('Supabase library not loaded. Please check your internet connection.');
        document.body.innerHTML = '<div class="error-container"><h1>Error Loading Application</h1><p>Could not connect to Supabase. Please check your internet connection and refresh the page.</p></div>';
    }
});

// Check if user is authenticated
async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    
    // If no session and not on login page, redirect to login
    if (!session && !window.location.href.includes('index.html')) {
        window.location.href = 'index.html';
        return false;
    }
    
    // If session and on login page, redirect to dashboard
    if (session && window.location.href.includes('index.html')) {
        window.location.href = 'dashboard.html';
        return true;
    }
    
    return !!session;
}

// Display admin email in the header
function displayAdminInfo() {
    const adminEmailElement = document.getElementById('admin-email');
    if (adminEmailElement) {
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) {
                adminEmailElement.textContent = user.email;
            }
        });
    }
}

// Generate a unique client code
function generateClientCode() {
    const prefix = 'TF';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = prefix;
    
    for (let i = 0; i < 5; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    
    return result;
}

// Format date for display
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Format file size for display
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Show notification
function showNotification(message, type = 'success') {
    // Create notification element if it doesn't exist
    let notification = document.querySelector('.notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.className = 'notification';
        document.body.appendChild(notification);
    }
    
    // Set notification content and style
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.style.display = 'block';
    
    // Hide notification after 3 seconds
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

// Initialize the page
async function initPage() {
    await checkAuth();
    displayAdminInfo();
    
    // Add logout functionality
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            await supabase.auth.signOut();
            window.location.href = 'index.html';
        });
    }
}

// Note: initPage is now called in the DOMContentLoaded event listener above
// after the Supabase client is initialized
