# WebRTC Architecture Flow Diagram

## Overview
This diagram illustrates how the client (browser), server (Supabase), Fly.io, and OpenAI interact in the hybrid WebRTC architecture.

## Complete Flow Diagram

```mermaid
sequenceDiagram
    participant B as Browser/Client
    participant S as Supabase<br/>(Backend)
    participant F as Fly.io<br/>(Token Provider)
    participant O as OpenAI<br/>(WebRTC)
    
    Note over B,O: 1. Session Initialization
    B->>S: Request to start interview
    S->>S: Create interview_session record
    S->>B: Return session_id
    
    Note over B,O: 2. Token Generation
    B->>F: POST /api/realtime/sessions<br/>(with session_id)
    F->>F: Validate request
    F->>O: Request ephemeral token<br/>(using stored API key)
    O->>F: Return ephemeral token
    F->>B: Return token + config
    
    Note over B,O: 3. WebRTC Connection
    B->>B: Create RTCPeerConnection
    B->>B: Create SDP offer
    B->>O: Establish WebRTC connection<br/>(using ephemeral token)
    O->>B: SDP answer
    B->>B: Set remote description
    
    Note over B,O: 4. Media Streams
    B->>O: Audio stream (direct P2P)
    O->>B: Processed audio (direct P2P)
    O->>B: Transcripts via data channel<br/>('oai-events')
    
    Note over B,O: 5. Transcript Storage
    B->>B: Receive transcript event
    B->>S: POST to edge function<br/>(interview-transcript)
    S->>S: Store in transcript_entries
    S->>B: Confirmation
    
    Note over B,O: 6. Session End
    B->>O: Close WebRTC connection
    B->>S: Update session status
    B->>F: Notify session end
    F->>F: Clean up resources
```

## Component Responsibilities

### Browser/Client
- Initiates interview session
- Requests ephemeral token
- Establishes WebRTC peer connection
- Streams audio directly to OpenAI
- Receives transcripts via data channel
- Forwards transcripts to Supabase for storage

### Supabase (Backend)
- Manages interview sessions
- Stores transcript entries
- Handles user authentication
- Provides RLS (Row Level Security)
- Runs edge functions for data processing

### Fly.io (Token Provider)
- Stores OpenAI API key securely
- Generates ephemeral tokens on demand
- Provides WebSocket endpoint for SDP exchange
- Implements per-session VM isolation
- Never processes actual audio streams

### OpenAI (WebRTC Endpoint)
- Accepts WebRTC connections with ephemeral tokens
- Processes audio in real-time
- Generates transcripts with AI
- Sends transcripts back via data channel
- Maintains direct P2P connection with browser

## Key Security Features

```mermaid
graph TD
    A[API Key Security] --> B[Stored only on Fly.io]
    A --> C[Never sent to browser]
    A --> D[Ephemeral tokens expire]
    
    E[Session Isolation] --> F[Per-session VMs]
    E --> G[Tenant separation]
    E --> H[Auto-cleanup]
    
    I[Data Security] --> J[Direct P2P audio]
    I --> K[Encrypted WebRTC]
    I --> L[RLS on database]
```

## Data Flow Types

### 1. Control Flow (HTTP/WebSocket)
- Session initialization
- Token generation
- Status updates

### 2. Media Flow (WebRTC)
- Audio streams (bidirectional)
- Ultra-low latency (<500ms)
- Direct peer-to-peer

### 3. Data Flow (WebRTC Data Channel)
- Transcript events
- Session metadata
- Real-time updates

## Benefits of This Architecture

1. **Security**: API keys never exposed to client
2. **Performance**: Direct P2P connection for minimal latency
3. **Scalability**: Fly.io scales based on token requests, not audio processing
4. **Cost-effective**: No audio proxying through servers
5. **Isolation**: Complete tenant and session separation
6. **Reliability**: Proven stable in production testing