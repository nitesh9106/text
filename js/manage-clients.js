// Manage clients functionality
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize pagination variables
    window.currentPage = 1;
    window.pageSize = 10;
    window.totalPages = 1;
    window.currentFilter = 'all';
    window.searchQuery = '';
    
    // Load clients
    await loadClients();
    
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
    
    // Status filter
    const statusFilter = document.getElementById('status-filter');
    if (statusFilter) {
        statusFilter.addEventListener('change', handleFilterChange);
    }
    
    // Pagination buttons
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    
    if (prevPageBtn) {
        prevPageBtn.addEventListener('click', () => {
            if (window.currentPage > 1) {
                window.currentPage--;
                loadClients();
            }
        });
    }
    
    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', () => {
            if (window.currentPage < window.totalPages) {
                window.currentPage++;
                loadClients();
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
    
    // Cancel delete button
    const cancelDeleteBtn = document.getElementById('cancel-delete');
    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', () => {
            document.getElementById('delete-modal').style.display = 'none';
        });
    }
    
    // Confirm delete button
    const confirmDeleteBtn = document.getElementById('confirm-delete');
    if (confirmDeleteBtn) {
        // Remove any existing event listeners to prevent duplicates
        const newConfirmBtn = confirmDeleteBtn.cloneNode(true);
        confirmDeleteBtn.parentNode.replaceChild(newConfirmBtn, confirmDeleteBtn);
        
        // Add click event listener to the new button
        newConfirmBtn.addEventListener('click', function() {
            // Get the client ID and code from the data attributes
            const clientId = this.getAttribute('data-client-id');
            const clientCode = this.getAttribute('data-client-code');
            
            console.log('Delete button clicked with:', { clientId, clientCode });
            
            if (clientId && clientCode) {
                // Disable button to prevent multiple clicks
                this.disabled = true;
                this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting...';
                
                // Call delete function
                deleteClient(clientId, clientCode);
            } else {
                console.error('Client ID or code not found for deletion');
                showNotification('Error: Client information not found', 'error');
            }
        });
    }
    
    // Edit client form
    const editClientForm = document.getElementById('edit-client-form');
    if (editClientForm) {
        editClientForm.addEventListener('submit', handleEditClient);
    }
}

// Load clients with pagination and filtering
async function loadClients() {
    try {
        // Build query
        let query = supabase
            .from('clients')
            .select('*', { count: 'exact' });
        
        // Apply status filter
        if (window.currentFilter !== 'all') {
            query = query.eq('status', window.currentFilter);
        }
        
        // Apply search filter
        if (window.searchQuery) {
            query = query.or(`bride_name.ilike.%${window.searchQuery}%,groom_name.ilike.%${window.searchQuery}%,client_code.ilike.%${window.searchQuery}%,location.ilike.%${window.searchQuery}%`);
        }
        
        // Get total count first
        const { count, error: countError } = await query;
        
        if (countError) throw countError;
        
        // Calculate total pages
        window.totalPages = Math.ceil(count / window.pageSize);
        
        // Apply pagination
        const from = (window.currentPage - 1) * window.pageSize;
        const to = from + window.pageSize - 1;
        
        // Get paginated data
        const { data: clients, error } = await query
            .order('wedding_date', { ascending: false })
            .range(from, to);
        
        if (error) throw error;
        
        // Update pagination UI
        updatePagination();
        
        // Render clients
        renderClients(clients);
    } catch (error) {
        console.error('Error loading clients:', error);
        showNotification('Failed to load clients', 'error');
    }
}

// Render clients table
function renderClients(clients) {
    const tableBody = document.getElementById('clients-table');
    tableBody.innerHTML = '';
    
    if (clients && clients.length > 0) {
        clients.forEach(client => {
            const row = document.createElement('tr');
            
            // Client code
            const codeCell = document.createElement('td');
            codeCell.textContent = client.client_code;
            row.appendChild(codeCell);
            
            // Bride & groom names
            const namesCell = document.createElement('td');
            namesCell.textContent = `${client.bride_name} & ${client.groom_name}`;
            row.appendChild(namesCell);
            
            // Wedding date
            const weddingDateCell = document.createElement('td');
            weddingDateCell.textContent = formatDate(client.wedding_date);
            row.appendChild(weddingDateCell);
            
            // End date
            const endDateCell = document.createElement('td');
            endDateCell.textContent = formatDate(client.end_date);
            row.appendChild(endDateCell);
            
            // Location
            const locationCell = document.createElement('td');
            locationCell.textContent = client.location;
            row.appendChild(locationCell);
            
            // Status
            const statusCell = document.createElement('td');
            const statusBadge = document.createElement('span');
            statusBadge.className = `status-badge status-${client.status}`;
            statusBadge.textContent = client.status.charAt(0).toUpperCase() + client.status.slice(1);
            statusCell.appendChild(statusBadge);
            row.appendChild(statusCell);
            
            // Actions
            const actionsCell = document.createElement('td');
            
            // View button
            const viewBtn = document.createElement('button');
            viewBtn.className = 'action-btn view-btn';
            viewBtn.innerHTML = '<i class="fas fa-eye"></i>';
            viewBtn.title = 'View Client';
            viewBtn.addEventListener('click', () => viewClient(client));
            actionsCell.appendChild(viewBtn);
            
            // Edit button
            const editBtn = document.createElement('button');
            editBtn.className = 'action-btn edit-btn';
            editBtn.innerHTML = '<i class="fas fa-edit"></i>';
            editBtn.title = 'Edit Client';
            editBtn.addEventListener('click', () => openEditModal(client));
            actionsCell.appendChild(editBtn);
            
            // Delete button
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'action-btn delete-btn';
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
            deleteBtn.title = 'Delete Client';
            deleteBtn.addEventListener('click', () => openDeleteModal(client));
            actionsCell.appendChild(deleteBtn);
            
            row.appendChild(actionsCell);
            
            // Add row to table
            tableBody.appendChild(row);
        });
    } else {
        // Display no clients message
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 7;
        cell.textContent = 'No clients found';
        cell.style.textAlign = 'center';
        row.appendChild(cell);
        tableBody.appendChild(row);
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
    loadClients();
}

// Handle filter change
function handleFilterChange() {
    const statusFilter = document.getElementById('status-filter');
    window.currentFilter = statusFilter.value;
    window.currentPage = 1;
    loadClients();
}

// Open edit modal
function openEditModal(client) {
    // Populate form fields
    document.getElementById('edit-client-id').value = client.id;
    document.getElementById('edit-client-code').value = client.client_code;
    document.getElementById('edit-bride-name').value = client.bride_name;
    document.getElementById('edit-groom-name').value = client.groom_name;
    document.getElementById('edit-wedding-date').value = formatDateForInput(client.wedding_date);
    document.getElementById('edit-end-date').value = formatDateForInput(client.end_date);
    document.getElementById('edit-location').value = client.location;
    
    // Show modal
    document.getElementById('edit-modal').style.display = 'block';
}

// Open delete modal
function openDeleteModal(client) {
    // Set client info
    document.getElementById('delete-client-name').textContent = `${client.bride_name} & ${client.groom_name} (${client.client_code})`;
    
    // Set up confirm delete button with data attributes
    const confirmDeleteBtn = document.getElementById('confirm-delete');
    
    // Ensure client ID and code are valid
    if (!client.id || !client.client_code) {
        console.error('Invalid client data for deletion:', client);
        showNotification('Error: Invalid client data', 'error');
        return;
    }
    
    // Set data attributes
    confirmDeleteBtn.setAttribute('data-client-id', client.id);
    confirmDeleteBtn.setAttribute('data-client-code', client.client_code);
    
    // Log for debugging
    console.log('Set delete button attributes:', {
        'data-client-id': confirmDeleteBtn.getAttribute('data-client-id'),
        'data-client-code': confirmDeleteBtn.getAttribute('data-client-code')
    });
    
    // Reset button state
    confirmDeleteBtn.disabled = false;
    confirmDeleteBtn.innerHTML = 'Delete';
    confirmDeleteBtn.className = 'danger-btn';
    
    // Show modal
    document.getElementById('delete-modal').style.display = 'block';
}

// View client details
async function viewClient(client) {
    try {
        // Populate client info
        document.getElementById('view-client-code').textContent = client.client_code;
        document.getElementById('view-bride-name').textContent = client.bride_name;
        document.getElementById('view-groom-name').textContent = client.groom_name;
        document.getElementById('view-wedding-date').textContent = formatDate(client.wedding_date);
        document.getElementById('view-end-date').textContent = formatDate(client.end_date);
        document.getElementById('view-location').textContent = client.location;
        
        const statusElement = document.getElementById('view-status');
        statusElement.textContent = client.status.charAt(0).toUpperCase() + client.status.slice(1);
        statusElement.className = `info-value status-text-${client.status}`;
        
        // Generate QR code
        generateViewQRCode(client.client_code);
        
        // Load client photos
        await loadClientPhotos(client.client_code);
        
        // Show modal
        document.getElementById('view-modal').style.display = 'block';
    } catch (error) {
        console.error('Error viewing client:', error);
        showNotification('Failed to load client details', 'error');
    }
}

// Load client photos
async function loadClientPhotos(clientCode) {
    try {
        const { data: photos, error } = await supabase
            .from('photos')
            .select('*')
            .eq('client_code', clientCode)
            .order('uploaded_at', { ascending: false });
        
        if (error) throw error;
        
        const photoGrid = document.getElementById('photo-grid');
        const photoCount = document.getElementById('photo-count');
        
        photoGrid.innerHTML = '';
        photoCount.textContent = photos ? photos.length : 0;
        
        if (photos && photos.length > 0) {
            photos.forEach(photo => {
                const photoItem = document.createElement('div');
                photoItem.className = 'photo-item';
                
                const img = document.createElement('img');
                img.src = photo.url;
                img.alt = 'Wedding Photo';
                photoItem.appendChild(img);
                
                if (photo.is_cover) {
                    const coverBadge = document.createElement('span');
                    coverBadge.className = 'cover-badge';
                    coverBadge.textContent = 'Cover';
                    photoItem.appendChild(coverBadge);
                }
                
                photoGrid.appendChild(photoItem);
            });
        } else {
            const noPhotos = document.createElement('p');
            noPhotos.textContent = 'No photos uploaded for this client';
            photoGrid.appendChild(noPhotos);
        }
    } catch (error) {
        console.error('Error loading photos:', error);
        const photoGrid = document.getElementById('photo-grid');
        photoGrid.innerHTML = '<p>Failed to load photos</p>';
    }
}

// Handle edit client form submission
async function handleEditClient(e) {
    e.preventDefault();
    
    const clientId = document.getElementById('edit-client-id').value;
    const clientCode = document.getElementById('edit-client-code').value;
    const brideName = document.getElementById('edit-bride-name').value;
    const groomName = document.getElementById('edit-groom-name').value;
    const weddingDate = document.getElementById('edit-wedding-date').value;
    const endDate = document.getElementById('edit-end-date').value;
    const location = document.getElementById('edit-location').value;
    
    // Validate end date is after wedding date
    if (new Date(endDate) <= new Date(weddingDate)) {
        showNotification('End date must be after the wedding date', 'error');
        return;
    }
    
    try {
        // Update client in Supabase
        const { error } = await supabase
            .from('clients')
            .update({
                bride_name: brideName,
                groom_name: groomName,
                wedding_date: weddingDate,
                end_date: endDate,
                location: location
            })
            .eq('id', clientId);
        
        if (error) throw error;
        
        // Show success notification
        showNotification('Client updated successfully', 'success');
        
        // Hide modal
        document.getElementById('edit-modal').style.display = 'none';
        
        // Reload clients
        loadClients();
    } catch (error) {
        console.error('Error updating client:', error);
        showNotification('Failed to update client', 'error');
    }
}

// Delete client
async function deleteClient(clientId, clientCode) {
    try {
        console.log('Starting client deletion process for:', { clientId, clientCode });
        
        // Validate parameters
        if (!clientId || !clientCode) {
            throw new Error('Client ID and code are required for deletion');
        }
        
        // Make sure we have access to the Supabase client
        let supabase = window.supabaseClient;
        
        // If Supabase client is not available, try to initialize it
        if (!supabase) {
            console.log('Supabase client not available, attempting to initialize...');
            if (typeof window.supabase !== 'undefined') {
                const SUPABASE_URL = 'https://txurfebtzkwxfxfifsin.supabase.co';
                const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4dXJmZWJ0emt3eGZ4Zmlmc2luIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY5NDE5NTksImV4cCI6MjA2MjUxNzk1OX0.OGEin38-BgqSXq_bayomRqICzwFQNSUR2dGhryiSTbg';
                supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
                window.supabaseClient = supabase;
                console.log('Supabase client initialized successfully');
            } else {
                throw new Error('Supabase library not loaded');
            }
        }
        
        if (!supabase) {
            throw new Error('Failed to initialize Supabase client');
        }
        
        // Skip photo deletion if there's an issue with the photos table structure
        try {
            // First, check the structure of the photos table
            console.log('Checking photos table structure...');
            const { data: tableInfo, error: tableError } = await supabase
                .from('photos')
                .select('*')
                .limit(1);
            
            if (tableError) {
                console.error('Error checking photos table:', tableError);
                console.log('Skipping photo deletion due to table structure issues');
            } else {
                // Get column names from the first row
                const columnNames = tableInfo && tableInfo.length > 0 ? Object.keys(tableInfo[0]) : [];
                console.log('Photos table columns:', columnNames);
                
                // Determine the URL column name (could be 'url', 'photo_url', 'image_url', etc.)
                const urlColumnName = columnNames.find(col => 
                    col === 'url' || col === 'photo_url' || col === 'image_url' || col.includes('url')
                );
                
                if (urlColumnName) {
                    console.log(`Found URL column: ${urlColumnName}`);
                    
                    // Fetch photos with the correct column name
                    console.log('Fetching photos for client:', clientCode);
                    const { data: photos, error: photosError } = await supabase
                        .from('photos')
                        .select(`*`)
                        .eq('client_code', clientCode);
                    
                    if (photosError) {
                        console.error('Error fetching photos:', photosError);
                    } else {
                        console.log('Found photos:', photos ? photos.length : 0);
                        
                        // Delete photos from storage
                        if (photos && photos.length > 0) {
                            // Extract file paths from URLs
                            const filePaths = photos.map(photo => {
                                try {
                                    // Use the detected URL column
                                    const url = new URL(photo[urlColumnName]);
                                    const pathMatch = url.pathname.match(/\/clients\/([^/]+\/[^/]+)$/);
                                    return pathMatch ? pathMatch[1] : null;
                                } catch (e) {
                                    console.error(`Error parsing URL from ${urlColumnName}:`, photo[urlColumnName], e);
                                    return null;
                                }
                            }).filter(Boolean);
                            
                            console.log('File paths to delete:', filePaths);
                            
                            // Delete files from storage
                            if (filePaths.length > 0) {
                                console.log('Deleting files from storage');
                                const { error: storageError } = await supabase.storage
                                    .from('clients')
                                    .remove(filePaths);
                                
                                if (storageError) {
                                    console.error('Error deleting files from storage:', storageError);
                                    // Continue with deletion even if storage deletion fails
                                }
                            }
                        }
                    }
                } else {
                    console.log('Could not determine URL column in photos table, skipping photo deletion');
                }
            }
        } catch (photoCheckError) {
            console.error('Error during photo table check:', photoCheckError);
            console.log('Continuing with client deletion despite photo issues');
        }
        
        // Delete photo records
        try {
            console.log('Deleting photo records for client:', clientCode);
            const { error: deletePhotosError } = await supabase
                .from('photos')
                .delete()
                .eq('client_code', clientCode);
            
            if (deletePhotosError) {
                console.error('Error deleting photo records:', deletePhotosError);
                // Don't throw the error, just log it and continue with client deletion
                console.log('Continuing with client deletion despite photo record deletion error');
            } else {
                console.log('Successfully deleted photo records');
            }
        } catch (photoDeleteError) {
            console.error('Exception during photo records deletion:', photoDeleteError);
            console.log('Continuing with client deletion despite photo deletion exception');
        }
        
        // Delete client
        console.log('Deleting client with ID:', clientId);
        const { data: deleteResult, error: deleteClientError } = await supabase
            .from('clients')
            .delete()
            .eq('id', clientId)
            .select();
        
        if (deleteClientError) {
            console.error('Error deleting client:', deleteClientError);
            throw deleteClientError;
        }
        
        console.log('Delete result:', deleteResult);
        console.log('Client deleted successfully');
        
        // Reset the delete button
        const confirmDeleteBtn = document.getElementById('confirm-delete');
        if (confirmDeleteBtn) {
            confirmDeleteBtn.disabled = false;
            confirmDeleteBtn.innerHTML = 'Delete';
        }
        
        // Show success notification
        showNotification('Client deleted successfully', 'success');
        
        // Hide modal
        document.getElementById('delete-modal').style.display = 'none';
        
        // Reload clients
        setTimeout(() => {
            loadClients();
        }, 500);
    } catch (error) {
        console.error('Error in deleteClient function:', error);
        showNotification(`Failed to delete client: ${error.message || 'Unknown error'}`, 'error');
        
        // Reset the delete button
        const confirmDeleteBtn = document.getElementById('confirm-delete');
        if (confirmDeleteBtn) {
            confirmDeleteBtn.disabled = false;
            confirmDeleteBtn.innerHTML = 'Delete';
            confirmDeleteBtn.className = 'danger-btn';
        }
        
        // Display error on the page for debugging
        const errorElement = document.createElement('div');
        errorElement.className = 'error-details';
        errorElement.innerHTML = `<h3>Error Details (for debugging):</h3><pre>${JSON.stringify(error, null, 2)}</pre>`;
        
        // Find a suitable container for the error message
        const container = document.querySelector('.content-card') || document.querySelector('.main-content');
        if (container) {
            container.appendChild(errorElement);
        }
        
        // Hide modal
        document.getElementById('delete-modal').style.display = 'none';
        
        // Attempt to reload clients list anyway
        try {
            setTimeout(() => loadClients(), 1000);
        } catch (reloadError) {
            console.error('Error reloading clients after failed deletion:', reloadError);
        }
    }
}

// Format date for input fields (YYYY-MM-DD)
function formatDateForInput(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
}
