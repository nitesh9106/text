// Supabase Edge Function for automatic deletion of expired clients
// This file should be deployed as a Supabase Edge Function
// It will run on a schedule to check for expired clients and delete their photos

// Import required dependencies
// Note: When deploying to Supabase Edge Functions, you'll need to include these in the package.json
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with environment variables
// These will be set in the Supabase Edge Function environment
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Main function to check and process expired clients
export async function deleteExpiredClients() {
  try {
    console.log('Starting expired clients check...');
    
    // Get current date
    const today = new Date().toISOString().split('T')[0];
    
    // Find clients where end_date < today and status is 'active'
    const { data: expiredClients, error: clientsError } = await supabase
      .from('clients')
      .select('*')
      .eq('status', 'active')
      .lt('end_date', today);
    
    if (clientsError) {
      throw clientsError;
    }
    
    console.log(`Found ${expiredClients.length} expired clients`);
    
    // Process each expired client
    for (const client of expiredClients) {
      console.log(`Processing expired client: ${client.client_code}`);
      
      // 1. Get all photos for this client
      const { data: photos, error: photosError } = await supabase
        .from('photos')
        .select('url')
        .eq('client_code', client.client_code);
      
      if (photosError) {
        console.error(`Error getting photos for client ${client.client_code}:`, photosError);
        continue;
      }
      
      // 2. Delete photos from storage
      if (photos && photos.length > 0) {
        // Extract file paths from URLs
        const filePaths = photos.map(photo => {
          const url = new URL(photo.url);
          const pathMatch = url.pathname.match(/\/clients\/([^/]+\/[^/]+)$/);
          return pathMatch ? pathMatch[1] : null;
        }).filter(Boolean);
        
        console.log(`Deleting ${filePaths.length} photos from storage for client ${client.client_code}`);
        
        // Delete files from storage
        if (filePaths.length > 0) {
          const { error: storageError } = await supabase.storage
            .from('clients')
            .remove(filePaths);
          
          if (storageError) {
            console.error(`Error deleting files from storage for client ${client.client_code}:`, storageError);
          }
        }
      }
      
      // 3. Delete photo records from database
      const { error: deletePhotosError } = await supabase
        .from('photos')
        .delete()
        .eq('client_code', client.client_code);
      
      if (deletePhotosError) {
        console.error(`Error deleting photo records for client ${client.client_code}:`, deletePhotosError);
      }
      
      // 4. Update client status to 'expired'
      const { error: updateClientError } = await supabase
        .from('clients')
        .update({ status: 'expired' })
        .eq('id', client.id);
      
      if (updateClientError) {
        console.error(`Error updating client status for ${client.client_code}:`, updateClientError);
      } else {
        console.log(`Successfully marked client ${client.client_code} as expired`);
      }
    }
    
    console.log('Expired clients processing completed');
    return { success: true, processedCount: expiredClients.length };
  } catch (error) {
    console.error('Error in deleteExpiredClients function:', error);
    return { success: false, error: error.message };
  }
}

// Handler for Supabase Edge Function
// This will be called when the function is invoked
export default async function(req) {
  // Run the deletion process
  const result = await deleteExpiredClients();
  
  // Return the result
  return new Response(
    JSON.stringify(result),
    { headers: { 'Content-Type': 'application/json' } }
  );
}
