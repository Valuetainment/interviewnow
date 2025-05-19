# WebRTC Hybrid Architecture Testing Guide

This guide provides instructions for testing the WebRTC hybrid architecture implementation in this project.

> **Note:** This project has migrated to the hybrid OpenAI architecture approach and no longer supports the original SDP proxy architecture.

## Overview of Hybrid Architecture

The hybrid architecture leverages OpenAI's native WebRTC capabilities while using a secure SDP proxy for session establishment:

```
[Client Browser] <-- SDP Signaling Only --> [Fly.io SDP Proxy]
       |
       v
[Direct WebRTC Connection]
       |
       v
[OpenAI WebRTC API]
```

This approach provides:
- Lower latency (direct audio streaming to OpenAI)
- Better scalability (proxy only handles signaling, not audio)
- Improved reliability (direct WebRTC connection)
- Simplified server requirements (no audio processing on server)

## Testing Options

There are three main ways to test the WebRTC hybrid implementation:

1. **Direct OpenAI Mode** (Recommended) - Connects directly to OpenAI's Realtime API for true end-to-end testing
2. **Simulation Mode** - Uses a mock server to simulate responses without requiring an OpenAI API key
3. **Ngrok Tunnel Mode** - Uses a secure tunnel for testing behind firewalls or when developing locally

## Running in Direct OpenAI Mode

Direct OpenAI mode provides the most realistic testing experience by connecting directly to OpenAI's Realtime API.

### Step 1: Get an OpenAI API Key

You'll need an OpenAI API key with access to the GPT-4o Realtime model. Visit the [OpenAI Platform](https://platform.openai.com/api-keys) to create one if needed.

### Step 2: Start the Frontend

```bash
# In the project root
npm run dev
```

### Step 3: Navigate to the Test Page

Open your browser and go to:

```
http://localhost:8080/interview-test-simple
```

### Step 4: Configure and Start the Test

1. Ensure that "Simulation Mode" is turned OFF (this is the default)
2. Enter your OpenAI API key in the field provided
3. Configure the job description, resume, and voice settings as needed
4. The connection will be established automatically when you click Connect

Your API key is stored only in your browser's localStorage and is never sent to our servers.

### Features of Direct OpenAI Testing

- **True End-to-End Testing**: Tests the actual API and connection used in production
- **Real AI Responses**: The AI responds with actual interview questions based on your settings
- **Configurable Settings**: Adjust voice, temperature, and other parameters
- **Realistic Timing**: Experience actual latency and response timing

### Notes on API Usage

- This testing mode consumes OpenAI API credits at the rate of a GPT-4o Realtime session
- A typical test session might cost approximately $0.10-0.20 in API credits
- For development testing, keep sessions short to minimize costs

## Running in Simulation Mode

Simulation mode allows testing without an OpenAI API key by simulating responses.

### Step 1: Start the Simulation Server

```bash
# Navigate to fly-interview-hybrid directory
cd fly-interview-hybrid

# Install dependencies if needed
npm install

# Start the simulation server
node simple-server.js
```

This starts a local WebSocket server on port 3001 that simulates the SDP proxy behavior.

### Step 2: Start the Frontend

```bash
# In the project root
npm run dev
```

### Step 3: Navigate to the Test Page

Open your browser and go to:

```
http://localhost:8080/interview-test-simple
```

### Step 4: Enable Simulation Mode

1. Toggle the "Simulation Mode" button to ON
2. Set the Server URL to `ws://localhost:3001` (or the appropriate URL)
3. The connection will use the simulation server instead of OpenAI

## Running with Ngrok Tunnel

For testing behind firewalls or on networks with restrictions, you can use ngrok to create a secure tunnel.

### Step 1: Install Ngrok

```bash
# Using Homebrew
brew install ngrok

# Or download from https://ngrok.com/download
```

Configure with your auth token:

```bash
ngrok config add-authtoken YOUR_AUTH_TOKEN
```

### Step 2: Use the Automated Setup Script

We've created a script that automates the entire setup process:

```bash
# In the project root
./start-ngrok-test.sh
```

This script:
1. Starts the simulation server
2. Launches ngrok and creates a secure tunnel
3. Extracts the ngrok URL and updates necessary files
4. Shows real-time server logs for debugging

### Step 3: Navigate to the Test Page

Open your browser and go to:

```
http://localhost:8080/interview-test-simple
```

Toggle on "Simulation Mode" and the test page should be configured with the correct ngrok WebSocket URL.

### Important Notes About Ngrok Testing

- Each time ngrok restarts, it generates a new URL
- For manual testing, always use `wss://` (not `https://`) for WebSocket connections
- This approach is primarily useful for development, not for production testing

## Testing the Connection

The WebRTC connection goes through several states:

1. **disconnected** - Initial state, no connection
2. **connecting** - Attempting to connect
3. **ws_connected** - WebSocket connected, SDP exchange in progress
4. **connected** - WebRTC connection established
5. **ice_disconnected** - ICE connection temporarily disconnected (reconnecting)
6. **ice_failed** / **connection_failed** / **error** - Connection failed

## Debug Information

The test interface includes a debug panel that can be toggled to view:

- Connection status timeline
- Detailed session logs
- Current configuration settings
- Audio levels and activity indicators

This information is valuable for troubleshooting connection issues.

## Automated Testing

The project includes comprehensive automated tests for the WebRTC hooks implementation, focusing exclusively on the hybrid architecture:

```bash
# Run the specialized hybrid architecture test script
npm run test:hybrid

# Run all WebRTC-related tests
npm test -- --run src/hooks/webrtc/__tests__

# Run a specific test file
npm test -- --run src/hooks/webrtc/__tests__/useOpenAIConnection.test.ts
```

The dedicated `test:hybrid` script runs a comprehensive test suite specifically designed for the hybrid architecture. It categorizes tests into:

1. **Core Hook Tests** - Utility hooks used across different parts of the system
2. **Hybrid Architecture Hook Tests** - Specialized hooks for the hybrid WebRTC approach

These tests verify the functionality of the WebRTC implementation in isolation, allowing for thorough testing without requiring actual backend services or OpenAI API calls.

## Troubleshooting

If you encounter issues:

1. **Check the console** - Look for errors in the browser console
2. **Verify microphone permissions** - The browser needs microphone access
3. **Toggle simulation mode** - Try switching between direct and simulation modes
4. **OpenAI API key** - Verify your API key is valid and has access to GPT-4o Realtime
5. **Browser compatibility** - The implementation works best on Chrome and Edge
6. **Network issues** - Ensure you're not behind a corporate firewall that blocks WebRTC
7. **Server URL** - For simulation mode, ensure the WebSocket server URL is correct

For persistent issues, use the debug panel to analyze the connection timeline and logs.