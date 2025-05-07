// Script to test Row Level Security policies for positions table
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Initialize dotenv
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

async function testRLSPolicies() {
  console.log('Testing RLS policies for positions table...');
  
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase credentials in .env file');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  try {
    // 1. Check RLS policies using the Postgres metadata tables
    console.log('\n1. Listing all RLS policies for positions table:');
    // This requires admin privileges, which we don't have with anon key, but we can try
    const { data: rlsPolicies, error: rlsError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'positions');
      
    if (rlsError) {
      console.error('Error fetching RLS policies (expected with anon key):', rlsError.message);
    } else {
      console.log('Policies found:', rlsPolicies);
    }
    
    // 2. Try to insert a test position without authentication
    console.log('\n2. Trying to insert a position without authentication:');
    const { data: insertResult, error: insertError } = await supabase
      .from('positions')
      .insert({
        title: 'Test Position',
        description: 'Testing RLS policies',
        tenant_id: '00000000-0000-0000-0000-000000000000', // Fake UUID
      })
      .select('id');
      
    if (insertError) {
      console.log('Insert failed (expected with RLS):', insertError.message);
    } else {
      console.log('Insert succeeded (unexpected):', insertResult);
    }
    
    // 3. Try to authenticate and then test RLS
    console.log('\n3. Attempting to sign in with test credentials:');
    try {
      // You'll need to create a test user and add credentials to .env
      const testEmail = process.env.TEST_USER_EMAIL;
      const testPassword = process.env.TEST_USER_PASSWORD;
      
      if (!testEmail || !testPassword) {
        console.log('No test credentials found in .env file');
      } else {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: testEmail,
          password: testPassword,
        });
        
        if (authError) {
          console.error('Authentication failed:', authError.message);
        } else {
          console.log('Authentication successful:', authData.user.id);
          
          // Get session information
          const { data: session } = await supabase.auth.getSession();
          console.log('Session data:', session);
          
          // Try inserting with authentication
          console.log('\n4. Trying to insert a position with authentication:');
          const { data: authInsertResult, error: authInsertError } = await supabase
            .from('positions')
            .insert({
              title: 'Test Position With Auth',
              description: 'Testing RLS policies with authentication',
              tenant_id: session?.session?.user?.app_metadata?.tenant_id,
            })
            .select('id');
            
          if (authInsertError) {
            console.log('Authenticated insert failed:', authInsertError.message);
          } else {
            console.log('Authenticated insert succeeded:', authInsertResult);
          }
        }
      }
    } catch (authTestError) {
      console.error('Error during authentication test:', authTestError);
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testRLSPolicies(); 