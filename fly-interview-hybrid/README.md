# WebRTC SDP Proxy for AI Interview Platform

This is a proof-of-concept implementation of the hybrid architecture approach for the AI Interview Platform. The implementation focuses on SDP proxying rather than full audio processing, allowing direct WebRTC connections between clients and OpenAI's services while maintaining security through Fly.io's proxying capabilities.

## Architecture Overview

This implementation follows the hybrid architecture pattern:

1. **SDP Exchange Proxy**: Secure exchange of SDP offers/answers between client and OpenAI
2. **Direct WebRTC Connection**: Audio streams flow directly between client and OpenAI
3. **Security Layer**: API keys and sensitive credentials stay on the server
4. **Session Management**: Each interview has isolated credentials and resources

## Running the Application

### Prerequisites

- Node.js 16+
- npm
- Fly.io CLI (for deployment)
- OpenAI API key

### Local Development

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file with the following content:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   PORT=3000
   SIMULATION_MODE=true
   JWT_SECRET=your_jwt_secret_here
   ```
4. Start the server in simulation mode:
   ```bash
   npm run dev:sim
   ```
5. Or in production mode (requires valid OpenAI API key):
   ```bash
   npm run dev
   ```
6. Open your browser to `http://localhost:3000` to access the test client

### Simulation Mode

When `SIMULATION_MODE=true`, the server will:

- Accept SDP offers from clients
- Return mock SDP answers (no actual OpenAI API calls)
- Acknowledge ICE candidates without forwarding them
- Allow testing the flow without an OpenAI API key

### Deployment to Fly.io

1. Install the Fly.io CLI
2. Log in to Fly.io:
   ```bash
   fly auth login
   ```
3. Launch the app:
   ```bash
   fly launch
   ```
4. Set secrets:
   ```bash
   fly secrets set OPENAI_API_KEY=your_openai_api_key_here JWT_SECRET=your_strong_jwt_secret
   ```
5. Deploy:
   ```bash
   fly deploy
   ```

## API Documentation

### WebSocket Messages

#### Client to Server

| Message Type | Description | Payload |
|--------------|-------------|---------|
| `sdp_offer` | WebRTC SDP offer | `{ offer: RTCSessionDescriptionInit }` |
| `ice_candidate` | ICE candidate | `{ candidate: RTCIceCandidateInit }` |
| `get_api_key` | Request API key availability | `{}` |
| `end_session` | End the session | `{}` |

#### Server to Client

| Message Type | Description | Payload |
|--------------|-------------|---------|
| `session` | Session established | `{ sessionId: string }` |
| `sdp_answer` | WebRTC SDP answer | `{ answer: RTCSessionDescriptionInit }` |
| `ice_acknowledge` | ICE candidate received | `{}` |
| `api_key_status` | API key status | `{ status: 'available' }` |
| `error` | Error message | `{ message: string }` |
| `session_ended` | Session terminated | `{ sessionId: string }` |

### HTTP Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check endpoint |
| `/api/key-status` | GET | Check if API key is configured |
| `/api/sessions/:sessionId` | GET | Get session information |

## Security Considerations

This implementation:

- Never exposes the OpenAI API key to the client
- Uses WebSockets with proper CORS settings
- Implements session isolation
- Uses helmet.js for HTTP security headers
- Supports JWT validation (not fully implemented in this POC)

## Next Steps

1. Implement proper authentication via JWT
2. Add multi-tenant isolation
3. Integrate with the main application
4. Implement more robust error handling
5. Add connection recovery mechanisms
6. Create React components for the main frontend

## License

ISC 