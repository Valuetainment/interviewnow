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