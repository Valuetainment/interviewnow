# Critical Production Documentation

This document provides essential information about the production deployment, infrastructure, and operational procedures for the AI Interview Platform's WebRTC implementation.

## Production Infrastructure Overview

### 1. WebRTC SDP Proxy

**Status: ACTIVE** (Fixed and updated: May 22, 2025)

- **Application Name:** `interview-sdp-proxy`
- **Primary Region:** `mia` (Miami)
- **Access URLs:**
  - WebSocket: `wss://interview-sdp-proxy.fly.dev/ws`
  - HTTP/Status: `https://interview-sdp-proxy.fly.dev`
- **Implementation Files:**
  - Main production server: `index.js`
  - Docker configuration: `Dockerfile`
  - Fly.io configuration: `fly.toml`
  - New test file: `public/realtime-test.html`
- **Recent Updates:**
  - Fixed to use OpenAI Realtime API endpoints (`sessions.openai.com/v1/realtime`)
  - Authentication now uses OpenAI API key directly (not Supabase JWT)
  - Added required header: `OpenAI-Beta: realtime=v1`
  - Fixed node-fetch dependency (downgraded to v2.6.9 for CommonJS compatibility)

**Environment Variables:**
- `PORT=8080`
- `NODE_ENV=production`
- `SIMULATION_MODE=false`
- `JWT_SECRET` (set via secrets, not in fly.toml)
- `OPENAI_API_KEY` (set via secrets, not in fly.toml)

**Server Implementations:**
- `index.js`: Main production server
- `simple-server.js`: Simplified test server
- `simulation-server.js`: Server with simulation capabilities
- `combined-server.js`: Enhanced server with both capabilities

### 2. Supabase Edge Functions

**Status: ACTIVE** (Last updated: May 20, 2025)

| Function Name | Version | Status | Description |
|---------------|---------|--------|-------------|
| interview-start | 6 | ACTIVE | Initializes WebRTC sessions with per-session VM isolation |
| interview-transcript | 4 | ACTIVE | Processes and stores transcripts |
| transcript-processor | 5 | ACTIVE | Handles transcript data processing |

These edge functions handle the initialization of interview sessions, processing of transcript data, and integration with OpenAI's API.

### 3. Database Infrastructure

The database schema has been set up with:
- WebRTC fields in interview_sessions table
- transcript_entries table for storing real-time transcripts
- RLS policies for tenant isolation and security

## Production Deployment Procedures

### Deploying the Updated SDP Proxy

The SDP proxy has been updated with OpenAI Realtime API support. To deploy:

```bash
# Navigate to the implementation directory
cd fly-interview-hybrid

# Deploy the updated proxy
fly deploy --app interview-sdp-proxy

# Verify the app is running
fly apps status interview-sdp-proxy

# Check logs for proper operation
fly logs interview-sdp-proxy
```

### Updating the SDP Proxy

To deploy updates to the SDP proxy:

```bash
# Navigate to the implementation directory
cd fly-interview-hybrid

# Ensure code changes are tested locally
npm run dev:sim

# Deploy to Fly.io
fly deploy --app interview-sdp-proxy

# Verify deployment
fly status --app interview-sdp-proxy
```

### Updating Edge Functions

To update the Supabase edge functions:

```bash
# Deploy interview-start function
supabase functions deploy interview-start

# Deploy interview-transcript function
supabase functions deploy interview-transcript

# Deploy transcript-processor function
supabase functions deploy transcript-processor

# Verify deployments
supabase functions list
```

## Monitoring and Troubleshooting

### Checking Server Status

```bash
# Check if the app is running
fly apps status interview-sdp-proxy

# View recent logs
fly logs interview-sdp-proxy

# Monitor real-time logs
fly logs interview-sdp-proxy --follow
```

### Checking Edge Function Logs

Access the Supabase dashboard to view edge function logs:
- URL: https://supabase.com/dashboard/project/[YOUR_PROJECT_ID]/functions
- Select the specific function to view logs and metrics

### Common Issues and Resolutions

1. **OpenAI API connection failures**
   - Verify OpenAI API key is set correctly in Fly.io secrets
   - Ensure the `OpenAI-Beta: realtime=v1` header is being sent
   - Check that endpoints use `sessions.openai.com/v1/realtime`

2. **WebSocket connection failures**
   - Check that the client is using the correct URL: `wss://interview-sdp-proxy.fly.dev/ws`
   - For testing, ensure `?simulation=true` parameter is included
   - Check CORS configuration if connecting from different domains

3. **Missing environment variables**
   - Resolution: Set secrets using `fly secrets set KEY=VALUE`
   - Critical: `OPENAI_API_KEY` must be set for production

4. **Transcript storage failures**
   - Check edge function logs for errors
   - Verify database connections and schema
   - Ensure interview-start function is at v6 with VM isolation

## Testing Production Infrastructure

### Testing WebRTC Connection

1. Visit the test page: `https://[YOUR_DOMAIN]/simple-webrtc-test`
2. Set server URL to: `wss://interview-sdp-proxy.fly.dev/ws`
3. Turn off simulation mode if you're testing with real OpenAI
4. Click "Connect" and monitor browser console for connection status

### Testing Edge Functions

Test the interview-start function:
```bash
curl -X POST https://[YOUR_PROJECT_REFERENCE].functions.supabase.co/interview-start \
  -H "Content-Type: application/json" \
  -d '{"session_id": "test-session", "tenant_id": "test-tenant"}'
```

## Security Considerations

1. **API Keys**
   - OpenAI API keys are stored as Fly.io secrets, never exposed to clients
   - Regular rotation schedule: Every 90 days or upon personnel changes

2. **Authentication**
   - JWT validation is implemented for all WebSocket connections
   - Tenant isolation ensures separation of data and connections

3. **Network Security**
   - All connections use HTTPS/WSS with TLS certificates
   - CORS policies restrict connections to authorized domains

## Rollback Procedures

In case of critical issues:

1. **Revert to previous Fly.io deployment:**
   ```bash
   fly deploy --app interview-sdp-proxy --image registry.fly.io/interview-sdp-proxy:[PREVIOUS_VERSION]
   ```

2. **Disable problematic edge functions:**
   - Use Supabase dashboard to disable specific functions

3. **Update client configuration:**
   - If needed, update client to use fallback endpoints or modes

## Production URLs and Access Information

- WebSocket Server: `wss://interview-sdp-proxy.fly.dev/ws`
- Status Page: `https://interview-sdp-proxy.fly.dev`
- Edge Functions Base URL: `https://[YOUR_PROJECT_REFERENCE].functions.supabase.co/`
- Supabase Dashboard: `https://supabase.com/dashboard/project/[YOUR_PROJECT_ID]`
- Fly.io Dashboard: `https://fly.io/apps/interview-sdp-proxy`

## Getting Started with Production Deployment

To move to production with the WebRTC implementation:

1. **Start the SDP proxy server** (currently suspended)
2. **Test edge functions** for proper operation
3. **Update client code** to point to production endpoints
4. **Conduct end-to-end testing** with real data
5. **Set up monitoring** for ongoing operations

## Important Contacts

Document key personnel responsible for:
- Backend infrastructure (SDP proxy)
- Edge function maintenance
- Database schema and migrations
- Frontend implementation
- On-call rotation and emergency procedures

## Technical Flow of the Interview Process

The complete interview process follows this technical flow:

### 1. Authentication & Invitation Flow

```
Admin → Create invitation → Supabase generates token → Send to candidate
Candidate → Opens invitation → Authenticates → Creates user account
```

### 2. Interview Session Initialization

```
Candidate → Requests interview session → Supabase creates session record
Session → WebRTC initialization → Fly.io SDP proxy → OpenAI connection
```

### 3. WebRTC Connection Establishment

```
Client → Generate SDP offer → Send to Fly.io
Fly.io → Forward offer to OpenAI (with API key) → Get SDP answer
Fly.io → Return SDP answer to client
Client → Establish direct WebRTC connection with OpenAI
```

### 4. Interview Interaction

```
Candidate speaks → Browser captures audio → Direct WebRTC to OpenAI
OpenAI → Processes speech → Returns transcript via data channel
OpenAI → Generates AI response → Streams audio back to client
Browser → Captures transcripts → Sends to Fly.io → Stored in Supabase
```

### 5. Session Completion

```
User ends interview → Browser sends end signal to OpenAI
Browser → Closes WebRTC connection → Sends completion request
Fly.io → Updates session status in Supabase → Marks as completed
```

### Database Tables Involved

1. **interview_sessions**: Main session record with WebRTC configuration
2. **transcript_entries**: Individual transcript segments from both parties
3. **interview_invitations**: Invitation tokens and status

### Client Components

1. **WebRTCManager.tsx**: Handles WebRTC connection and state
2. **TranscriptPanel.tsx**: Displays and saves transcript data
3. **InterviewRoom.tsx**: Main interview UI and session management

### Backend Services

1. **fly-interview-hybrid**: SDP proxy server
2. **interview-start**: Edge function for session initialization
3. **interview-transcript**: Edge function for transcript storage
4. **transcript-processor**: Edge function for transcript processing

For complete details, refer to:
- [Complete Interview Execution Flow](/docs/verified-flows/INTERVIEW_EXECUTION_FLOW.md)
- [Hybrid Technical Flow](/docs/development/hybrid-technical-flow.md)