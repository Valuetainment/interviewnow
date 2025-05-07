# Interview Transcription POC for Fly.io

This is a proof-of-concept application to test the feasibility of using Fly.io for interview audio processing and transcription. The application captures audio from the client's microphone, sends it to the server via WebSockets, and processes it with OpenAI's Whisper model to generate real-time transcripts.

## Features

- Real-time audio capture from browser
- WebSocket-based streaming of audio data
- Server-side processing with OpenAI Whisper
- Live transcript updates
- Isolated container-based deployment on Fly.io
- No authentication or database dependencies (isolated test)

## Requirements

- Node.js 18+
- OpenAI API key
- Fly.io account (for deployment)

## Local Development

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file with your OpenAI API key:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   PORT=3000
   ```
4. Start the development server:
   ```
   npm run dev
   ```
5. Open `http://localhost:3000` in your browser

## Deployment to Fly.io

1. Install the Fly.io CLI:
   ```
   curl -L https://fly.io/install.sh | sh
   ```

2. Log in to Fly.io:
   ```
   fly auth login
   ```

3. Launch the app:
   ```
   fly launch
   ```

4. Set your OpenAI API key as a secret:
   ```
   fly secrets set OPENAI_API_KEY=your_openai_api_key_here
   ```

5. Deploy the app:
   ```
   fly deploy
   ```

## How It Works

1. Client connects to the server via WebSocket
2. User starts recording audio from their microphone
3. Audio chunks are sent to the server in real-time
4. Server accumulates chunks and periodically processes them using OpenAI's Whisper API
5. Transcription results are sent back to the client in real-time
6. The final transcript is compiled on the server and sent to the client when recording stops

## Testing Focus

This POC focuses on testing:

- CPU usage patterns during transcription
- Memory usage with concurrent sessions
- Performance and latency of audio processing
- Scalability with Fly.io's infrastructure
- Isolation between different interview sessions

## Architecture

```
[Browser] <--WebSocket--> [Fly.io App] <--> [OpenAI API]
   |                          |
Audio Capture         Audio Processing &
                       Transcription
```

## Limitations

- This is a proof-of-concept and not meant for production use
- No authentication or security measures implemented
- No database persistence
- Limited error handling
- No multi-tenant isolation (focus is on core functionality)

# AI Interview Insights Platform - WebRTC SDP Proxy

This component serves as a proxy for WebRTC signaling between clients and the OpenAI API. It handles SDP exchange, ICE candidate forwarding, and session management for real-time speech-to-text functionality.

## Features

- WebRTC SDP signaling proxy
- WebSocket-based real-time communication
- Secure API key management (hidden from clients)
- Session state management
- HTTP fallback endpoints

## Getting Started

### Prerequisites

- Node.js (v14+)
- npm or yarn
- OpenAI API key

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file with the following variables:
   ```
   PORT=3000
   OPENAI_API_KEY=your_api_key_here
   ```

### Running the server

```
node index.js
```

The server will start on port 3000 (or the port specified in your .env file).

## API Reference

### WebSocket API

Connect to the WebSocket server at `/` to interact with the WebRTC proxy.

**Message Types:**

- `sdpOffer`: Send an SDP offer to initiate WebRTC connection
- `iceCandidate`: Send ICE candidates for connection establishment
- `transcriptUpdate`: Receive transcript updates from the speech-to-text service
- `finish`: End the session and receive final transcript

### HTTP API

- `GET /health`: Health check endpoint
- `GET /api/test`: Test endpoint
- `POST /api/webrtc-session`: Create a new WebRTC session
- `POST /api/exchange-sdp`: Alternative HTTP endpoint for SDP exchange

## Testing

See [WEBRTC-SDP-PROXY-TEST.md](./WEBRTC-SDP-PROXY-TEST.md) for detailed testing documentation.

## Architecture

This proxy acts as a middleware between:
1. The client's browser (which captures audio using WebRTC)
2. OpenAI's API (which processes the audio for transcription)

The proxy ensures that API keys and credentials remain secure on the server-side while allowing direct WebRTC connections for optimal audio quality.

## Limitations

Currently, OpenAI does not offer a public WebRTC endpoint. This implementation uses a simulation mode that generates compatible SDP answers but doesn't actually connect to a WebRTC service. It will be ready to integrate with OpenAI's WebRTC API once it becomes available.

## License

See the main project license file for details. 