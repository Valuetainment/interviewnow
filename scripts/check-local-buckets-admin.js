// Script to check storage buckets using the service role key
import { createClient } from '@supabase/supabase-js';

// Local Supabase credentials
const supabaseUrl = 'http://127.0.0.1:54321';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, serviceRoleKey);

// Function to list buckets
async function listBuckets() {
  try {
    console.log('Listing storage buckets in local Supabase instance (admin mode)...');
    
    const { data, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('Error listing buckets:', error.message);
      return;
    }
    
    if (data && data.length > 0) {
      console.log('Found buckets:');
      data.forEach(bucket => {
        console.log(`- ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
      });
    } else {
      console.log('No buckets found');
    }
  } catch (error) {
    console.error('Unexpected error listing buckets:', error);
  }
}

// Execute the function
listBuckets()
  .then(() => {
    process.exit(0);
  })
  .catch(error => {
    console.error('Operation failed:', error);
    process.exit(1);
  }); 