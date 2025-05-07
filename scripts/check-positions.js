// Simple script to check positions table contents
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Initialize dotenv
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

async function checkPositions() {
  console.log('Checking positions table...');
  
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase credentials in .env file');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  try {
    // 1. Check database schema for positions table
    console.log('Checking positions table schema...');
    const { data: schema, error: schemaError } = await supabase
      .from('positions')
      .select('*')
      .limit(1);
      
    if (schemaError) {
      console.error('Error querying positions schema:', schemaError);
    } else {
      console.log('Positions table exists. Sample fields:', schema.length ? Object.keys(schema[0]).join(', ') : 'No records');
    }
    
    // 2. Check for existing records
    console.log('\nChecking for position records...');
    const { data: positions, error: positionsError } = await supabase
      .from('positions')
      .select('id, title, description, created_at, role_overview')
      .order('created_at', { ascending: false });
      
    if (positionsError) {
      console.error('Error querying positions:', positionsError);
    } else {
      console.log(`Found ${positions.length} position records`);
      
      if (positions.length > 0) {
        console.log('\nMost recent positions:');
        positions.slice(0, 3).forEach(pos => {
          console.log(`- ${pos.title} (${pos.id})`);
          console.log(`  Created: ${new Date(pos.created_at).toLocaleString()}`);
          console.log(`  Has role_overview: ${Boolean(pos.role_overview)}`);
          console.log(`  Description: ${pos.description ? pos.description.substring(0, 100) + '...' : 'None'}`);
          console.log('');
        });
      }
    }
    
    // 3. Check if the enhanced_positions migration has been applied
    console.log('\nChecking if the enhanced_positions migration has been applied...');
    try {
      const { data: testQuery, error: testError } = await supabase
        .from('positions')
        .select('role_overview')
        .limit(1);
        
      if (testError && testError.message.includes('column "role_overview" does not exist')) {
        console.log('The enhanced_positions migration has NOT been applied yet!');
      } else {
        console.log('The enhanced_positions migration has been applied.');
      }
    } catch (error) {
      console.error('Error checking migration status:', error);
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

checkPositions(); 