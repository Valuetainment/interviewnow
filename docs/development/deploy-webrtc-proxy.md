# Deploying the WebRTC SDP Proxy to Fly.io

This guide provides step-by-step instructions for deploying the WebRTC SDP Proxy for the AI Interview Platform.

## Overview

The WebRTC SDP Proxy is a critical security component that enables direct browser-to-OpenAI audio streaming without exposing API keys to clients. It handles the WebRTC signaling process, particularly the SDP (Session Description Protocol) exchange.

## Prerequisites

- Fly.io account (https://fly.io)
- Fly CLI installed (https://fly.io/docs/hands-on/install-flyctl/)
- Node.js 18+ (for local testing)
- OpenAI API key with access to the WebRTC Realtime API

## Deployment Steps

### 1. Clone the Repository

Ensure you have the latest code from the repository:

```bash
git checkout main
git pull
```

### 2. Configure the Environment

Create a `.env` file in the `fly-interview-hybrid` directory:

```bash
cd fly-interview-hybrid
cp .env.example .env
```

Edit the `.env` file to set your OpenAI API key and configuration:

```
OPENAI_API_KEY=your_openai_api_key_here
NODE_ENV=production
SIMULATION_MODE=false
LOG_LEVEL=info
```

### 3. Log in to Fly.io

Authenticate with your Fly.io account:

```bash
fly auth login
```

### 4. Deploy Using the Script

The repository includes a deployment script that handles all necessary steps:

```bash
# Export your OpenAI API key to make it available to the script
export OPENAI_API_KEY=your_openai_api_key_here

# Make the script executable if needed
chmod +x deploy.sh

# Run the deployment script
./deploy.sh
```

This script will:
- Verify prerequisites
- Create the Fly.io app if it doesn't exist
- Set up the required secrets
- Create a persistent volume
- Deploy the application
- Show deployment status

### 5. Verify Deployment

Check your deployment status:

```bash
fly status -a interview-sdp-proxy
```

View logs to ensure everything is working:

```bash
fly logs -a interview-sdp-proxy
```

The proxy should now be available at `https://interview-sdp-proxy.fly.dev`

## Manual Deployment Steps

If you prefer to deploy manually instead of using the script:

### 1. Create the Fly.io App

```bash
fly apps create interview-sdp-proxy
```

### 2. Set Required Secrets

```bash
fly secrets set OPENAI_API_KEY=your_openai_api_key_here -a interview-sdp-proxy
```

### 3. Create a Volume for Persistent Data

```bash
fly volumes create interview_app_data --size 1 -a interview-sdp-proxy
```

### 4. Deploy the Application

```bash
cd fly-interview-hybrid
fly deploy -a interview-sdp-proxy
```

## Testing the Deployment

### Healthcheck Endpoint

Verify the service is running by accessing the healthcheck endpoint:

```bash
curl https://interview-sdp-proxy.fly.dev/healthz
```

You should receive an `OK` response.

### Integration with WebRTCManager

To connect your WebRTCManager component to the deployed proxy:

1. Update the `interview-start` Edge Function in Supabase to use your deployed proxy URL
2. Test a complete interview flow using the WebRTCManager component

## Monitoring and Maintenance

### Viewing Logs

```bash
fly logs -a interview-sdp-proxy
```

### Scaling

If needed, you can scale the proxy:

```bash
# Scale to more instances
fly scale count 2 -a interview-sdp-proxy

# Scale to larger VM size
fly scale vm shared-cpu-2x -a interview-sdp-proxy
```

### Updating

To deploy updates:

```bash
cd fly-interview-hybrid
fly deploy -a interview-sdp-proxy
```

## Troubleshooting

### Common Issues

1. **Connection Errors**:
   - Verify your OpenAI API key is valid
   - Check CORS configuration
   - Examine logs for detailed error messages

2. **WebRTC Connection Failures**:
   - Browser console errors may indicate SDP format issues
   - Check that the proxy is correctly forwarding SDP offers/answers
   - Verify ICE candidate handling

3. **Performance Issues**:
   - Consider scaling up instance size for better performance
   - Check logs for response time issues

### Getting Help

If you encounter issues:

1. Check fly-interview-hybrid/logs for error details
2. Verify WebRTC compatibility in your browser
3. Consult the OpenAI WebRTC API documentation
4. Contact the project maintainers for assistance

## Security Considerations

- The SDP proxy is designed to maintain security by keeping API keys on the server
- All WebSocket connections are secured with TLS
- Each session has a unique identifier for isolation
- Never expose your OpenAI API key in client-side code

## Next Steps

After successful deployment:

1. Complete integration with the main application
2. Implement comprehensive error handling
3. Add monitoring and alerting
4. Set up automatic scaling based on usage
5. Consider multi-region deployment for lower latency

By following this guide, you should have a functioning WebRTC SDP proxy deployed to Fly.io, ready to secure the communication between your clients and OpenAI's WebRTC service. 