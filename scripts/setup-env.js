#!/usr/bin/env node

/**
 * Interactive script to set up environment variables
 * Run with: node scripts/setup-env.js
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const envPath = path.join(process.cwd(), '.env');
const envExamplePath = path.join(process.cwd(), 'env.example');

console.log('\n🔧 Interview AI Platform - Environment Setup\n');

// Check if .env already exists
if (fs.existsSync(envPath)) {
  rl.question('⚠️ .env file already exists. Overwrite? (y/N): ', (answer) => {
    if (answer.toLowerCase() !== 'y') {
      console.log('\n❌ Setup canceled. Existing .env file preserved.');
      rl.close();
      return;
    }
    setupEnv();
  });
} else {
  setupEnv();
}

function setupEnv() {
  // Make sure we have an example file to work from
  if (!fs.existsSync(envExamplePath)) {
    console.error('\n❌ env.example file not found. Please create it first.');
    rl.close();
    return;
  }

  // Read the example file
  const envExample = fs.readFileSync(envExamplePath, 'utf8');
  const envLines = envExample.split('\n');
  
  // Extract variables from example file
  const variables = [];
  let currentComment = '';
  
  envLines.forEach(line => {
    if (line.trim() === '' || line.trim().startsWith('#')) {
      if (line.trim().startsWith('#')) {
        currentComment = line.trim();
      }
      return;
    }
    
    const [key, value] = line.split('=');
    if (key && value !== undefined) {
      variables.push({
        key: key.trim(),
        example: value.trim(),
        comment: currentComment
      });
      currentComment = '';
    }
  });

  // Ask for each variable
  askForVariable(variables, 0, {});
}

function askForVariable(variables, index, results) {
  if (index >= variables.length) {
    writeEnvFile(variables, results);
    return;
  }
  
  const variable = variables[index];
  console.log(`\n${variable.comment}`);
  
  rl.question(`Enter ${variable.key} (example: ${variable.example}): `, (answer) => {
    results[variable.key] = answer || variable.example;
    askForVariable(variables, index + 1, results);
  });
}

function writeEnvFile(variables, results) {
  let envContent = '';
  let currentComment = '';
  
  // Reconstruct the file with comments and entered values
  variables.forEach(variable => {
    if (variable.comment && variable.comment !== currentComment) {
      envContent += `${variable.comment}\n`;
      currentComment = variable.comment;
    }
    envContent += `${variable.key}=${results[variable.key]}\n`;
  });
  
  // Write the file
  fs.writeFileSync(envPath, envContent);
  
  console.log('\n✅ Environment variables have been set up successfully!');
  console.log(`💾 Configuration saved to: ${envPath}`);
  console.log('\n📋 Next steps:');
  console.log('1. Run "node scripts/check-env.js" to verify your configuration');
  console.log('2. Run "npm run dev" to start the development server');
  
  rl.close();
} 