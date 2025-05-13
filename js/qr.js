// QR Code generation functionality
document.addEventListener('DOMContentLoaded', async () => {
    console.log('QR.js loaded and DOM content ready');
    
    // Handle client creation form submission
    const createClientForm = document.getElementById('create-client-form');
    if (createClientForm) {
        console.log('Client form found, adding submit event listener');
        createClientForm.addEventListener('submit', handleCreateClient);
    }
    
    // Handle test connection button
    const testConnectionBtn = document.getElementById('test-connection-btn');
    if (testConnectionBtn) {
        console.log('Test connection button found, adding click event listener');
        testConnectionBtn.addEventListener('click', testSupabaseConnection);
    }
    
    // Handle download QR code button
    const downloadQrBtn = document.getElementById('download-qr');
    if (downloadQrBtn) {
        downloadQrBtn.addEventListener('click', handleDownloadQR);
    }
    
    // Handle create another client button
    const createAnotherBtn = document.getElementById('create-another');
    if (createAnotherBtn) {
        createAnotherBtn.addEventListener('click', () => {
            document.getElementById('create-client-form').reset();
            document.getElementById('create-client-form').style.display = 'block';
            document.getElementById('qr-container').style.display = 'none';
        });
    }
    
    // Handle download QR code in view modal
    const downloadViewQrBtn = document.getElementById('download-view-qr');
    if (downloadViewQrBtn) {
        downloadViewQrBtn.addEventListener('click', () => {
            downloadQRCode('view-qrcode');
        });
    }
});

// Handle client creation form submission
async function handleCreateClient(e) {
    e.preventDefault();
    
    const brideName = document.getElementById('bride-name').value;
    const groomName = document.getElementById('groom-name').value;
    const weddingDate = document.getElementById('wedding-date').value;
    const endDate = document.getElementById('end-date').value;
    const location = document.getElementById('location').value;
    const createClientBtn = document.getElementById('create-client-btn');
    
    // Validate end date is after wedding date
    if (new Date(endDate) <= new Date(weddingDate)) {
        showNotification('End date must be after the wedding date', 'error');
        return;
    }
    
    // Disable button and show loading state
    createClientBtn.disabled = true;
    createClientBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';
    
    try {
        console.log('Starting client creation...');
        // Generate client code
        const clientCode = generateClientCode();
        console.log('Generated client code:', clientCode);
        
        // Log the Supabase instance to check if it's properly initialized
        console.log('Supabase instance:', supabase);
        
        // Create client in Supabase
        console.log('Attempting to insert client into Supabase...');
        const { data, error } = await supabase
            .from('clients')
            .insert([
                {
                    client_code: clientCode,
                    bride_name: brideName,
                    groom_name: groomName,
                    wedding_date: weddingDate,
                    end_date: endDate,
                    location: location,
                    status: 'active'
                }
            ])
            .select();
        
        console.log('Insert response:', { data, error });
        
        if (error) throw error;
        
        // Show success notification
        showNotification('Client created successfully!', 'success');
        
        // Display client information and QR code
        document.getElementById('client-code').textContent = clientCode;
        document.getElementById('client-names').textContent = `${brideName} & ${groomName}`;
        
        // Generate gallery URL
        const galleryUrl = `https://thakkarfilms.app/gallery/${clientCode}`;
        document.getElementById('gallery-url').textContent = galleryUrl;
        
        // Generate QR code
        generateQRCode('qrcode', galleryUrl);
        
        // Hide form and show QR container
        document.getElementById('create-client-form').style.display = 'none';
        document.getElementById('qr-container').style.display = 'block';
    } catch (error) {
        console.error('Error creating client:', error);
        // Show more detailed error message
        const errorMessage = error.message || 'Unknown error';
        const errorDetails = error.details || error.hint || '';
        showNotification(`Failed to create client: ${errorMessage}. ${errorDetails}`, 'error');
        
        // Display error on the page for debugging
        const errorElement = document.createElement('div');
        errorElement.className = 'error-details';
        errorElement.innerHTML = `<h3>Error Details (for debugging):</h3><pre>${JSON.stringify(error, null, 2)}</pre>`;
        document.querySelector('.content-card').appendChild(errorElement);
        
        // Reset button state
        createClientBtn.disabled = false;
        createClientBtn.innerHTML = 'Create Client';
    }
}

// Generate QR code
function generateQRCode(elementId, url) {
    const element = document.getElementById(elementId);
    if (element) {
        // Clear previous QR code
        element.innerHTML = '';
        
        // Generate new QR code
        new QRCode(element, {
            text: url,
            width: 200,
            height: 200,
            colorDark: '#000000',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.H
        });
    }
}

// Handle download QR code
function handleDownloadQR() {
    downloadQRCode('qrcode');
}

// Download QR code as image
function downloadQRCode(elementId) {
    const qrCodeImg = document.getElementById(elementId).querySelector('img');
    if (qrCodeImg) {
        // Create a temporary link
        const link = document.createElement('a');
        link.href = qrCodeImg.src;
        
        // Get client code for filename
        const clientCode = document.getElementById('client-code')?.textContent || 
                          document.getElementById('view-client-code')?.textContent || 
                          'gallery';
        
        link.download = `thakkar-films-${clientCode}-qr.png`;
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// Generate QR code for client in view modal
function generateViewQRCode(clientCode) {
    const galleryUrl = `https://thakkarfilms.app/gallery/${clientCode}`;
    document.getElementById('view-gallery-url').textContent = galleryUrl;
    generateQRCode('view-qrcode', galleryUrl);
}

// Test Supabase connection
async function testSupabaseConnection() {
    const testBtn = document.getElementById('test-connection-btn');
    const originalText = testBtn.textContent;
    testBtn.disabled = true;
    testBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Testing Connection...';
    
    try {
        console.log('Testing Supabase connection...');
        
        // Check if supabase is defined
        if (typeof supabase === 'undefined') {
            throw new Error('Supabase client is not defined. Check if supabase.js is loaded properly.');
        }
        
        console.log('Supabase object:', supabase);
        
        // Try to access the clients table
        const { data, error, status } = await supabase
            .from('clients')
            .select('count')
            .limit(1);
            
        console.log('Test query result:', { data, error, status });
        
        if (error) throw error;
        
        // Create a test div to show the result
        const resultDiv = document.createElement('div');
        resultDiv.className = 'connection-test-result success';
        resultDiv.innerHTML = `<h3>Connection Successful!</h3>
            <p>Successfully connected to Supabase.</p>
            <p>Status: ${status}</p>
            <pre>${JSON.stringify({ data }, null, 2)}</pre>`;
        
        // Remove any previous test results
        const previousResults = document.querySelectorAll('.connection-test-result');
        previousResults.forEach(el => el.remove());
        
        // Add the new result
        document.querySelector('.content-card').appendChild(resultDiv);
        
        showNotification('Supabase connection successful!', 'success');
    } catch (error) {
        console.error('Supabase connection test failed:', error);
        
        // Create a test div to show the error
        const resultDiv = document.createElement('div');
        resultDiv.className = 'connection-test-result error';
        resultDiv.innerHTML = `<h3>Connection Failed!</h3>
            <p>Error: ${error.message || 'Unknown error'}</p>
            <p>Details: ${error.details || error.hint || 'No additional details'}</p>
            <pre>${JSON.stringify(error, null, 2)}</pre>`;
        
        // Remove any previous test results
        const previousResults = document.querySelectorAll('.connection-test-result');
        previousResults.forEach(el => el.remove());
        
        // Add the new result
        document.querySelector('.content-card').appendChild(resultDiv);
        
        showNotification(`Connection test failed: ${error.message}`, 'error');
    } finally {
        // Reset button
        testBtn.disabled = false;
        testBtn.textContent = originalText;
    }
}
