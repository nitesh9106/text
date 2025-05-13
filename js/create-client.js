// Client creation functionality
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Create Client JS loaded');
    
    // Wait for supabase to be initialized
    const waitForSupabase = () => {
        return new Promise((resolve) => {
            const checkSupabase = () => {
                if (window.supabaseClient) {
                    console.log('Supabase client found');
                    resolve(window.supabaseClient);
                } else {
                    console.log('Waiting for Supabase client...');
                    setTimeout(checkSupabase, 100);
                }
            };
            checkSupabase();
        });
    };
    
    // Wait for Supabase to be initialized before setting up event listeners
    await waitForSupabase();
    
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
    
    // Handle create another client button
    const createAnotherBtn = document.getElementById('create-another');
    if (createAnotherBtn) {
        createAnotherBtn.addEventListener('click', () => {
            document.getElementById('create-client-form').reset();
            document.getElementById('create-client-form').style.display = 'block';
            document.getElementById('qr-container').style.display = 'none';
        });
    }
});

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

// Generate a UUID for database IDs
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Show notification function
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

// Function placeholder for future utility functions

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
        
        // Make sure we have access to the Supabase client
        const supabase = window.supabaseClient;
        if (!supabase) {
            throw new Error('Supabase client not available');
        }
        
        // Generate client code
        const clientCode = generateClientCode();
        console.log('Generated client code:', clientCode);
        
        // Create client in Supabase
        console.log('Attempting to insert client into Supabase...');
        
        // Create the client data object
        const clientData = {
            id: generateUUID(), // Generate a UUID for the ID field
            client_code: clientCode,
            bride_name: brideName,
            groom_name: groomName,
            wedding_date: weddingDate,
            end_date: endDate,
            location: location,
            status: 'active'
        };
        
        console.log('Client data to insert:', clientData);
        
        // Insert the client data with better error handling
        console.log('Inserting client data with ID:', clientData.id);
        
        try {
            // First check if the table exists and has the expected structure
            const { data: tableInfo, error: tableError } = await supabase
                .from('clients')
                .select('*')
                .limit(1);
                
            if (tableError) {
                console.error('Error checking clients table:', tableError);
                throw new Error(`Database table check failed: ${tableError.message}`);
            }
            
            // Log the table structure for debugging
            if (tableInfo && tableInfo.length > 0) {
                console.log('Clients table structure:', Object.keys(tableInfo[0]));
            }
            
            // Try inserting without the ID field first (let Supabase generate it)
            const clientDataWithoutId = {...clientData};
            delete clientDataWithoutId.id;
            
            console.log('Attempting insert without ID field:', clientDataWithoutId);
            const { data, error } = await supabase
                .from('clients')
                .insert([clientDataWithoutId])
                .select();
            
            console.log('Insert response:', { data, error });
            
            if (error) {
                console.error('First insert attempt failed:', error);
                
                // If that fails, try with the ID included
                console.log('Attempting insert with ID field as fallback');
                const { data: dataWithId, error: errorWithId } = await supabase
                    .from('clients')
                    .insert([clientData]);
                
                console.log('Second insert response:', { dataWithId, errorWithId });
                
                if (errorWithId) {
                    console.error('Both insert attempts failed');
                    throw errorWithId;
                }
            }
        } catch (insertError) {
            console.error('Insert operation failed:', insertError);
            throw insertError;
        }
        
        // Add a small delay before verification to ensure database consistency
        console.log('Waiting briefly before verification...');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Verify the client was created by fetching it
        try {
            console.log('Verifying client creation with code:', clientCode);
            const { data: verifyData, error: verifyError } = await supabase
                .from('clients')
                .select('*')
                .eq('client_code', clientCode);
                
            console.log('Verification response:', { verifyData, verifyError });
            
            if (verifyError) {
                console.error('Verification error:', verifyError);
                // Don't throw here, just log the error and continue
                console.log('Continuing despite verification error');
            } else if (!verifyData || verifyData.length === 0) {
                console.warn('Client was not found in verification query, but may still have been created');
            } else {
                console.log('Client verified successfully:', verifyData[0]);
            }
        } catch (verifyError) {
            console.error('Exception during verification:', verifyError);
            // Don't throw here, just log the error and continue
            console.log('Continuing despite verification exception');
        }
        
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
    } finally {
        // Reset button state
        createClientBtn.disabled = false;
        createClientBtn.innerHTML = 'Create Client';
    }
}

// Test Supabase connection
async function testSupabaseConnection() {
    const testBtn = document.getElementById('test-connection-btn');
    const originalText = testBtn.textContent;
    testBtn.disabled = true;
    testBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Testing Connection...';
    
    try {
        console.log('Testing Supabase connection...');
        
        // Make sure we have access to the Supabase client
        const supabase = window.supabaseClient;
        if (!supabase) {
            throw new Error('Supabase client not available. Check if supabase.js is loaded properly.');
        }
        
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
