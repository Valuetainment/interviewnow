# Hybrid WebRTC Architecture: Data Flow & Technical Implementation

## Architecture Overview

Our hybrid architecture for the AI Interview Insights Platform leverages WebRTC for direct, secure audio streaming between clients and OpenAI, with Fly.io serving as an SDP proxy to maintain security without compromising performance.

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Browser Client                             │
│                                                                     │
│  ┌────────────┐        ┌────────────┐        ┌────────────┐         │
│  │ Microphone │───────►│  WebRTC    │◄───────┤ Text UI    │         │
│  │ Capture    │  Audio │ Connection │  Text  │ Display    │         │
│  └────────────┘        └──────┬─────┘        └────────────┘         │
│                               │                                     │
└───────────────────────────────┼─────────────────────────────────────┘
                                │
                                │
           ┌──────────────────┐ │ ┌───────────────────┐
           │  1. SDP Signaling│ │ │                   │
           │  & ICE Setup     │ │ │  2. Direct WebRTC │
           └─────────┬────────┘ │ │     Connection    │
                     │          │ │                   │
                     ▼          │ │                   │
┌────────────────────────────┐  │ │                   │
│                            │  │ │                   │
│         Fly.io             │  │ │                   │
│       (SDP Proxy)          │  │ │                   │
│                            │  │ │                   │
└──────────────┬─────────────┘  │ │                   │
               │                │ │                   │
               │                │ │                   │
               ▼                ▼ │                   │
┌────────────────────────────────────────────────────▼───────────────┐
│                                                                     │
│                             OpenAI                                  │
│  ┌────────────────────┐    ┌────────────────┐    ┌────────────┐    │
│  │ API Authentication │    │ Speech-to-Text │    │  WebRTC    │    │
│  │ & SDP Processing   │───►│ Processor      │◄───┤  Endpoint  │    │
│  └────────────────────┘    └───────┬────────┘    └────────────┘    │
│                                    │                                │
└────────────────────────────────────┼────────────────────────────────┘
                                     │
                                     │
                                     ▼
┌───────────────────────────────────────────────────────────────────┐
│                                                                   │
│                           Supabase                                │
│                                                                   │
│   ┌───────────────────┐     ┌────────────────────────────────┐   │
│   │  Auth & Session   │     │           Database             │   │
│   │   Management      │     │                                │   │
│   └───────────────────┘     │    ┌───────────────────────┐   │   │
│                             │    │  Transcript Storage   │   │   │
│                             │    │  & Processing         │   │   │
│                             │    └───────────────────────┘   │   │
│                             └────────────────────────────────┘   │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

### 1. Browser Client
- Captures audio via `getUserMedia()` and `MediaRecorder` APIs
- Establishes WebRTC connection following signaling protocol
- Streams audio directly to OpenAI's WebRTC endpoint
- Receives real-time transcription via WebRTC data channel
- Renders transcript UI for user interaction
- Persists final session data to Supabase

### 2. Fly.io (SDP Proxy)
- Handles WebRTC signaling without exposing API keys
- Processes SDP offers from clients
- Generates compatible SDP answers
- Manages ICE candidate exchange
- Maintains session state with unique IDs
- Provides secure WebSocket connectivity

### 3. OpenAI
- Receives and validates API authentication
- Accepts SDP offers via proxy
- Processes incoming audio streams in real-time
- Performs speech-to-text conversion
- Returns transcript data through WebRTC data channel
- Maintains WebRTC connection

### 4. Supabase
- Provides authentication and authorization
- Stores user, candidate, and interview session data
- Persists final transcripts
- Offers edge functions for post-processing analyses
- Manages multi-tenant data isolation
- Handles file storage for recordings and documents

## Technical Data Flow

### 1. Setup Phase (Signaling)
```
a. Browser Client ──(SDP Offer)──────────────────► Fly.io SDP Proxy
b. Fly.io SDP Proxy ──(API Key + SDP)──────────► OpenAI WebRTC API
c. OpenAI WebRTC API ──(SDP Answer)─────────────► Fly.io SDP Proxy
d. Fly.io SDP Proxy ──(SDP Answer)─────────────► Browser Client
e. ICE candidates exchanged to establish direct connection
```

### 2. Streaming Phase (Direct Connection)
```
a. Browser Client ──(Direct Audio Stream)─────► OpenAI WebRTC Endpoint
b. OpenAI Processor ──(Text via Data Channel)──► Browser Client
```

### 3. Persistence Phase
```
a. Browser Client ──(Session Data + Transcript)──► Supabase
b. Supabase ──(Stored Results)───────────────────► Browser Client (for review)
```

## Security Considerations

1. **API Key Protection**
   - API keys never exposed to client browser
   - All API key usage happens server-side within Fly.io
   - SDP proxy acts as a secure intermediary

2. **Data Isolation**
   - Each interview gets unique session ID
   - Tenant isolation implemented at Fly.io VM level
   - Row-Level Security policies enforce access control in database

3. **Secure Connections**
   - All WebRTC connections encrypted with DTLS
   - WebSocket connections use WSS (secure WebSockets)
   - API authentication with proper token validation

## Performance Benefits

1. **Direct Audio Streaming**
   - Once WebRTC connection is established, audio flows directly to OpenAI
   - No proxy in the middle of the high-bandwidth audio stream
   - Lowest possible latency for real-time transcription

2. **Resource Efficiency**
   - Fly.io only handles signaling, not media streaming
   - Compute-intensive audio processing handled by OpenAI
   - Efficient separation of concerns for better scaling

3. **Connection Resilience**
   - WebRTC includes built-in mechanisms for handling network changes
   - ICE framework helps establish connections even in challenging network environments
   - Connection recovery handled gracefully

## Implementation Details

### SDP Format Compatibility

The SDP proxy carefully preserves the exact format of the client's SDP offer, maintaining:
- Media line order
- Session-level attributes
- ICE credentials (with secure generation)
- Codec configurations

Example SDP processing:
```javascript
function createAnswerFromOffer(offerSdp) {
  const lines = offerSdp.split('\r\n');
  const answer = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let newLine = line;
    
    // Change offer to answer
    if (line === 'a=type:offer') {
      newLine = 'a=type:answer';
    }
    // Reverse the setup role
    else if (line.startsWith('a=setup:')) {
      if (line === 'a=setup:actpass') {
        newLine = 'a=setup:active';
      }
    }
    // Other necessary transformations...
    
    answer.push(newLine);
  }
  
  return answer.join('\r\n') + '\r\n';
}
```

### WebRTC Data Channel Usage

The data channel provides a bidirectional text-based communication channel for:
- Real-time transcription results from OpenAI to browser
- Control signals from browser to OpenAI
- Session state updates and metadata

### Multi-tenant Security

- Each tenant organization has isolated processing VMs
- Session IDs include tenant context for access control
- Database enforces tenant isolation through RLS policies

## Deployment Considerations

1. **Scaling Strategy**
   - Fly.io machines scale on-demand for interview traffic
   - Each interview gets dedicated resources when needed
   - Resources released when interviews complete

2. **Regional Deployment**
   - Fly.io components deployed in multiple regions for low latency
   - Automatic routing to nearest instance
   - Global distribution for international interviews

3. **Error Recovery**
   - Automatic reconnection attempts for dropped connections
   - Session state preserved during brief disconnections
   - Graceful degradation when optimal connections not possible

## Next Steps

1. Implement React components for WebRTC handling in frontend
2. Deploy SDP proxy to production Fly.io environment
3. Create comprehensive monitoring for connection statistics
4. Implement production-ready error handling and recovery
5. Add support for additional media types beyond audio-only 