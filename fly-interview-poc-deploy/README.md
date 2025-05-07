# Interview Transcription POC for Fly.io (Isolated Test)

This is a proof-of-concept application to test the feasibility of using Fly.io for interview audio processing and transcription. The application captures audio from the client's microphone, sends it to the server via WebSockets, and processes it with OpenAI's Whisper model to generate real-time transcripts.

## Important: Isolated Testing Environment

This deployment is configured as an **isolated test environment** completely separate from the main application. It uses:

- A unique app name (`interview-poc-isolated-test`)
- Dedicated resources and configurations
- Isolated environment variables
- No connection to production databases or services

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

1. Install dependencies:
   ```
   npm install
   ```
2. Create a `.env` file with your OpenAI API key:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   PORT=3000
   ISOLATED_TEST_MODE=true
   ```
3. Start the development server:
   ```
   npm run dev
   ```
4. Open `http://localhost:3000` in your browser

## Deployment to Fly.io

### Option 1: Using the Deployment Script

1. Ensure you have the Fly.io CLI installed
2. Update your `.env` file with a valid OpenAI API key
3. Run the deployment script:
   ```
   ./deploy.sh
   ```

### Option 2: Manual Deployment

1. Install the Fly.io CLI:
   ```
   curl -L https://fly.io/install.sh | sh
   ```

2. Log in to Fly.io:
   ```
   fly auth login
   ```

3. Create a new app:
   ```
   fly launch --name interview-poc-isolated-test --no-deploy
   ```

4. Set your OpenAI API key as a secret:
   ```
   fly secrets set OPENAI_API_KEY=your_openai_api_key_here ISOLATED_TEST_MODE=true
   ```

5. Deploy the app:
   ```
   fly deploy
   ```

## Testing Next Steps

After successful deployment, follow these testing steps:

1. **Basic Functionality Testing**
   - Connect to `https://interview-poc-isolated-test.fly.dev`
   - Test audio capture and transcription
   - Verify WebSocket connections

2. **OpenAI Integration Testing**
   - Replace simulated transcription with real OpenAI Whisper API
   - Test transcription accuracy and latency

3. **Load Testing**
   - Test with multiple concurrent sessions
   - Monitor CPU and memory usage
   - Check for connection stability

4. **Regional Deployment Testing**
   - Deploy to multiple Fly.io regions
   - Test latency and performance across regions

## Monitoring

To monitor your deployment:

```bash
# View logs
fly logs --app interview-poc-isolated-test

# Check app status
fly status --app interview-poc-isolated-test

# View metrics
fly metrics --app interview-poc-isolated-test
```

## Cleanup

When you're done testing, you can delete the isolated app:

```bash
fly apps destroy interview-poc-isolated-test
```

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