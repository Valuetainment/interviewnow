/**
 * OpenAI Whisper API Integration Test
 * 
 * This script tests the integration between our WebSocket server and the OpenAI Whisper API.
 * It replaces the simulated transcription with actual API calls to validate the full workflow.
 */

require('dotenv').config();
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const { FormData } = require('formdata-node');
const { fileFromPath } = require('formdata-node/file-from-path');

// Validate OpenAI API key
if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
  console.error('Error: Valid OpenAI API key is required in .env file');
  process.exit(1);
}

// Function to transcribe audio using OpenAI Whisper API
async function transcribeAudio(audioFilePath) {
  try {
    console.log(`Transcribing audio file: ${audioFilePath}`);
    
    const form = new FormData();
    form.append('file', await fileFromPath(audioFilePath));
    form.append('model', 'whisper-1');
    
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: form
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    console.log(`Transcription result: "${result.text}"`);
    return result.text;
  } catch (error) {
    console.error('Error transcribing audio:', error);
    throw error;
  }
}

// Main test function
async function runTest() {
  console.log('=== OpenAI Whisper API Integration Test ===');
  
  try {
    // Check for test audio file in test-assets directory
    const testAudioPath = path.join(__dirname, 'test-assets', 'test-audio.mp3');
    
    if (!fs.existsSync(testAudioPath)) {
      console.error(`Test audio file not found: ${testAudioPath}`);
      console.log('\nPlease add a test-audio.mp3 file to the test-assets directory.');
      console.log('See test-assets/README.md for details on creating this file.');
      process.exit(1);
    }
    
    // Test Whisper API directly
    console.log('Testing OpenAI Whisper API directly...');
    const transcript = await transcribeAudio(testAudioPath);
    
    console.log('\n=== Test Results ===');
    console.log('✅ OpenAI Whisper API integration test passed!');
    console.log(`Transcript: "${transcript}"`);
    
    console.log('\n=== Next Steps ===');
    console.log('1. Update index.js to use this transcription function');
    console.log('2. Deploy to Fly.io for full end-to-end testing');
    console.log('3. Test with multiple concurrent sessions');
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
runTest();
