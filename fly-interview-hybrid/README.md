# WebRTC SDP Proxy for AI Interview Platform

This service acts as a secure proxy between the client browser and OpenAI's WebRTC API, handling signaling and SDP exchange without exposing API keys to the client.

## Architecture

```
┌─────────────────┐     ┌────────────────┐     ┌──────────────┐
│                 │     │                │     │              │
│  Client Browser │────►│   SDP Proxy    │────►│  OpenAI API  │
│                 │     │   (Fly.io)     │     │              │
└────────┬────────┘     └────────────────┘     └──────────────┘
         │                                              ▲
         │                                              │
         └──────────────────────────────────────────────┘
         Direct WebRTC connection after initial signaling
```

1. Client connects to SDP proxy via WebSocket
2. Client generates SDP offer and sends it to proxy
3. Proxy forwards offer to OpenAI API with API key
4. Proxy receives SDP answer and sends it back to client
5. Client establishes direct WebRTC connection with OpenAI
6. Audio streams directly between client and OpenAI

## Local Development

### Prerequisites

- Node.js 18+
- OpenAI API key with access to WebRTC API

### Setup

1. Clone the repository
2. Install dependencies:
   ```
   cd fly-interview-hybrid
   npm install
   ```
3. Create a `.env` file:
   ```
   PORT=8080
   OPENAI_API_KEY=your_api_key_here
   LOG_LEVEL=debug
   SIMULATION_MODE=true  # Set to false to use real OpenAI API
   ```

### Running locally

```bash
# Start the server
npm start

# Development mode with auto-reload
npm run dev

# Simulation mode (no OpenAI API needed)
npm run dev:sim
```

The server will be available at `http://localhost:8080`

## Deployment to Fly.io

### Prerequisites

- Fly.io account
- Fly CLI installed

### Deployment steps

1. Log in to Fly.io:
   ```bash
   fly auth login
   ```

2. Set your OpenAI API key as an environment variable:
   ```bash
   export OPENAI_API_KEY=your_api_key_here
   ```

3. Run the deployment script:
   ```bash
   ./deploy.sh
   ```

4. Verify deployment:
   ```bash
   fly status -a interview-sdp-proxy
   ```

## Testing the Integration

1. Deploy the SDP proxy to Fly.io
2. Update the `interview-start` Edge Function to use your deployed proxy URL
3. Test with the WebRTCManager component in your React application

## Simulation Mode

For development without an OpenAI API key, set `SIMULATION_MODE=true` in environment variables. This will generate simulated SDP answers locally.

## WebSocket API

### Connection

```javascript
const ws = new WebSocket('wss://interview-sdp-proxy.fly.dev');
```

### Messages

**Initialize session:**
```javascript
ws.send(JSON.stringify({
  type: 'init',
  sessionId: 'your-session-id', // Optional, will be generated if not provided
  aiPersona: 'alloy' // Optional
}));
```

**Send SDP offer:**
```javascript
ws.send(JSON.stringify({
  type: 'sdp_offer',
  offer: peerConnection.localDescription
}));
```

**End session:**
```javascript
ws.send(JSON.stringify({
  type: 'disconnect',
  sessionId: 'your-session-id'
}));
```

## HTTP API

You can also use the HTTP API instead of WebSockets:

**Exchange SDP:**
```
POST /api/sdp-exchange
Content-Type: application/json

{
  "sessionId": "your-session-id",
  "sdpOffer": "v=0\no=- ...",
  "aiPersona": "alloy"
}
```

## Security Considerations

- OpenAI API keys are never exposed to clients
- WebSocket connections are secured with TLS
- Each session has a unique identifier for isolation
- SDP offers/answers are validated before processing

## Troubleshooting

- Check logs: `fly logs -a interview-sdp-proxy`
- Verify OpenAI API key is valid
- Check for WebSocket connection errors in browser console
- Ensure proper CORS configuration
- Use simulation mode to test without OpenAI API

## Security Considerations (Additional)

- Never exposes the OpenAI API key to the client
- Uses WebSockets with proper CORS settings
- Implements session isolation
- Uses helmet.js for HTTP security headers
- Supports JWT validation with simulation bypass for testing

## Testing Methods

There are multiple ways to test the WebSocket server and WebRTC functionality:

### 1. Direct WebSocket Testing

To directly test just the WebSocket server in the browser console:

1. Start the server:
   ```bash
   node simple-server.js
   ```

2. Open http://localhost:3001 in your browser

3. Open browser developer tools (F12) and run:
   ```javascript
   // Create WebSocket connection with simulation parameter
   const socket = new WebSocket('ws://localhost:3001?simulation=true');

   // Connection opened
   socket.addEventListener('open', (event) => {
     console.log('WebSocket Connected!');

     // Send a ping message
     socket.send(JSON.stringify({type: 'ping'}));
     console.log('Sent: ping message');
   });

   // Listen for messages
   socket.addEventListener('message', (event) => {
     console.log('Message from server:', JSON.parse(event.data));
   });
   ```

**IMPORTANT:** The `simulation=true` parameter is required for testing without JWT tokens.

### 2. Using The SimpleWebRTCTest Page

To test the full WebRTC implementation with React components:

1. Start the WebSocket server:
   ```bash
   cd fly-interview-hybrid
   node simple-server.js
   ```

2. In another terminal, start the React dev server:
   ```bash
   cd ..  # Return to project root
   npm run dev
   ```

3. Open http://localhost:8080/simple-webrtc-test in your browser

4. On the SimpleWebRTCTest page:
   - Verify the server URL is set to `ws://localhost:3001?simulation=true`
   - Ensure "Simulation Mode" is checked
   - Click the "Start Connection" button to manually initiate the connection
   - Use the debug panel for troubleshooting steps if needed

5. Check the browser console (F12) for detailed connection logs.

**Troubleshooting:**
- If the connection doesn't start, try the "Connect" button in the SimpleWebRTCManager panel
- Ensure no other tabs or windows are connecting to the same WebSocket server
- Verify the server is running and listening on port 3001
- Check that CORS settings in simple-server.js allow your frontend origin

## Next Steps

1. ✅ Fix React component issues in useAudioVisualization.ts causing infinite loops
2. ✅ Add manual initialization option to SimpleWebRTCTest to prevent browser freezing
3. ✅ Add detailed debug information to help with troubleshooting
4. ✅ Enhance error handling in React components
5. ✅ Implement refs to allow parent components to control WebRTC initialization
6. Add multi-tenant isolation
7. Improve integration with the main application
8. Test with real interview sessions
9. Set up monitoring and alerting for production deployment
10. Add support for reconnection to interrupted sessions

## License

ISC
