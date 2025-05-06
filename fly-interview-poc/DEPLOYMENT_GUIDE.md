# Fly.io Deployment Guide: Interview Transcription System

This guide outlines the steps to deploy the Interview Transcription Proof-of-Concept to Fly.io for further testing in a production-like environment.

## Prerequisites

1. **Fly.io Account**: Sign up at [fly.io](https://fly.io)
2. **Fly CLI**: Install the Fly CLI using:
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```
3. **Authentication**: Authenticate with Fly.io:
   ```bash
   fly auth login
   ```
4. **OpenAI API Key**: For actual transcription (when moving beyond simulation)

## Configuration Files

This repository already includes the necessary configuration files:

1. **Dockerfile**: Contains instructions for building the container
2. **fly.toml**: Contains Fly.io-specific deployment configuration

## Environment Variables

Before deployment, set up the required environment variables:

1. Copy the example environment file:
   ```bash
   cp env.example .env
   ```

2. Edit `.env` to include your OpenAI API key and any other required variables.

## Deployment Steps

1. **Launch the Application**:
   ```bash
   fly launch
   ```
   - When prompted, select an appropriate region (choose one close to your target users)
   - Review the generated `fly.toml` file to ensure it matches your requirements

2. **Set Environment Variables**:
   ```bash
   fly secrets set OPENAI_API_KEY=your_api_key_here
   ```

3. **Deploy the Application**:
   ```bash
   fly deploy
   ```

4. **Check Deployment Status**:
   ```bash
   fly status
   ```

5. **View Logs**:
   ```bash
   fly logs
   ```

## Testing the Deployed Application

1. **Access the Application**:
   Your application will be available at `https://your-app-name.fly.dev`

2. **WebSocket Connection**:
   The client code should connect to the WebSocket server at:
   ```
   wss://your-app-name.fly.dev
   ```

3. **Verify Functionality**:
   - Connect to the WebSocket server
   - Start recording audio
   - Verify that transcription updates appear in real-time
   - Stop recording and check the final transcript

## Scaling and Multi-Region Deployment

To test multi-region deployment and scaling:

1. **Scale in Current Region**:
   ```bash
   fly scale count 2
   ```

2. **Add Additional Regions**:
   ```bash
   fly regions add fra
   ```
   (Replace `fra` with desired region code)

3. **Monitor Performance**:
   ```bash
   fly status
   fly metrics
   ```

## Troubleshooting

1. **Connection Issues**:
   - Check WebSocket URL (should use `wss://` protocol)
   - Verify CORS configuration
   - Check browser console for errors

2. **Deployment Failures**:
   - Review the Dockerfile for any issues
   - Check logs with `fly logs`
   - Verify environment variables with `fly secrets list`

3. **Performance Issues**:
   - Check CPU/memory usage with `fly metrics`
   - Consider scaling up or out with `fly scale`
   - Review code for potential optimizations

## Integrating Real OpenAI Transcription

To move from simulation to actual OpenAI transcription:

1. Update the `createRealtimeToken` function in `index.js` to use the actual OpenAI token creation endpoint
2. Modify the client code to use OpenAI's real-time transcription API
3. Add proper error handling for API rate limits and failures

## Next Steps After Successful Deployment

1. Conduct load testing with multiple concurrent sessions
2. Optimize resource usage based on metrics
3. Implement enhanced error handling and recovery mechanisms
4. Consider integration with authentication and database systems
5. Apply lessons learned to integrate with the main application

---

For more information on Fly.io deployment options and advanced configuration, refer to the [official Fly.io documentation](https://fly.io/docs/). 