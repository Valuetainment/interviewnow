// Test script for the generate-position Edge Function
// Run with: node scripts/test-position-creation.js

const SUPABASE_URL = 'https://gypnutyegqxelvsqjedu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5cG51dHllZ3F4ZWx2c3FqZWR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU4NzQ1MTUsImV4cCI6MjA2MTQ1MDUxNX0.1GnoF-EZ5jr_DJgcgeCJcqy-NASlEFGt1XavwbiIELA';

const testData = {
  title: "Senior Frontend Developer",
  shortDescription: "Experienced developer to build modern web applications using React, Next.js, and TypeScript.",
  experienceLevel: "senior",
  competencies: [
    {
      name: "React/Next.js",
      description: "Building modern, responsive web applications with React ecosystem",
      suggested_weight: 30
    },
    {
      name: "TypeScript",
      description: "Writing type-safe code and leveraging advanced TypeScript features",
      suggested_weight: 20
    },
    {
      name: "UI/UX Implementation",
      description: "Implementing pixel-perfect designs and ensuring excellent user experience",
      suggested_weight: 20
    },
    {
      name: "Testing",
      description: "Writing comprehensive unit, integration, and e2e tests",
      suggested_weight: 15
    },
    {
      name: "Performance Optimization",
      description: "Optimizing web applications for speed, accessibility, and SEO",
      suggested_weight: 15
    }
  ]
};

async function testGeneratePosition() {
  console.log('Testing generate-position Edge Function...');
  console.log('Request data:', JSON.stringify(testData, null, 2));
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-position`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify(testData)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error ${response.status}: ${errorText}`);
      return;
    }
    
    const data = await response.json();
    console.log('Response received!');
    
    // Verify important fields exist
    const requiredFields = [
      'role_overview',
      'key_responsibilities',
      'required_qualifications',
      'preferred_qualifications',
      'benefits',
      'key_competencies_section',
      'description'
    ];
    
    const missingFields = requiredFields.filter(field => !data[field]);
    
    if (missingFields.length > 0) {
      console.error('Missing required fields:', missingFields);
    } else {
      console.log('✅ All required fields present');
    }
    
    // Check competencies were preserved
    if (data.competencies && data.competencies.length === 5) {
      console.log('✅ Competencies correctly processed');
    } else {
      console.error('❌ Competencies missing or incorrect count:', data.competencies?.length || 0);
    }
    
    // Print selected sections for review
    console.log('\n--- Role Overview ---');
    console.log(data.role_overview);
    
    console.log('\n--- Key Responsibilities (sample) ---');
    const responsibilities = data.key_responsibilities.split('\n').slice(0, 3);
    console.log(responsibilities.join('\n') + '...');
    
    console.log('\n--- Success! Full response saved to test-position-response.json ---');
    
    // Save the full response to a file for reference
    require('fs').writeFileSync(
      'test-position-response.json', 
      JSON.stringify(data, null, 2)
    );
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testGeneratePosition(); 