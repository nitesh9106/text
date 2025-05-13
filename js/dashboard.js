// Dashboard functionality
document.addEventListener('DOMContentLoaded', async () => {
    // Load dashboard statistics
    await loadDashboardStats();
    
    // Load recent clients
    await loadRecentClients();
});

// Load dashboard statistics
async function loadDashboardStats() {
    try {
        // Get total clients count
        const { count: totalClients, error: clientsError } = await supabase
            .from('clients')
            .select('*', { count: 'exact', head: true });
        
        if (clientsError) throw clientsError;
        
        // Get active clients count
        const { count: activeClients, error: activeError } = await supabase
            .from('clients')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'active');
        
        if (activeError) throw activeError;
        
        // Get total photos count
        const { count: totalPhotos, error: photosError } = await supabase
            .from('photos')
            .select('*', { count: 'exact', head: true });
        
        if (photosError) throw photosError;
        
        // Get registered users count
        const { count: registeredUsers, error: usersError } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true });
        
        if (usersError) throw usersError;
        
        // Update stats in the UI
        document.getElementById('total-clients').textContent = totalClients || 0;
        document.getElementById('active-clients').textContent = activeClients || 0;
        document.getElementById('total-photos').textContent = totalPhotos || 0;
        document.getElementById('registered-users').textContent = registeredUsers || 0;
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
        showNotification('Failed to load dashboard statistics', 'error');
    }
}

// Load recent clients
async function loadRecentClients() {
    try {
        // Get recent clients (last 5)
        const { data: clients, error } = await supabase
            .from('clients')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5);
        
        if (error) throw error;
        
        const tableBody = document.getElementById('recent-clients-table');
        tableBody.innerHTML = '';
        
        if (clients && clients.length > 0) {
            clients.forEach(client => {
                const row = document.createElement('tr');
                
                // Create client code cell
                const codeCell = document.createElement('td');
                codeCell.textContent = client.client_code;
                row.appendChild(codeCell);
                
                // Create bride & groom cell
                const namesCell = document.createElement('td');
                namesCell.textContent = `${client.bride_name} & ${client.groom_name}`;
                row.appendChild(namesCell);
                
                // Create wedding date cell
                const weddingDateCell = document.createElement('td');
                weddingDateCell.textContent = formatDate(client.wedding_date);
                row.appendChild(weddingDateCell);
                
                // Create end date cell
                const endDateCell = document.createElement('td');
                endDateCell.textContent = formatDate(client.end_date);
                row.appendChild(endDateCell);
                
                // Create status cell
                const statusCell = document.createElement('td');
                const statusBadge = document.createElement('span');
                statusBadge.className = `status-badge status-${client.status}`;
                statusBadge.textContent = client.status.charAt(0).toUpperCase() + client.status.slice(1);
                statusCell.appendChild(statusBadge);
                row.appendChild(statusCell);
                
                // Add row to table
                tableBody.appendChild(row);
            });
        } else {
            // Display no clients message
            const row = document.createElement('tr');
            const cell = document.createElement('td');
            cell.colSpan = 5;
            cell.textContent = 'No clients found';
            cell.style.textAlign = 'center';
            row.appendChild(cell);
            tableBody.appendChild(row);
        }
    } catch (error) {
        console.error('Error loading recent clients:', error);
        showNotification('Failed to load recent clients', 'error');
    }
}
