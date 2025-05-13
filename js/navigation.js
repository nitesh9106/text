// Navigation functionality for all pages
document.addEventListener('DOMContentLoaded', () => {
    // Add mobile bottom navigation to all pages
    addMobileBottomNav();
    
    // Add floating action button based on current page
    addFloatingActionButton();
    
    // Initialize mobile menu functionality
    initMobileMenu();
    
    // Set active states based on current page
    setActiveNavItems();
    
    // Convert appropriate elements to mobile cards
    convertToMobileCards();
});

// Add mobile bottom navigation to the page
function addMobileBottomNav() {
    // Check if mobile nav already exists
    if (document.getElementById('mobile-bottom-nav')) {
        return;
    }
    
    // Create mobile bottom navigation
    const mobileNav = document.createElement('div');
    mobileNav.className = 'mobile-bottom-nav';
    mobileNav.id = 'mobile-bottom-nav';
    
    // Define navigation items
    const navItems = [
        { href: 'dashboard.html', icon: 'fa-tachometer-alt', label: 'Dashboard' },
        { href: 'create-client.html', icon: 'fa-user-plus', label: 'Create' },
        { href: 'manage-clients.html', icon: 'fa-users', label: 'Clients' },
        { href: 'upload-photos.html', icon: 'fa-upload', label: 'Upload' },
        { href: 'users.html', icon: 'fa-user-friends', label: 'Users' }
    ];
    
    // Create navigation items
    navItems.forEach(item => {
        const navItem = document.createElement('a');
        navItem.href = item.href;
        navItem.className = 'mobile-nav-item';
        
        const icon = document.createElement('i');
        icon.className = `fas ${item.icon}`;
        
        const span = document.createElement('span');
        span.textContent = item.label;
        
        navItem.appendChild(icon);
        navItem.appendChild(span);
        mobileNav.appendChild(navItem);
    });
    
    // Add to document
    document.body.appendChild(mobileNav);
}

// Initialize mobile menu functionality
function initMobileMenu() {
    // Add mobile menu toggle if it doesn't exist
    if (!document.getElementById('mobile-menu-toggle')) {
        const menuToggle = document.createElement('div');
        menuToggle.className = 'mobile-menu-toggle';
        menuToggle.id = 'mobile-menu-toggle';
        menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
        document.querySelector('.admin-container').prepend(menuToggle);
    }
    
    // Add close button to sidebar if it doesn't exist
    const sidebar = document.getElementById('sidebar');
    if (sidebar && !document.getElementById('close-sidebar')) {
        const closeBtn = document.createElement('div');
        closeBtn.className = 'close-sidebar';
        closeBtn.id = 'close-sidebar';
        closeBtn.innerHTML = '<i class="fas fa-times"></i>';
        sidebar.querySelector('.logo').appendChild(closeBtn);
    }
    
    // Get elements
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const closeSidebar = document.getElementById('close-sidebar');
    
    // Toggle sidebar on menu button click
    if (mobileMenuToggle && sidebar) {
        mobileMenuToggle.addEventListener('click', () => {
            sidebar.classList.add('active');
        });
    }
    
    // Close sidebar when close button is clicked
    if (closeSidebar && sidebar) {
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
            if (window.innerWidth <= 768 && sidebar) {
                sidebar.classList.remove('active');
            }
        });
    });
}

// Add floating action button based on current page
function addFloatingActionButton() {
    // Check if FAB already exists
    if (document.getElementById('mobile-fab')) {
        return;
    }
    
    const currentPath = window.location.pathname;
    const filename = currentPath.split('/').pop() || 'dashboard.html';
    
    // Define FAB configurations for each page
    const fabConfigs = {
        'dashboard.html': null, // No FAB needed on dashboard
        'create-client.html': {
            icon: 'fa-plus',
            action: () => {
                const createBtn = document.getElementById('create-client-btn');
                if (createBtn) createBtn.click();
            },
            tooltip: 'Create Client'
        },
        'manage-clients.html': {
            icon: 'fa-search',
            action: () => {
                const searchBtn = document.getElementById('search-btn');
                if (searchBtn) searchBtn.click();
            },
            tooltip: 'Search Clients'
        },
        'upload-photos.html': {
            icon: 'fa-upload',
            action: () => {
                const fileInput = document.getElementById('file-input');
                if (fileInput) fileInput.click();
            },
            tooltip: 'Upload Photos'
        },
        'users.html': {
            icon: 'fa-user-plus',
            action: null, // No specific action for users page
            tooltip: 'Add User'
        }
    };
    
    // Get config for current page
    const config = fabConfigs[filename];
    
    // If no config for this page, don't add FAB
    if (!config) return;
    
    // Create FAB element
    const fab = document.createElement('div');
    fab.className = 'mobile-fab';
    fab.id = 'mobile-fab';
    fab.setAttribute('title', config.tooltip);
    
    // Add icon
    const icon = document.createElement('i');
    icon.className = `fas ${config.icon}`;
    fab.appendChild(icon);
    
    // Add click handler if action is defined
    if (config.action) {
        fab.addEventListener('click', config.action);
    }
    
    // Add to document
    document.body.appendChild(fab);
}

// Convert appropriate elements to mobile cards
function convertToMobileCards() {
    // Only apply on mobile devices
    if (window.innerWidth > 768) return;
    
    // Add mobile-card class to content cards and stat cards
    document.querySelectorAll('.content-card, .stat-card').forEach(card => {
        card.classList.add('mobile-card');
    });
    
    // Make tables more mobile-friendly
    document.querySelectorAll('.data-table').forEach(table => {
        // Add a wrapper if not already wrapped
        if (!table.parentElement.classList.contains('responsive-table')) {
            const wrapper = document.createElement('div');
            wrapper.className = 'responsive-table';
            table.parentNode.insertBefore(wrapper, table);
            wrapper.appendChild(table);
        }
    });
}

// Set active state for navigation items based on current page
function setActiveNavItems() {
    const currentPath = window.location.pathname;
    const filename = currentPath.split('/').pop() || 'dashboard.html'; // Default to dashboard if on root
    
    // Set active state for sidebar navigation
    const sidebarLinks = document.querySelectorAll('.nav-links li');
    sidebarLinks.forEach(item => {
        item.classList.remove('active');
        const link = item.querySelector('a');
        if (link && link.getAttribute('href') === filename) {
            item.classList.add('active');
        }
    });
    
    // Set active state for mobile bottom navigation
    const mobileNavItems = document.querySelectorAll('.mobile-nav-item');
    mobileNavItems.forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('href') === filename) {
            item.classList.add('active');
        }
    });
}
