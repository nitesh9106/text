// User management functionality
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize pagination variables
    window.currentPage = 1;
    window.pageSize = 12;
    window.totalPages = 1;
    window.currentSort = 'created_at_desc';
    window.searchQuery = '';
    
    // Load users
    await loadUsers();
    
    // Initialize event listeners
    initializeEventListeners();
});

// Initialize event listeners
function initializeEventListeners() {
    // Search button
    const searchBtn = document.getElementById('search-btn');
    if (searchBtn) {
        searchBtn.addEventListener('click', handleSearch);
    }
    
    // Search input (enter key)
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleSearch();
            }
        });
    }
    
    // Sort filter
    const sortFilter = document.getElementById('sort-filter');
    if (sortFilter) {
        sortFilter.addEventListener('change', handleSortChange);
    }
    
    // Pagination buttons
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    
    if (prevPageBtn) {
        prevPageBtn.addEventListener('click', () => {
            if (window.currentPage > 1) {
                window.currentPage--;
                loadUsers();
            }
        });
    }
    
    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', () => {
            if (window.currentPage < window.totalPages) {
                window.currentPage++;
                loadUsers();
            }
        });
    }
    
    // Modal close buttons
    const closeButtons = document.querySelectorAll('.close-modal');
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.style.display = 'none';
            });
        });
    });
}

// Load users with pagination, sorting, and filtering
async function loadUsers() {
    try {
        // Build query
        let query = supabase
            .from('users')
            .select('*', { count: 'exact' });
        
        // Apply search filter
        if (window.searchQuery) {
            query = query.or(`first_name.ilike.%${window.searchQuery}%,last_name.ilike.%${window.searchQuery}%,email.ilike.%${window.searchQuery}%,phone.ilike.%${window.searchQuery}%`);
        }
        
        // Get total count first
        const { count, error: countError } = await query;
        
        if (countError) throw countError;
        
        // Calculate total pages
        window.totalPages = Math.ceil(count / window.pageSize);
        
        // Apply pagination
        const from = (window.currentPage - 1) * window.pageSize;
        const to = from + window.pageSize - 1;
        
        // Apply sorting
        const [sortField, sortDirection] = window.currentSort.split('_');
        
        // Get paginated data
        const { data: users, error } = await query
            .order(sortField, { ascending: sortDirection === 'asc' })
            .range(from, to);
        
        if (error) throw error;
        
        // Update pagination UI
        updatePagination();
        
        // Render users
        renderUsers(users);
    } catch (error) {
        console.error('Error loading users:', error);
        showNotification('Failed to load users', 'error');
    }
}

// Render users grid
function renderUsers(users) {
    const usersGrid = document.getElementById('users-grid');
    usersGrid.innerHTML = '';
    
    if (users && users.length > 0) {
        users.forEach(user => {
            // Create user card
            const userCard = document.createElement('div');
            userCard.className = 'user-card';
            userCard.addEventListener('click', () => openUserModal(user));
            
            // User card header
            const cardHeader = document.createElement('div');
            cardHeader.className = 'user-card-header';
            
            // User avatar
            const avatarContainer = document.createElement('div');
            avatarContainer.className = 'user-avatar';
            
            const avatar = document.createElement('img');
            avatar.src = user.profile_url || 'https://via.placeholder.com/150?text=User';
            avatar.alt = 'User Avatar';
            avatarContainer.appendChild(avatar);
            cardHeader.appendChild(avatarContainer);
            
            // User name
            const userName = document.createElement('div');
            userName.className = 'user-name';
            userName.textContent = `${user.first_name} ${user.last_name}`;
            cardHeader.appendChild(userName);
            
            // User email
            const userEmail = document.createElement('div');
            userEmail.className = 'user-email';
            userEmail.textContent = user.email;
            cardHeader.appendChild(userEmail);
            
            userCard.appendChild(cardHeader);
            
            // User card body
            const cardBody = document.createElement('div');
            cardBody.className = 'user-card-body';
            
            // Phone
            const phoneDetail = document.createElement('div');
            phoneDetail.className = 'user-detail';
            phoneDetail.innerHTML = `<i class="fas fa-phone"></i> ${user.phone || 'N/A'}`;
            cardBody.appendChild(phoneDetail);
            
            // Joined date
            const joinedDetail = document.createElement('div');
            joinedDetail.className = 'user-detail';
            joinedDetail.innerHTML = `<i class="fas fa-calendar-alt"></i> Joined: ${formatDate(user.created_at)}`;
            cardBody.appendChild(joinedDetail);
            
            userCard.appendChild(cardBody);
            
            // Add card to grid
            usersGrid.appendChild(userCard);
        });
    } else {
        // Display no users message
        const noUsers = document.createElement('div');
        noUsers.className = 'no-data-message';
        noUsers.textContent = 'No users found';
        usersGrid.appendChild(noUsers);
    }
}

// Update pagination UI
function updatePagination() {
    const pageInfo = document.getElementById('page-info');
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    
    pageInfo.textContent = `Page ${window.currentPage} of ${window.totalPages}`;
    
    prevPageBtn.disabled = window.currentPage <= 1;
    nextPageBtn.disabled = window.currentPage >= window.totalPages;
}

// Handle search
function handleSearch() {
    const searchInput = document.getElementById('search-input');
    window.searchQuery = searchInput.value.trim();
    window.currentPage = 1;
    loadUsers();
}

// Handle sort change
function handleSortChange() {
    const sortFilter = document.getElementById('sort-filter');
    window.currentSort = sortFilter.value;
    window.currentPage = 1;
    loadUsers();
}

// Open user modal
function openUserModal(user) {
    // Populate user details
    document.getElementById('modal-user-avatar').src = user.profile_url || 'https://via.placeholder.com/150?text=User';
    document.getElementById('modal-user-name').textContent = `${user.first_name} ${user.last_name}`;
    document.getElementById('modal-user-email').textContent = user.email || 'N/A';
    document.getElementById('modal-user-phone').textContent = user.phone || 'N/A';
    document.getElementById('modal-user-joined').textContent = formatDate(user.created_at);
    
    // Show modal
    document.getElementById('user-modal').style.display = 'block';
}
