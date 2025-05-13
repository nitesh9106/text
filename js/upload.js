// Upload photos functionality
document.addEventListener('DOMContentLoaded', async () => {
    // Load client dropdown
    await loadClientDropdown();
    
    // Initialize dropzone
    initializeDropzone();
    
    // Initialize compression slider
    initializeCompressionSlider();
    
    // Handle form submission
    const uploadForm = document.getElementById('upload-form');
    if (uploadForm) {
        uploadForm.addEventListener('submit', handleUpload);
    }
});

// Load client dropdown and check storage bucket
async function loadClientDropdown() {
    try {
        // First check if the storage bucket exists
        console.log('Checking if storage bucket exists...');
        try {
            const { data: buckets, error: bucketsError } = await supabase
                .storage
                .listBuckets();
                
            console.log('Available buckets:', buckets);
            
            if (bucketsError) {
                console.error('Error checking buckets:', bucketsError);
            } else {
                // Check if 'clients' bucket exists
                const clientsBucketExists = buckets && buckets.some(bucket => bucket.name === 'clients');
                
                if (!clientsBucketExists) {
                    console.log('Creating clients bucket...');
                    try {
                        // Try to create the bucket
                        const { error: createError } = await supabase.storage.createBucket('clients', {
                            public: true
                        });
                        
                        if (createError) {
                            console.error('Error creating clients bucket:', createError);
                        } else {
                            console.log('Clients bucket created successfully');
                        }
                    } catch (bucketCreateError) {
                        console.error('Exception creating bucket:', bucketCreateError);
                    }
                } else {
                    console.log('Clients bucket already exists');
                }
            }
        } catch (storageError) {
            console.error('Error checking storage:', storageError);
        }
        
        // Get active clients
        const { data: clients, error } = await supabase
            .from('clients')
            .select('*')
            .eq('status', 'active')
            .order('wedding_date', { ascending: false });
        
        if (error) throw error;
        
        const clientSelect = document.getElementById('client-select');
        
        if (clients && clients.length > 0) {
            clients.forEach(client => {
                const option = document.createElement('option');
                option.value = client.client_code;
                option.textContent = `${client.bride_name} & ${client.groom_name} (${client.client_code})`;
                clientSelect.appendChild(option);
            });
            
            // Enable upload button if clients exist
            document.getElementById('upload-btn').disabled = false;
        } else {
            // Add no clients option
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'No active clients found';
            clientSelect.appendChild(option);
            
            // Show notification
            showNotification('No active clients found. Please create a client first.', 'warning');
        }
    } catch (error) {
        console.error('Error loading clients:', error);
        showNotification('Failed to load clients', 'error');
    }
}

// Initialize dropzone for file uploads
function initializeDropzone() {
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('file-input');
    
    // Handle click on dropzone
    dropzone.addEventListener('click', () => {
        fileInput.click();
    });
    
    // Handle file selection
    fileInput.addEventListener('change', handleFileSelection);
    
    // Handle drag and drop
    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
    });
    
    dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('dragover');
    });
    
    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        
        if (e.dataTransfer.files.length > 0) {
            fileInput.files = e.dataTransfer.files;
            handleFileSelection({ target: fileInput });
        }
    });
}

// Handle file selection
function handleFileSelection(e) {
    const files = e.target.files;
    const fileList = document.getElementById('file-list');
    const fileCount = document.getElementById('file-count');
    
    // Update file count
    fileCount.textContent = files.length;
    
    // Clear file list
    fileList.innerHTML = '';
    
    // Display selected files
    Array.from(files).forEach((file, index) => {
        // Create file item
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        
        // Create file preview
        const filePreview = document.createElement('img');
        filePreview.src = URL.createObjectURL(file);
        filePreview.alt = file.name;
        fileItem.appendChild(filePreview);
        
        // Create file info
        const fileInfo = document.createElement('div');
        fileInfo.className = 'file-info';
        
        const fileName = document.createElement('div');
        fileName.className = 'file-name';
        fileName.textContent = file.name;
        fileInfo.appendChild(fileName);
        
        const fileSize = document.createElement('div');
        fileSize.className = 'file-size';
        fileSize.textContent = formatFileSize(file.size);
        fileInfo.appendChild(fileSize);
        
        fileItem.appendChild(fileInfo);
        
        // Create cover photo checkbox
        const coverContainer = document.createElement('div');
        coverContainer.className = 'cover-container';
        
        const coverLabel = document.createElement('label');
        coverLabel.className = 'cover-label';
        
        const coverInput = document.createElement('input');
        coverInput.type = 'radio';
        coverInput.name = 'cover-photo';
        coverInput.value = index;
        
        // Make first photo the default cover
        if (index === 0) {
            coverInput.checked = true;
        }
        
        coverLabel.appendChild(coverInput);
        coverLabel.appendChild(document.createTextNode(' Cover Photo'));
        
        coverContainer.appendChild(coverLabel);
        fileItem.appendChild(coverContainer);
        
        // Add file item to list
        fileList.appendChild(fileItem);
    });
    
    // Enable upload button if files are selected
    document.getElementById('upload-btn').disabled = files.length === 0;
}

// Initialize compression slider
function initializeCompressionSlider() {
    const slider = document.getElementById('compression-level');
    const value = document.getElementById('compression-value');
    
    // Update value display on slider change
    slider.addEventListener('input', () => {
        value.textContent = `${slider.value}%`;
    });
}

// Handle upload form submission
async function handleUpload(e) {
    e.preventDefault();
    
    const clientCode = document.getElementById('client-select').value;
    const files = document.getElementById('file-input').files;
    const compressionLevel = document.getElementById('compression-level').value;
    const coverPhotoIndex = document.querySelector('input[name="cover-photo"]:checked')?.value || 0;
    
    // Validate client selection
    if (!clientCode) {
        showNotification('Please select a client', 'error');
        return;
    }
    
    // Validate file selection
    if (files.length === 0) {
        showNotification('Please select at least one photo', 'error');
        return;
    }
    
    // Show progress container
    const progressContainer = document.getElementById('progress-container');
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    const uploadStatus = document.getElementById('upload-status');
    
    progressContainer.style.display = 'block';
    progressBar.style.width = '0%';
    progressText.textContent = '0%';
    uploadStatus.textContent = 'Compressing images...';
    
    // Disable upload button
    const uploadBtn = document.getElementById('upload-btn');
    uploadBtn.disabled = true;
    
    try {
        // Compress and upload each file
        const totalFiles = files.length;
        let uploadedFiles = 0;
        let coverPhotoUrl = null;
        
        for (let i = 0; i < totalFiles; i++) {
            const file = files[i];
            const isCoverPhoto = parseInt(coverPhotoIndex) === i;
            
            // Update status
            uploadStatus.textContent = `Compressing image ${i + 1} of ${totalFiles}...`;
            
            // Compress image
            const compressedFile = await compressImage(file, compressionLevel);
            
            // Generate unique filename
            const timestamp = new Date().getTime();
            const fileExtension = file.name.split('.').pop();
            const fileName = `${clientCode}_${timestamp}_${i}.${fileExtension}`;
            
            // Update status
            uploadStatus.textContent = `Uploading image ${i + 1} of ${totalFiles}...`;
            
            // Upload to Supabase Storage with better error handling
            try {
                console.log(`Uploading file ${i+1}/${totalFiles}: ${fileName}`);
                
                const { data, error } = await supabase.storage
                    .from('clients')
                    .upload(`${clientCode}/${fileName}`, compressedFile);
                
                if (error) {
                    console.error(`Storage upload error for file ${i+1}:`, error);
                    throw error;
                }
                
                console.log(`File ${i+1} uploaded successfully`);
                
                // Get public URL
                const { data: urlData } = supabase.storage
                    .from('clients')
                    .getPublicUrl(`${clientCode}/${fileName}`);
                
                if (!urlData || !urlData.publicUrl) {
                    console.error(`Failed to get public URL for file ${i+1}`);
                    throw new Error('Failed to get public URL for uploaded file');
                }
                
                const photoUrl = urlData.publicUrl;
                console.log(`Public URL for file ${i+1}:`, photoUrl);
                
                // First check the photos table structure
                if (i === 0) {
                    console.log('Checking photos table structure...');
                    const { data: tableInfo, error: tableError } = await supabase
                        .from('photos')
                        .select('*')
                        .limit(1);
                        
                    if (tableError) {
                        console.error('Error checking photos table:', tableError);
                    } else {
                        // Log the table structure for debugging
                        if (tableInfo && tableInfo.length > 0) {
                            console.log('Photos table structure:', Object.keys(tableInfo[0]));
                        }
                    }
                }
                
                // Save cover photo URL
                if (isCoverPhoto) {
                    coverPhotoUrl = photoUrl;
                    
                    console.log(`Updating client ${clientCode} with cover photo`);
                    const { error: updateError } = await supabase
                        .from('clients')
                        .update({ cover_photo: photoUrl })
                        .eq('client_code', clientCode);
                        
                    if (updateError) {
                        console.error('Error updating client with cover photo:', updateError);
                        // Continue despite error
                    }
                }
                
                // Prepare photo metadata
                const photoData = {
                    client_code: clientCode,
                    is_cover: isCoverPhoto,
                    uploaded_at: new Date().toISOString()
                };
                
                // Add URL field (could be named differently in your schema)
                photoData.url = photoUrl;
                photoData.photo_url = photoUrl; // Alternative field name
                photoData.image_url = photoUrl; // Another alternative
                
                console.log(`Saving photo metadata for file ${i+1}:`, photoData);
                
                // Save photo metadata to database
                const { error: insertError } = await supabase
                    .from('photos')
                    .insert([photoData]);
                    
                if (insertError) {
                    console.error(`Error inserting photo metadata for file ${i+1}:`, insertError);
                    // Continue despite error
                }
            } catch (fileError) {
                console.error(`Error processing file ${i+1}:`, fileError);
                // Continue with next file instead of stopping the whole upload
                continue;
            }
            
            // Update progress
            uploadedFiles++;
            const progress = Math.round((uploadedFiles / totalFiles) * 100);
            progressBar.style.width = `${progress}%`;
            progressText.textContent = `${progress}%`;
        }
        
        // Update status
        uploadStatus.textContent = 'Upload complete!';
        
        // Show success notification
        showNotification(`Successfully uploaded ${totalFiles} photos`, 'success');
        
        // Reset form after 2 seconds
        setTimeout(() => {
            document.getElementById('upload-form').reset();
            document.getElementById('file-list').innerHTML = '';
            document.getElementById('file-count').textContent = '0';
            progressContainer.style.display = 'none';
            uploadBtn.disabled = false;
        }, 2000);
    } catch (error) {
        console.error('Error uploading photos:', error);
        uploadStatus.textContent = 'Upload failed';
        
        // Provide more detailed error message
        let errorMessage = 'Failed to upload photos';
        if (error.message) {
            errorMessage += `: ${error.message}`;
        }
        if (error.details || error.hint) {
            errorMessage += ` (${error.details || error.hint})`;
        }
        
        showNotification(errorMessage, 'error');
        
        // Display error on the page for debugging
        const errorElement = document.createElement('div');
        errorElement.className = 'error-details';
        errorElement.innerHTML = `<h3>Error Details (for debugging):</h3><pre>${JSON.stringify(error, null, 2)}</pre>`;
        document.querySelector('.content-card').appendChild(errorElement);
        
        // Reset button state
        uploadBtn.disabled = false;
        uploadBtn.innerHTML = 'Upload Photos';
    }
}

// Compress image using browser-image-compression
async function compressImage(file, quality) {
    const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        quality: parseInt(quality) / 100
    };
    
    try {
        return await imageCompression(file, options);
    } catch (error) {
        console.error('Error compressing image:', error);
        // Return original file if compression fails
        return file;
    }
}
