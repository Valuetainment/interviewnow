# Automated Testing Guide

This document provides a comprehensive overview of all automated tests available in the AI Interview Insights Platform. Use this guide to understand what tests are available, how to run them, and what they validate.

## Table of Contents

1. [Environment Setup](#environment-setup)
2. [Database and Authorization Tests](#database-and-authorization-tests)
   - [RLS Policies Test](#rls-policies-test)
   - [Direct Insert Test](#direct-insert-test)
3. [Edge Function Tests](#edge-function-tests)
   - [Position Creation Test](#position-creation-test)
4. [WebRTC Tests](#webrtc-tests)
   - [SDP Proxy Test](#sdp-proxy-test)
   - [OpenAI Integration Test](#openai-integration-test)
5. [Simulation Mode Testing](#simulation-mode-testing)
6. [Manual Testing Guides](#manual-testing-guides)

## Environment Setup

Before running tests, ensure your environment is correctly configured:

```bash
# Create or update your .env file with required API keys
cp env.example .env

# Verify environment configuration
node scripts/check-env.js

# Start the development server when needed
npm run dev
```

## Database and Authorization Tests

### RLS Policies Test

Tests the Row Level Security (RLS) policies on the positions table to ensure proper tenant isolation.

**Location:** `/scripts/test-rls-policies.js`

**How to run:**
```bash
node scripts/test-rls-policies.js
```

**What it tests:**
- Attempts to list RLS policies for the positions table
- Tries to insert a test position without authentication (should fail)
- Authenticates with test credentials and tries to insert a position
- Verifies proper RLS enforcement based on tenant_id

**Requirements:**
- Configured Supabase credentials in .env
- Test user credentials (optional)

### Direct Insert Test

Tests direct position insertion using the service role key (admin access).

**Location:** `/scripts/test-direct-insert.js`

**How to run:**
```bash
node scripts/test-direct-insert.js
```

**What it tests:**
- Fetches an existing tenant ID to use
- Inserts a test position directly using service role key
- Verifies the position was created by fetching it

**Requirements:**
- Supabase service role key in .env (SUPABASE_SERVICE_ROLE_KEY)
- At least one tenant in the database

## Edge Function Tests

### Position Creation Test

Tests the generate-position Edge Function that creates AI-powered job descriptions.

**Location:** `/scripts/test-position-creation.js`

**How to run:**
```bash
node scripts/test-position-creation.js
```

**What it tests:**
- Sends a mock position request to the generate-position Edge Function
- Verifies the response contains all required fields
- Validates that competencies are correctly processed
- Saves the full response to a JSON file for review

**Requirements:**
- Valid Supabase project with generate-position function deployed
- OpenAI API key configured for the function

## WebRTC Tests

### SDP Proxy Test

Tests the WebRTC SDP proxy functionality by simulating a connection flow. Note that there are two implementations of SDP proxy in the project:

- Original implementation in `fly-interview-poc` (basic approach)
- Enhanced hybrid implementation in `fly-interview-hybrid` (current approach)

For architectural differences, see [Architecture Comparison](../architecture/ARCHITECTURE_COMPARISON.md).

**Location:** `/fly-interview-poc/test-sdp-proxy.js`

**How to run:**
```bash
# Test the original implementation
cd fly-interview-poc
node test-sdp-proxy.js

# Test the hybrid implementation
cd fly-interview-hybrid
node test-sdp-proxy.js  # If available or use the simulation server
```

**What it tests:**
- Connects to the WebSocket server
- Sends a mock SDP offer
- Verifies the SDP answer received
- Tests ICE candidate exchange
- Validates the entire connection flow

**Requirements:**
- Running SDP proxy server (local or deployed)
- Server URL (defaults to ws://localhost:3000)

### OpenAI Integration Test

Tests the integration between the WebSocket server and the OpenAI Whisper API.

**Location:** `/fly-interview-poc-deploy/test-openai-integration.js`

**How to run:**
```bash
cd fly-interview-poc-deploy
node test-openai-integration.js
```

**What it tests:**
- Tests the OpenAI Whisper API directly
- Transcribes an audio sample using the API
- Verifies the transcription workflow

**Requirements:**
- OpenAI API key in .env
- Test audio file in test-assets/test-audio.mp3

## Simulation Mode Testing

For testing the WebRTC implementation without backend dependencies.

**How to run:**
```bash
# Start the simulation server
cd fly-interview-hybrid
npm install
npm run simulate

# In another terminal, start the frontend
cd ..
npm run dev

# Open browser to test page
# http://localhost:8080/interview-test-simple
```

**What it tests:**
- Connection establishment
- Audio capturing and transmission
- Transcript reception and display
- Error handling and reconnection

## Manual Testing Guides

In addition to the automated tests, there are comprehensive manual testing guides:

- [General Testing Guide](/TESTING.md) - For interview session management testing
- [WebRTC Testing Guide](/WEBRTC_TESTING.md) - For WebRTC implementation testing

These guides provide step-by-step instructions for manually testing key features of the platform.

## Adding New Tests

When adding new automated tests:

1. Place them in the appropriate directory (usually `/scripts` or with the component being tested)
2. Add clear documentation in the test file
3. Update this guide to include the new test
4. Consider adding a package.json script for easy execution

## Running All Tests

Currently, there is no single command to run all tests. Run each test individually as needed for your development workflow.

Future improvement: Create a test runner script to execute all or selected tests in sequence.