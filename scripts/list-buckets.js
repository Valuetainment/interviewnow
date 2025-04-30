// Script to list storage buckets in the Supabase project
import { createClient } from '@supabase/supabase-js';

// Supabase credentials
const supabaseUrl = 'https://gypnutyegqxelvsqjedu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5cG51dHllZ3F4ZWx2c3FqZWR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU4NzQ1MTUsImV4cCI6MjA2MTQ1MDUxNX0.1GnoF-EZ5jr_DJgcgeCJcqy-NASlEFGt1XavwbiIELA';

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Function to list buckets
async function listBuckets() {
  try {
    console.log('Listing storage buckets...');
    
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