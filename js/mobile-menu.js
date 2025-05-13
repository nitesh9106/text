// Mobile menu functionality
document.addEventListener('DOMContentLoaded', () => {
    // Get elements
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const closeSidebar = document.getElementById('close-sidebar');
    const sidebar = document.getElementById('sidebar');
    const mobileBottomNav = document.getElementById('mobile-bottom-nav');
    
    // Toggle sidebar on menu button click
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', () => {
            sidebar.classList.add('active');
        });
    }
    
    // Close sidebar when close button is clicked
    if (closeSidebar) {
        closeSidebar.addEventListener('click', () => {
            sidebar.classList.remove('active');
        });
    }
    
    // Close sidebar when clicking outside of it
    document.addEventListener('click', (e) => {
        if (sidebar && 
            sidebar.classList.contains('active') && 
            !sidebar.contains(e.target) && 
            e.target !== mobileMenuToggle) {
            sidebar.classList.remove('active');
        }
    });
    
    // Close sidebar when a nav link is clicked (on mobile)
    const navLinks = document.querySelectorAll('.nav-links a');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                sidebar.classList.remove('active');
            }
        });
    });
    
    // Set active state for mobile bottom navigation based on current page
    if (mobileBottomNav) {
        const currentPath = window.location.pathname;
        const filename = currentPath.split('/').pop() || 'dashboard.html'; // Default to dashboard if on root
        
        const mobileNavItems = mobileBottomNav.querySelectorAll('.mobile-nav-item');
        mobileNavItems.forEach(item => {
            // Remove active class from all items
            item.classList.remove('active');
            
            // Add active class to current page link
            const href = item.getAttribute('href');
            if (href === filename) {
                item.classList.add('active');
            }
        });
    }
});
