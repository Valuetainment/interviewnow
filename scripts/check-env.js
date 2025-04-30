#!/usr/bin/env node

/**
 * Script to check if all required environment variables are set
 * Run with: node scripts/check-env.js
 */

import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { fileURLToPath } from 'url';

// Fallback for chalk if not available
const chalkFallback = {
  green: (t) => t,
  red: (t) => t,
  yellow: (t) => t,
  blue: (t) => t
};

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use chalk if available, otherwise use fallback
const colorize = chalk || chalkFallback;

// Define required and optional environment variables
const REQUIRED_VARS = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'VITE_OPENAI_API_KEY',
];

const OPTIONAL_VARS = [
  'VITE_VIDEOSDK_API_KEY',
  'VITE_PDFCO_API_KEY',
];

// Check if .env file exists
const envPath = path.join(process.cwd(), '.env');
const envExists = fs.existsSync(envPath);

console.log(colorize.blue('\n📋 Environment Variables Check\n'));

if (!envExists) {
  console.log(colorize.red('❌ .env file not found'));
  console.log(colorize.yellow('Please create a .env file in the project root with the required variables.'));
  process.exit(1);
}

// Read and parse .env file
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = envContent.split('\n').reduce((acc, line) => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    acc[match[1]] = match[2];
  }
  return acc;
}, {});

// Check required vars
let missingRequired = false;
console.log(colorize.blue('Required Variables:'));
for (const varName of REQUIRED_VARS) {
  if (!envVars[varName] || envVars[varName].trim() === '') {
    console.log(`  ${colorize.red('✗')} ${varName}: Missing or empty`);
    missingRequired = true;
  } else {
    const value = envVars[varName];
    const maskedValue = value.length > 8 
      ? `${value.substring(0, 4)}...${value.substring(value.length - 4)}`
      : '********';
    console.log(`  ${colorize.green('✓')} ${varName}: ${maskedValue}`);
  }
}

// Check optional vars
console.log(colorize.blue('\nOptional Variables:'));
for (const varName of OPTIONAL_VARS) {
  if (!envVars[varName] || envVars[varName].trim() === '') {
    console.log(`  ${colorize.yellow('!')} ${varName}: Not set (optional)`);
  } else {
    const value = envVars[varName];
    const maskedValue = value.length > 8 
      ? `${value.substring(0, 4)}...${value.substring(value.length - 4)}`
      : '********';
    console.log(`  ${colorize.green('✓')} ${varName}: ${maskedValue}`);
  }
}

console.log('\n');

if (missingRequired) {
  console.log(colorize.red('❌ Some required environment variables are missing.'));
  console.log(colorize.yellow('Please update your .env file with the missing variables.'));
  process.exit(1);
} else {
  console.log(colorize.green('✅ All required environment variables are set.'));
  console.log(colorize.blue('You can now run the application with "npm run dev"'));
} 