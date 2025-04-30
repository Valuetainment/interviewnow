// Script to create storage buckets for the AI Interview Insights Platform
import { createClient } from '@supabase/supabase-js';

// Supabase credentials
const supabaseUrl = 'https://gypnutyegqxelvsqjedu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5cG51dHllZ3F4ZWx2c3FqZWR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU4NzQ1MTUsImV4cCI6MjA2MTQ1MDUxNX0.1GnoF-EZ5jr_DJgcgeCJcqy-NASlEFGt1XavwbiIELA';

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
  console.log('Setting up storage buckets...');
  
  // Create resumes bucket (PDFs, 10MB limit)
  await createBucketIfNotExists(
    'resumes',
    ['application/pdf'],
    10 * 1024 * 1024 // 10MB
  );
  
  // Create videos bucket (MP4/WebM, 1GB limit)
  await createBucketIfNotExists(
    'videos',
    ['video/mp4', 'video/webm'],
    1024 * 1024 * 1024 // 1GB
  );
  
  // Create audio bucket (WebM/MP3/WAV, 100MB limit)
  await createBucketIfNotExists(
    'audio',
    ['audio/webm', 'audio/mp3', 'audio/wav'],
    100 * 1024 * 1024 // 100MB
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