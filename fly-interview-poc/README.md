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