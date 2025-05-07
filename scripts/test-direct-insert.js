// Script to test direct position insertion using service role key (bypassing RLS)
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

// Initialize dotenv
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

// Get credentials from environment
const supabaseUrl = process.env.VITE_SUPABASE_URL;

// You'll need to get this from the Supabase dashboard or by running 'supabase secrets list'
// For testing purposes only, we're hard-coding it here - NEVER DO THIS IN PRODUCTION
let serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Check Supabase secrets file if environment variable isn't set
if (!serviceRoleKey) {
  const secretsPath = join(__dirname, '..', 'supabase_secrets.env');
  if (fs.existsSync(secretsPath)) {
    try {
      const secretsContent = fs.readFileSync(secretsPath, 'utf8');
      const serviceRoleKeyMatch = secretsContent.match(/SERVICE_ROLE_KEY=([^\n]+)/);
      if (serviceRoleKeyMatch && serviceRoleKeyMatch[1]) {
        serviceRoleKey = serviceRoleKeyMatch[1];
      }
    } catch (err) {
      console.error('Error reading secrets file:', err);
    }
  }
}

async function testDirectInsert() {
  console.log('Testing direct position insertion using service role key...');
  
  if (!supabaseUrl) {
    console.error('Missing Supabase URL in .env file');
    return;
  }
  
  if (!serviceRoleKey) {
    console.error('Missing service role key. Please set SUPABASE_SERVICE_ROLE_KEY in .env');
    console.log('You can get this key from the Supabase dashboard or by running:');
    console.log('  npx supabase secrets list');
    
    // For testing purposes, try using the anon key instead
    serviceRoleKey = process.env.VITE_SUPABASE_ANON_KEY;
    console.log('Trying to use the anon key instead for testing...');
  }
  
  console.log('Using Supabase URL:', supabaseUrl);
  
  // Create a Supabase client with service role key
  const adminSupabase = createClient(supabaseUrl, serviceRoleKey);
  
  try {
    // 1. First, get a tenant ID to use
    console.log('\n1. Fetching a tenant ID to use:');
    const { data: tenants, error: tenantError } = await adminSupabase
      .from('tenants')
      .select('id, name')
      .limit(1);
      
    if (tenantError) {
      console.error('Error fetching tenants:', tenantError.message);
      return;
    }
    
    if (!tenants || tenants.length === 0) {
      console.error('No tenants found in the database');
      return;
    }
    
    const tenantId = tenants[0].id;
    console.log(`Using tenant: ${tenants[0].name} (${tenantId})`);
    
    // 2. Insert a test position directly
    console.log('\n2. Inserting a test position:');
    const testPosition = {
      tenant_id: tenantId,
      title: 'Admin Test Position',
      description: 'This position was created via direct admin access',
      role_overview: 'Testing admin access',
      key_responsibilities: 'Testing database access',
      required_qualifications: 'Admin privileges',
      preferred_qualifications: 'Testing skills',
      benefits: 'Knowledge of what went wrong',
      key_competencies_section: 'Debugging, Persistence',
      experience_level: 'senior',
    };
    
    const { data: position, error: positionError } = await adminSupabase
      .from('positions')
      .insert(testPosition)
      .select('id, title')
      .single();
      
    if (positionError) {
      console.error('Error inserting position:', positionError.message);
    } else {
      console.log('Position created successfully:', position);
      
      // 3. Verify the position was created by fetching it
      console.log('\n3. Verifying position was created:');
      const { data: verifyData, error: verifyError } = await adminSupabase
        .from('positions')
        .select('id, title, description, tenant_id, role_overview')
        .eq('id', position.id)
        .single();
        
      if (verifyError) {
        console.error('Error verifying position:', verifyError.message);
      } else {
        console.log('Position verified:', verifyData);
      }
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testDirectInsert(); 