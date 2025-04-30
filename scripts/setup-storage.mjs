#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

// Setup environment variables
config();

// Get the directory path
const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

// Load environment variables from .env
let supabaseUrl = process.env.VITE_SUPABASE_URL;
let supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

// If not found in environment, try to read from client.ts
if (!supabaseUrl || !supabaseAnonKey) {
  try {
    const clientFilePath = join(rootDir, 'src', 'integrations', 'supabase', 'client.ts');
    const clientContent = fs.readFileSync(clientFilePath, 'utf8');
    
    // Extract URL and key from client.ts using regex
    const urlMatch = clientContent.match(/SUPABASE_URL\s*=\s*['"]([^'"]+)['"]/);
    const keyMatch = clientContent.match(/SUPABASE_PUBLISHABLE_KEY\s*=\s*['"]([^'"]+)['"]/);
    
    if (urlMatch && urlMatch[1]) supabaseUrl = urlMatch[1];
    if (keyMatch && keyMatch[1]) supabaseAnonKey = keyMatch[1];
  } catch (error) {
    console.error('Error reading Supabase credentials:', error);
  }
}

// Verify credentials
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase credentials not found. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
  process.exit(1);
}

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