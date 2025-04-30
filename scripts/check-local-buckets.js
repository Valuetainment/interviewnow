// Script to check storage buckets in the local Supabase instance
import { createClient } from '@supabase/supabase-js';

// Local Supabase credentials
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Function to list buckets
async function listBuckets() {
  try {
    console.log('Listing storage buckets in local Supabase instance...');
    
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