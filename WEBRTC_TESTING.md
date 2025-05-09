# WebRTC Implementation Testing Guide

This guide provides instructions for testing the WebRTC implementation in this project.

## Testing Options

There are two main ways to test the WebRTC implementation:

1. **Simulation Mode** - Uses a mock server to simulate responses without requiring backend services
2. **Real Mode** - Connects to actual Fly.io SDP proxy and Supabase backend

## Running in Simulation Mode

Simulation mode is the easiest way to test the WebRTC implementation as it doesn't require any backend services.

### Step 1: Start the Simulation Server

```bash
# Navigate to fly-interview-hybrid directory
cd fly-interview-hybrid

# Install dependencies if needed
npm install

# Start the simulation server
npm run simulate
```

This will start a local WebSocket server on port 3000 that simulates the SDP proxy.

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

This will open a simple test page that connects to the simulation server. You should see:

- Connection status indicators
- Audio level visualization (if microphone access is granted)
- Simulated transcript updates

## Running in Real Mode

To test with real backend services:

### Step 1: Start the SDP Proxy

```bash
# Navigate to fly-interview-hybrid directory
cd fly-interview-hybrid

# Start the SDP proxy in development mode
npm run dev
```

Make sure you have the required environment variables set:

- `OPENAI_API_KEY` - Your OpenAI API key
- `JWT_SECRET` - Secret for JWT token verification
- `ALLOWED_ORIGINS` - Comma-separated list of allowed origins for CORS
- `PORT` - Port to run the server on (default: 3000)

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

Uncheck the "Simulation Mode" checkbox and set the Server URL to your local SDP proxy:

```
ws://localhost:3000/ws
```

## Testing the Connection

The WebRTC connection goes through several states:

1. **disconnected** - Initial state, no connection
2. **connecting** - Attempting to connect
3. **ws_connected** - WebSocket connected, SDP exchange in progress
4. **connected** - WebRTC connection established
5. **ice_disconnected** - ICE connection temporarily disconnected (reconnecting)
6. **ice_failed** / **connection_failed** / **error** - Connection failed

You can test the reconnection logic by:

1. Starting the connection
2. Stopping the SDP proxy server
3. Observing the automatic reconnection attempts
4. Restarting the SDP proxy server
5. Observing the successful reconnection

## Features

The WebRTC implementation includes:

- **Robust Reconnection** - Automatic reconnection with exponential backoff
- **Audio Visualization** - Real-time visualization of audio levels
- **Connection Status** - Clear status indicators
- **Error Handling** - Comprehensive error handling and reporting
- **Simulation Mode** - Testing without backend dependencies

## Troubleshooting

If you encounter issues:

1. **Check the console** - Look for errors in the browser console
2. **Verify microphone permissions** - The browser needs microphone access
3. **Check server logs** - Look for errors in the SDP proxy logs
4. **Reset connections** - Click the "End Interview" button and try again
5. **Try simulation mode** - If real mode fails, try simulation mode to isolate issues

For serious connection issues, you can use the "Retry Connection" button that appears when the connection fails.