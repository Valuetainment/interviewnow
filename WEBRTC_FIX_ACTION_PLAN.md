# WebRTC Hybrid Architecture Fix Action Plan

## Overview
This document outlines the complete action plan to fix the WebRTC hybrid architecture implementation. The goal is to properly implement the Fly.io SDP proxy to work with OpenAI's WebRTC endpoint while maintaining security and low latency.

## Current State vs Target State

### Current State ❌
- Fly.io server incorrectly connects to OpenAI's WebSocket endpoint (`wss://api.openai.com/v1/realtime`)
- Tries to send `response.create` messages (WebSocket API format)
- Returns mock SDP answers instead of real ones
- Frontend expects WebRTC but backend is configured for WebSocket

### Target State ✅
- Fly.io acts as a secure SDP proxy between browser and OpenAI
- Uses OpenAI's HTTP-based WebRTC endpoints for SDP exchange
- Maintains WebSocket connection with browser for security
- Audio flows directly between browser and OpenAI (low latency)

## Architecture Diagram

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│                 │         │                 │         │                 │
│    Browser      │────────►│    Fly.io       │────────►│    OpenAI       │
│                 │  WS     │   (SDP Proxy)   │  HTTP   │   WebRTC API   │
│                 │◄────────│                 │◄────────│                 │
└────────┬────────┘         └─────────────────┘         └────────┬────────┘
         │                                                        │
         │                                                        │
         └────────────────────────────────────────────────────────┘
                          Direct WebRTC Audio Connection
```

## Implementation Steps

### Phase 1: Fix Fly.io SDP Proxy Server

#### 1.1 Add Ephemeral Key Generation Endpoint ⏳
```javascript
// Add to fly-interview-hybrid/index.js
app.post('/api/generate-ephemeral-key', async (req, res) => {
  try {
    const { sessionId, voice = 'alloy', model = 'gpt-4o-realtime-preview-2024-12-17' } = req.body;
    
    // Verify session belongs to authenticated tenant
    const session = sessions.get(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    // Generate ephemeral key from OpenAI
    const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model, voice })
    });
    
    const data = await response.json();
    
    // Store ephemeral key with session
    session.ephemeralKey = data.client_secret;
    session.keyExpiry = Date.now() + 60000; // 60 seconds
    
    res.json({ 
      success: true,
      client_secret: data.client_secret,
      expires_in: 60
    });
  } catch (error) {
    console.error('Error generating ephemeral key:', error);
    res.status(500).json({ error: 'Failed to generate ephemeral key' });
  }
});
```

#### 1.2 Fix WebSocket Message Handling ⏳
```javascript
// Update the 'sdp_offer' case in fly-interview-hybrid/index.js
case 'sdp_offer':
  console.log('Received SDP offer from client');
  
  try {
    const session = sessions.get(sessionId);
    
    // Ensure we have an ephemeral key
    if (!session.ephemeralKey || session.keyExpiry < Date.now()) {
      throw new Error('Ephemeral key missing or expired');
    }
    
    // Forward SDP offer to OpenAI's WebRTC endpoint
    const response = await fetch(
      'https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.ephemeralKey.value}`,
          'Content-Type': 'application/sdp'
        },
        body: data.offer.sdp // Send only the SDP string
      }
    );
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI SDP exchange failed: ${error}`);
    }
    
    // Get SDP answer as plain text
    const answerSdp = await response.text();
    
    // Send answer back to client
    ws.send(JSON.stringify({
      type: 'sdp_answer',
      answer: {
        type: 'answer',
        sdp: answerSdp
      }
    }));
    
  } catch (error) {
    console.error('Error processing SDP offer:', error);
    ws.send(JSON.stringify({
      type: 'error',
      message: error.message
    }));
  }
  break;
```

#### 1.3 Remove OpenAI WebSocket Connection ⏳
- Remove all code that creates WebSocket connection to OpenAI
- Remove the `openaiWs` handling
- Keep only the HTTP-based SDP exchange

### Phase 2: Update Frontend WebRTC Hooks

#### 2.1 Update useSDPProxy Hook ⏳
```typescript
// src/hooks/webrtc/useSDPProxy.ts
// Add ephemeral key generation before SDP exchange
const generateEphemeralKey = async () => {
  try {
    const response = await fetch(`${config.serverUrl}/api/generate-ephemeral-key`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.authToken}`
      },
      body: JSON.stringify({
        sessionId: config.sessionId,
        voice: config.openAISettings?.voice || 'alloy'
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to generate ephemeral key');
    }
    
    const data = await response.json();
    return data.client_secret;
  } catch (error) {
    console.error('Error generating ephemeral key:', error);
    throw error;
  }
};
```

#### 2.2 Update Data Channel Handling ⏳
```typescript
// Ensure data channel is named 'oai-events'
const dataChannel = peerConnection.createDataChannel('oai-events', {
  ordered: true
});

// Update message handling for OpenAI event types
dataChannel.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  switch (data.type) {
    case 'response.audio_transcript.done':
      // Handle final transcript
      break;
    case 'response.audio_transcript.delta':
      // Handle incremental transcript
      break;
    case 'response.audio.delta':
      // Handle audio chunks if needed
      break;
    // Add other event types as needed
  }
};
```

### Phase 3: Fix Edge Function

#### 3.1 Update interview-start Edge Function ⏳
```typescript
// supabase/functions/interview-start/index.ts
// Ensure it returns the correct Fly.io WebSocket URL format
const response: InterviewResponse = {
  success: true,
  webrtc_server_url: webrtcServerUrl, // wss://interview-hybrid-template.fly.dev/ws
  webrtc_session_id: webrtcSessionId,
  architecture: 'hybrid',
  operation_id: operationId,
  openai_api_config: {
    voice: 'alloy',
    model: 'gpt-4o-realtime-preview-2024-12-17',
    // Include any custom instructions
  }
};
```

### Phase 4: Testing & Verification

#### 4.1 Create Test Page ⏳
Create a dedicated test page that:
1. Tests ephemeral key generation
2. Tests SDP exchange through Fly.io
3. Verifies audio connection establishment
4. Monitors data channel messages

#### 4.2 Implement Logging & Monitoring ⏳
- Add detailed logging at each step
- Monitor WebSocket connection stability
- Track SDP exchange success/failure rates
- Log all OpenAI API responses

#### 4.3 Error Handling ⏳
- Handle ephemeral key expiration
- Implement retry logic for failed SDP exchanges
- Graceful fallback for connection failures
- Clear error messages for debugging

### Phase 5: Production Deployment

#### 5.1 Deploy Fly.io Changes ⏳
```bash
cd fly-interview-hybrid
fly deploy --app interview-hybrid-template
```

#### 5.2 Deploy Frontend Changes ⏳
```bash
git add -A
git commit -m "fix: Implement proper OpenAI WebRTC SDP exchange"
git push origin main
```

#### 5.3 Monitor Production ⏳
- Watch Fly.io logs: `fly logs --app interview-hybrid-template`
- Monitor Vercel deployment
- Check browser console for errors
- Verify end-to-end connectivity

## Testing Checklist

- [ ] Ephemeral key generation works
- [ ] SDP offer is properly forwarded to OpenAI
- [ ] SDP answer is received and forwarded to browser
- [ ] WebRTC connection establishes successfully
- [ ] Audio flows directly (not through Fly.io)
- [ ] Data channel messages work correctly
- [ ] Transcripts are received and displayed
- [ ] Session cleanup works properly
- [ ] Error handling is robust
- [ ] Multi-tenant isolation is maintained

## Success Criteria

1. **Low Latency**: Audio latency < 500ms
2. **Security**: API keys never exposed to browser
3. **Reliability**: 95%+ connection success rate
4. **Isolation**: Complete tenant separation
5. **Scalability**: Supports concurrent interviews

## Rollback Plan

If issues arise:
1. Keep mock SDP answer code commented (not deleted)
2. Add feature flag to toggle between mock and real SDP
3. Monitor error rates and rollback if > 10% failure
4. Have previous working version tagged in git

## Next Steps After Implementation

1. Add recording capabilities
2. Implement session replay
3. Add real-time analytics
4. Create admin monitoring dashboard
5. Implement automatic scaling based on load

## References

- [OpenAI Realtime API Docs](https://platform.openai.com/docs/guides/realtime)
- [WebRTC Fundamentals](https://webrtc.org/getting-started/overview)
- [Fly.io WebSocket Docs](https://fly.io/docs/reference/runtime-environment/#websockets)
- [Project Architecture Docs](./docs/architecture/hybrid-webrtc-architecture.md)

---
**Status**: 🚧 In Progress  
**Last Updated**: ${new Date().toISOString()}  
**Owner**: Development Team