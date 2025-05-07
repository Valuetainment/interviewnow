# Integration Guide: Hybrid WebRTC Implementation

This guide outlines the steps needed to integrate the WebRTC SDP proxy implementation into the main AI Interview Platform application.

## Overview

The integration will focus on:

1. Creating React components for the main application
2. Setting up the backend infrastructure on Fly.io
3. Configuring the database for session tracking
4. Implementing the interview flow with the hybrid architecture

## Client-Side Integration

### 1. Create React WebRTC Components

Create the following React components in `src/components/interview/`:

```tsx
// WebRTCManager.tsx
import { useState, useEffect, useRef } from 'react';

interface WebRTCManagerProps {
  sessionId?: string;
  onTranscriptUpdate: (text: string) => void;
  onConnectionStateChange: (state: string) => void;
  serverUrl: string;
}

export const WebRTCManager: React.FC<WebRTCManagerProps> = ({
  sessionId,
  onTranscriptUpdate,
  onConnectionStateChange,
  serverUrl
}) => {
  const [connectionState, setConnectionState] = useState<string>('disconnected');
  const wsRef = useRef<WebSocket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  // WebSocket connection setup
  useEffect(() => {
    // Implementation similar to the test client
    // ...
  }, [serverUrl]);

  // Connection state handler
  const handleConnectionStateChange = () => {
    // Update connection state and notify parent
    // ...
  };

  // Public methods for parent components
  const connect = async () => {
    // Establish connection
    // ...
  };

  const disconnect = () => {
    // Clean up connection
    // ...
  };

  return (
    <div className="webrtc-manager">
      {/* Status indicators */}
    </div>
  );
};
```

### 2. Create Interview Room Component

```tsx
// InterviewRoom.tsx
import { useState, useEffect } from 'react';
import { WebRTCManager } from './WebRTCManager';
import { TranscriptPanel } from './TranscriptPanel';
import { VideoRecorder } from './VideoRecorder';

interface InterviewRoomProps {
  interviewId: string;
  candidateId: string;
  positionId: string;
}

export const InterviewRoom: React.FC<InterviewRoomProps> = ({
  interviewId,
  candidateId,
  positionId
}) => {
  const [transcript, setTranscript] = useState<string>('');
  const [connectionState, setConnectionState] = useState<string>('disconnected');
  const serverUrl = process.env.NEXT_PUBLIC_WEBRTC_PROXY_URL || 'wss://interview-proxy.fly.dev';

  // Handle transcript updates
  const handleTranscriptUpdate = (text: string) => {
    setTranscript(prevTranscript => prevTranscript + ' ' + text);
  };

  // Save transcript periodically
  useEffect(() => {
    const saveInterval = setInterval(() => {
      if (transcript.trim()) {
        // Call API to save transcript
      }
    }, 10000);

    return () => clearInterval(saveInterval);
  }, [transcript, interviewId]);

  return (
    <div className="interview-room">
      <div className="interview-controls">
        {/* Interview controls */}
      </div>
      
      <div className="interview-panels">
        <WebRTCManager
          sessionId={interviewId}
          onTranscriptUpdate={handleTranscriptUpdate}
          onConnectionStateChange={setConnectionState}
          serverUrl={serverUrl}
        />
        
        <VideoRecorder
          sessionId={interviewId}
          active={connectionState === 'connected'}
        />
        
        <TranscriptPanel
          transcript={transcript}
          interviewId={interviewId}
        />
      </div>
    </div>
  );
};
```

## Backend Integration

### 1. Fly.io Deployment

1. Set up a new Fly.io application for each tenant:

```bash
fly apps create interview-proxy-tenant-{id}
```

2. Configure secrets for each tenant:

```bash
fly secrets set -a interview-proxy-tenant-{id} OPENAI_API_KEY=your_key JWT_SECRET=your_secret
```

3. Deploy the SDP proxy to each tenant:

```bash
fly deploy -a interview-proxy-tenant-{id}
```

### 2. Database Schema Updates

Update the existing interview_sessions table with WebRTC fields:

```sql
ALTER TABLE interview_sessions
ADD COLUMN webrtc_status TEXT DEFAULT 'pending',
ADD COLUMN webrtc_server_url TEXT,
ADD COLUMN webrtc_session_id TEXT,
ADD COLUMN ice_candidates JSONB DEFAULT '[]',
ADD COLUMN sdp_offers JSONB DEFAULT '[]',
ADD COLUMN sdp_answers JSONB DEFAULT '[]';
```

Create a transcript_entries table:

```sql
CREATE TABLE transcript_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  interview_session_id UUID NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  speaker TEXT,
  confidence FLOAT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE transcript_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view transcript entries for sessions they have access to"
  ON transcript_entries
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM interview_sessions s
    WHERE s.id = transcript_entries.interview_session_id
    AND (
      s.tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid())
      OR s.candidate_id IN (SELECT id FROM candidates WHERE email = auth.email())
    )
  ));

CREATE POLICY "Users can insert transcript entries for active sessions"
  ON transcript_entries
  FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM interview_sessions s
    WHERE s.id = transcript_entries.interview_session_id
    AND s.status = 'in_progress'
    AND s.tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid())
  ));
```

### 3. Create API Endpoints

Create Edge Functions for interview management:

1. `supabase/functions/interview-start/index.ts`:
   - Provisions a Fly.io VM for the interview
   - Creates WebRTC session
   - Updates the interview record with WebRTC details

2. `supabase/functions/interview-transcript/index.ts`:
   - Stores transcript updates in the database
   - Processes transcript for analytics

## Integration Flow

1. **Interview Creation**:
   - Create interview record in `interview_sessions` table
   - Generate unique identifier for the session

2. **Interview Start**:
   - Call `interview-start` function
   - Receive WebRTC connection details
   - Update UI with connection status

3. **During Interview**:
   - WebRTC manager handles audio streaming directly to OpenAI
   - Transcript updates saved to database periodically
   - Video recording handled through api.video integration

4. **Interview End**:
   - Save final transcript
   - Process complete interview data
   - Update interview status

## Security Considerations

1. **API Key Management**:
   - Store API keys in Fly.io secrets
   - Never expose keys to the client

2. **Authentication**:
   - Use JWT tokens for WebSocket authentication
   - Validate session ownership before allowing connections

3. **Tenant Isolation**:
   - Create separate Fly.io applications per tenant
   - Implement proper RLS policies for database access

## Testing Integration

1. Create a simplified test page in the main application
2. Test the complete flow from session creation to completion
3. Verify transcript storage and retrieval
4. Test with different network conditions

## Rollout Strategy

1. **Development Testing**:
   - Test with internal users
   - Verify performance and reliability

2. **Limited Beta**:
   - Deploy to select customers
   - Monitor performance and gather feedback

3. **Full Production**:
   - Scale Fly.io resources as needed
   - Implement monitoring and alerts

This integration approach ensures the benefits of direct WebRTC connections while maintaining security and scalability through the proxy architecture. 