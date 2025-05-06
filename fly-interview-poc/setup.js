const fs = require('fs');
const readline = require('readline');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('Interview Transcription POC Setup');
console.log('=================================');
console.log('This script will help you set up your environment variables.');
console.log('');

// Check if .env already exists
const envPath = path.join(__dirname, '.env');
const envExists = fs.existsSync(envPath);

if (envExists) {
  console.log('A .env file already exists. Do you want to overwrite it? (yes/no)');
  rl.question('> ', (answer) => {
    if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
      createEnvFile();
    } else {
      console.log('Setup cancelled. Your existing .env file was not modified.');
      rl.close();
    }
  });
} else {
  createEnvFile();
}

function createEnvFile() {
  console.log('');
  console.log('Please enter your OpenAI API key:');
  rl.question('> ', (apiKey) => {
    if (!apiKey) {
      console.log('No API key provided. You can add it later by editing the .env file.');
      apiKey = 'your_openai_api_key_here';
    }

    console.log('');
    console.log('Please enter the port for the server (default: 3000):');
    rl.question('> ', (port) => {
      if (!port) {
        port = '3000';
      }

      const envContent = `# OpenAI API key for transcription
OPENAI_API_KEY=${apiKey}

# Port for the server to listen on
PORT=${port}`;

      fs.writeFileSync(envPath, envContent);
      console.log('');
      console.log('.env file created successfully!');
      console.log('');
      console.log('You can now start the application with:');
      console.log('npm run dev');
      rl.close();
    });
  });
} 