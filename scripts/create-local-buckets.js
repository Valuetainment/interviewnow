// Script to create storage buckets in the local Supabase instance
import { createClient } from '@supabase/supabase-js';

// Local Supabase credentials
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

// Create Supabase client with service role key for admin operations
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const supabase = createClient(supabaseUrl, serviceRoleKey);

// Function to create a bucket if it doesn't exist
async function createBucketIfNotExists(
  bucketId,
  allowedMimeTypes,
  fileSizeLimit
) {
  try {
    // Check if bucket exists
    const { data: existingBuckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError.message);
      return;
    }
    
    const bucketExists = existingBuckets?.some(bucket => bucket.name === bucketId);
    
    if (bucketExists) {
      console.log(`Bucket ${bucketId} already exists`);
      return;
    }
    
    // Create bucket if it doesn't exist
    const { data, error } = await supabase.storage.createBucket(bucketId, {
      public: false,
      fileSizeLimit: fileSizeLimit,
      allowedMimeTypes: allowedMimeTypes
    });
    
    if (error) {
      console.error(`Error creating bucket ${bucketId}:`, error.message);
    } else {
      console.log(`Created bucket ${bucketId} successfully`);
    }
  } catch (error) {
    console.error(`Unexpected error creating bucket ${bucketId}:`, error);
  }
}

// Main function to create all required buckets
async function createStorageBuckets() {
  console.log('Setting up storage buckets in local Supabase instance...');
  
  // Create resumes bucket (PDFs, 10MB limit)
  await createBucketIfNotExists(
    'resumes',
    ['application/pdf'],
    10 * 1024 * 1024 // 10MB
  );
  
  // Create videos bucket (MP4/WebM, 100MB limit)
  await createBucketIfNotExists(
    'videos',
    ['video/mp4', 'video/webm'],
    100 * 1024 * 1024 // 100MB
  );
  
  // Create audio bucket (WebM/MP3/WAV, 50MB limit)
  await createBucketIfNotExists(
    'audio',
    ['audio/webm', 'audio/mp3', 'audio/wav'],
    50 * 1024 * 1024 // 50MB
  );
  
  console.log('Storage setup complete!');
}

// Execute the function
createStorageBuckets()
  .then(() => {
    console.log('Storage initialization complete');
    process.exit(0);
  })
  .catch(error => {
    console.error('Storage initialization failed:', error);
    process.exit(1);
  }); 