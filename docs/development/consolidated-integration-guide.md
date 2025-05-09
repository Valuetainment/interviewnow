# Hybrid Architecture Integration Guide
# Implementing WebRTC Proxy for the AI Interview Platform

## Overview

This guide provides comprehensive instructions for integrating the WebRTC SDP proxy implementation and real-time interview capabilities into the main AI Interview Platform application. It combines lessons learned from the proof-of-concept with the detailed implementation steps needed for production deployment.

## Integration Goals

1. Create React components for WebRTC communication in the main application
2. Set up multi-tenant backend infrastructure on Fly.io
3. Configure the database for session tracking and transcript storage
4. Implement the complete interview flow with security and scalability
5. Add proper authentication, error handling, and monitoring

## Architecture Overview

The hybrid architecture utilizes:

- **WebRTC** for direct, secure audio streaming between clients and OpenAI
- **Fly.io** as an SDP proxy to maintain security without compromising performance
- **api.video** (optional) for interview recording capabilities
- **Supabase** for authentication, database storage, and RLS policies

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
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  // WebSocket connection setup
  useEffect(() => {
    if (!serverUrl || !sessionId) return;
    
    const connectWebSocket = () => {
      const ws = new WebSocket(`${serverUrl}?session=${sessionId}`);
      
      ws.onopen = () => {
        console.log('WebSocket connected');
        setConnectionState('ws_connected');
        onConnectionStateChange('ws_connected');
      };
      
      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          if (message.type === 'sdp_answer') {
            // Set remote description with the SDP answer
            handleSdpAnswer(message.sdp);
          } else if (message.type === 'ice_candidate') {
            // Add ICE candidate
            handleIceCandidate(message.candidate);
          } else if (message.type === 'error') {
            console.error('Server error:', message.message);
            setConnectionState('error');
            onConnectionStateChange('error');
          }
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
        }
      };
      
      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setConnectionState('disconnected');
        onConnectionStateChange('disconnected');
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionState('error');
        onConnectionStateChange('error');
      };
      
      wsRef.current = ws;
    };
    
    connectWebSocket();
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [serverUrl, sessionId, onConnectionStateChange]);

  // Initialize WebRTC connection
  const initializeWebRTC = async () => {
    try {
      // Create peer connection
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });
      
      // Set up data channel for receiving transcript
      const dataChannel = pc.createDataChannel('transcript');
      dataChannel.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.type === 'transcript') {
          onTranscriptUpdate(message.text);
        }
      };
      
      dataChannelRef.current = dataChannel;
      
      // Set up audio stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => pc.addTrack(track, stream));
      
      // Create and send offer
      const offer = await pc.createOffer({
        offerToReceiveAudio: false,
        offerToReceiveVideo: false
      });
      
      await pc.setLocalDescription(offer);
      
      // Send offer to server
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'sdp_offer',
          sdp: pc.localDescription.sdp
        }));
      }
      
      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'ice_candidate',
            candidate: event.candidate
          }));
        }
      };
      
      // Track connection state changes
      pc.onconnectionstatechange = () => {
        setConnectionState(pc.connectionState);
        onConnectionStateChange(pc.connectionState);
      };
      
      pcRef.current = pc;
    } catch (error) {
      console.error('Error initializing WebRTC:', error);
      setConnectionState('error');
      onConnectionStateChange('error');
    }
  };

  // Handle SDP answer from server
  const handleSdpAnswer = async (sdp: string) => {
    if (!pcRef.current) return;
    
    try {
      await pcRef.current.setRemoteDescription(new RTCSessionDescription({
        type: 'answer',
        sdp
      }));
    } catch (error) {
      console.error('Error setting remote description:', error);
    }
  };

  // Handle ICE candidate from server
  const handleIceCandidate = async (candidate: RTCIceCandidateInit) => {
    if (!pcRef.current) return;
    
    try {
      await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error('Error adding ICE candidate:', error);
    }
  };

  // Public methods
  const connect = async () => {
    if (connectionState === 'ws_connected') {
      await initializeWebRTC();
    }
  };

  const disconnect = () => {
    if (dataChannelRef.current) {
      dataChannelRef.current.close();
    }
    
    if (pcRef.current) {
      pcRef.current.close();
    }
    
    if (wsRef.current) {
      wsRef.current.close();
    }
    
    setConnectionState('disconnected');
    onConnectionStateChange('disconnected');
  };

  return (
    <div className="webrtc-manager">
      <div className="connection-status">
        Status: {connectionState}
      </div>
      <div className="connection-controls">
        <button onClick={connect} disabled={connectionState !== 'ws_connected'}>
          Start Interview
        </button>
        <button onClick={disconnect} disabled={connectionState === 'disconnected'}>
          End Interview
        </button>
      </div>
    </div>
  );
};
```

### 2. Create Transcript Component

```tsx
// TranscriptPanel.tsx
import { useState, useEffect, useRef } from 'react';

interface TranscriptPanelProps {
  transcript: string;
  interviewId: string;
}

export const TranscriptPanel: React.FC<TranscriptPanelProps> = ({
  transcript,
  interviewId
}) => {
  const transcriptRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom when transcript updates
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [transcript]);
  
  return (
    <div className="transcript-panel">
      <h3>Interview Transcript</h3>
      <div className="transcript-content" ref={transcriptRef}>
        {transcript.split('\n').map((line, index) => (
          <p key={index}>{line}</p>
        ))}
      </div>
    </div>
  );
};
```

### 3. Create Interview Room Component

```tsx
// InterviewRoom.tsx
import { useState, useEffect } from 'react';
import { WebRTCManager } from './WebRTCManager';
import { TranscriptPanel } from './TranscriptPanel';
import { VideoRecorder } from './VideoRecorder'; // If using api.video

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
  const [interviewStatus, setInterviewStatus] = useState<string>('pending');
  const serverUrl = process.env.NEXT_PUBLIC_WEBRTC_PROXY_URL || 'wss://interview-proxy.fly.dev';
  
  // Start interview session
  useEffect(() => {
    const startInterview = async () => {
      try {
        const response = await fetch('/api/interviews/start', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            interviewId,
            candidateId,
            positionId
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          setInterviewStatus('ready');
        } else {
          console.error('Failed to start interview');
          setInterviewStatus('error');
        }
      } catch (error) {
        console.error('Error starting interview:', error);
        setInterviewStatus('error');
      }
    };
    
    startInterview();
  }, [interviewId, candidateId, positionId]);
  
  // Handle transcript updates
  const handleTranscriptUpdate = (text: string) => {
    setTranscript(prevTranscript => prevTranscript + '\n' + text);
    
    // Save transcript update to database
    saveTranscriptUpdate(text);
  };
  
  // Save transcript update
  const saveTranscriptUpdate = async (text: string) => {
    try {
      await fetch('/api/interviews/transcript', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          interviewId,
          text,
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Error saving transcript:', error);
    }
  };
  
  // End interview
  const endInterview = async () => {
    try {
      await fetch('/api/interviews/end', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          interviewId,
          finalTranscript: transcript
        })
      });
      
      setInterviewStatus('completed');
    } catch (error) {
      console.error('Error ending interview:', error);
    }
  };
  
  // Save transcript periodically
  useEffect(() => {
    const saveInterval = setInterval(() => {
      if (transcript.trim() && interviewStatus === 'in_progress') {
        // Save the complete transcript periodically
        fetch('/api/interviews/save-transcript', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            interviewId,
            fullTranscript: transcript
          })
        }).catch(error => {
          console.error('Error saving full transcript:', error);
        });
      }
    }, 30000); // Every 30 seconds
    
    return () => clearInterval(saveInterval);
  }, [transcript, interviewId, interviewStatus]);
  
  // Update interview status based on connection state
  useEffect(() => {
    if (connectionState === 'connected' && interviewStatus === 'ready') {
      setInterviewStatus('in_progress');
    } else if (connectionState === 'disconnected' && interviewStatus === 'in_progress') {
      endInterview();
    }
  }, [connectionState, interviewStatus]);
  
  return (
    <div className="interview-room">
      <div className="interview-header">
        <h2>Interview Session</h2>
        <div className="status-indicator">
          Status: {interviewStatus}
        </div>
      </div>
      
      <div className="interview-content">
        <div className="interview-controls">
          <WebRTCManager
            sessionId={interviewId}
            onTranscriptUpdate={handleTranscriptUpdate}
            onConnectionStateChange={setConnectionState}
            serverUrl={serverUrl}
          />
        </div>
        
        <div className="interview-transcript">
          <TranscriptPanel
            transcript={transcript}
            interviewId={interviewId}
          />
        </div>
      </div>
    </div>
  );
};
```

## Backend Integration

### 1. Database Schema Updates

Update your migration files to add the necessary tables and fields:

```sql
-- Add WebRTC fields to interview_sessions table
ALTER TABLE interview_sessions
ADD COLUMN webrtc_status TEXT DEFAULT 'pending',
ADD COLUMN webrtc_server_url TEXT,
ADD COLUMN webrtc_session_id TEXT,
ADD COLUMN ice_candidates JSONB DEFAULT '[]',
ADD COLUMN sdp_offers JSONB DEFAULT '[]',
ADD COLUMN sdp_answers JSONB DEFAULT '[]';

-- Create transcript_entries table
CREATE TABLE transcript_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  interview_session_id UUID NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  speaker TEXT,
  confidence FLOAT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Add tenant isolation
  tenant_id UUID REFERENCES tenants(id)
);

-- Add RLS policies
ALTER TABLE transcript_entries ENABLE ROW LEVEL SECURITY;

-- Users can view transcript entries for sessions they have access to
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

-- Users can insert transcript entries for active sessions
CREATE POLICY "Users can insert transcript entries for active sessions"
  ON transcript_entries
  FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM interview_sessions s
    WHERE s.id = transcript_entries.interview_session_id
    AND s.status = 'in_progress'
    AND s.tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid())
  ));

-- Add video_segments table if using api.video
CREATE TABLE video_segments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  interview_session_id UUID NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
  video_url TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  status TEXT DEFAULT 'recording',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Add tenant isolation
  tenant_id UUID REFERENCES tenants(id)
);

-- Add RLS policies for video segments
ALTER TABLE video_segments ENABLE ROW LEVEL SECURITY;

-- Create similar RLS policies for video_segments...
```

### 2. Edge Functions Implementation

#### Interview Start Function

Create `supabase/functions/interview-start/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.8.0';
import { corsHeaders } from '../_shared/cors.ts';

interface InterviewStartRequest {
  interviewId: string;
  candidateId?: string;
  positionId?: string;
}

serve(async (req) => {
  // Handle CORS pre-flight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  try {
    // Get request data
    const { interviewId, candidateId, positionId } = await req.json() as InterviewStartRequest;
    
    if (!interviewId) {
      return new Response(
        JSON.stringify({ error: 'interviewId is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    // Initialize Supabase client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    // Get interview session data
    const { data: interview, error: fetchError } = await supabaseAdmin
      .from('interview_sessions')
      .select('*')
      .eq('id', interviewId)
      .single();
    
    if (fetchError || !interview) {
      return new Response(
        JSON.stringify({ error: 'Interview session not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }
    
    // Get tenant info for multi-tenant setup
    const tenantId = interview.tenant_id;
    
    // Generate WebRTC session configuration
    const sessionId = `session-${interviewId}`;
    const serverUrl = `wss://interview-proxy-tenant-${tenantId}.fly.dev`;
    
    // Update interview session with WebRTC details
    const { error: updateError } = await supabaseAdmin
      .from('interview_sessions')
      .update({
        webrtc_status: 'ready',
        webrtc_server_url: serverUrl,
        webrtc_session_id: sessionId,
        status: 'ready',
        updated_at: new Date().toISOString()
      })
      .eq('id', interviewId);
    
    if (updateError) {
      return new Response(
        JSON.stringify({ error: 'Failed to update interview session' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    // TODO: Provision Fly.io VM for the session if not using a pre-provisioned pool
    
    // Return success with connection details
    return new Response(
      JSON.stringify({
        success: true,
        interviewId,
        webrtc: {
          status: 'ready',
          serverUrl,
          sessionId
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in interview-start:', error);
    
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
```

#### Transcript Processing Function

Create `supabase/functions/interview-transcript/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.8.0';
import { corsHeaders } from '../_shared/cors.ts';

interface TranscriptRequest {
  interviewId: string;
  text: string;
  timestamp?: string;
  speaker?: string;
  confidence?: number;
}

serve(async (req) => {
  // Handle CORS pre-flight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  try {
    // Get request data
    const { interviewId, text, timestamp, speaker, confidence } = await req.json() as TranscriptRequest;
    
    if (!interviewId || !text) {
      return new Response(
        JSON.stringify({ error: 'interviewId and text are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    // Initialize Supabase client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    // Get interview session data to verify existence and get tenant_id
    const { data: interview, error: fetchError } = await supabaseAdmin
      .from('interview_sessions')
      .select('tenant_id')
      .eq('id', interviewId)
      .single();
    
    if (fetchError || !interview) {
      return new Response(
        JSON.stringify({ error: 'Interview session not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }
    
    // Insert transcript entry
    const { data: transcriptEntry, error: insertError } = await supabaseAdmin
      .from('transcript_entries')
      .insert({
        interview_session_id: interviewId,
        text,
        timestamp: timestamp || new Date().toISOString(),
        speaker: speaker || 'unknown',
        confidence: confidence || null,
        tenant_id: interview.tenant_id
      })
      .select()
      .single();
    
    if (insertError) {
      return new Response(
        JSON.stringify({ error: 'Failed to save transcript entry' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    // Return success with entry data
    return new Response(
      JSON.stringify({
        success: true,
        entry: transcriptEntry
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in interview-transcript:', error);
    
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
```

### 3. Fly.io SDP Proxy Deployment

1. **Set up a new Fly.io application for each tenant**:

```bash
fly apps create interview-proxy-tenant-${TENANT_ID}
```

2. **Configure secrets for each tenant**:

```bash
fly secrets set -a interview-proxy-tenant-${TENANT_ID} \
  OPENAI_API_KEY=your_openai_key \
  JWT_SECRET=your_jwt_secret \
  TENANT_ID=${TENANT_ID}
```

3. **Create a fly.toml configuration**:

```toml
app = "interview-proxy-tenant-[TENANT_ID]"
primary_region = "ord"
kill_signal = "SIGINT"
kill_timeout = 5

[env]
  PORT = "3000"
  LOG_LEVEL = "info"
  ICE_SERVER_URLS = "stun:stun.l.google.com:19302"

[http_service]
  internal_port = 3000
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 0
  processes = ["app"]

[[services.ports]]
  port = 80
  handlers = ["http"]
  force_https = true

[[services.ports]]
  port = 443
  handlers = ["tls", "http"]
```

4. **Deploy the SDP proxy**:

```bash
fly deploy -a interview-proxy-tenant-${TENANT_ID}
```

## API Routes Implementation

### 1. Interview Start API

Create a Next.js API route for starting an interview:

```typescript
// pages/api/interviews/start.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  // Get authenticated user
  const supabase = createServerSupabaseClient({ req, res });
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    const { interviewId, candidateId, positionId } = req.body;
    
    if (!interviewId) {
      return res.status(400).json({ error: 'interviewId is required' });
    }
    
    // Call the interview-start edge function
    const { data, error } = await supabase.functions.invoke('interview-start', {
      body: { interviewId, candidateId, positionId }
    });
    
    if (error) {
      console.error('Error starting interview:', error);
      return res.status(500).json({ error: 'Failed to start interview' });
    }
    
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error in start interview API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
```

### 2. Transcript Update API

Create a Next.js API route for updating the transcript:

```typescript
// pages/api/interviews/transcript.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  // Get authenticated user
  const supabase = createServerSupabaseClient({ req, res });
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    const { interviewId, text, timestamp } = req.body;
    
    if (!interviewId || !text) {
      return res.status(400).json({ error: 'interviewId and text are required' });
    }
    
    // Call the interview-transcript edge function
    const { data, error } = await supabase.functions.invoke('interview-transcript', {
      body: { interviewId, text, timestamp }
    });
    
    if (error) {
      console.error('Error updating transcript:', error);
      return res.status(500).json({ error: 'Failed to update transcript' });
    }
    
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error in transcript API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
```

## Authentication & Security

### WebSocket Authentication

1. **Generate Secure Tokens**:

```typescript
// utils/auth.ts
import jwt from 'jsonwebtoken';

export function generateWebSocketToken(userId: string, interviewId: string, tenantId: string) {
  const payload = {
    userId,
    interviewId,
    tenantId,
    exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour expiration
  };
  
  return jwt.sign(payload, process.env.JWT_SECRET!);
}
```

2. **Verify Tokens in WebSocket Server**:

```javascript
// In the SDP proxy server
const wss = new WebSocket.Server({ 
  server,
  verifyClient: async (info, callback) => {
    try {
      // Extract token
      const url = new URL(info.req.url, 'http://localhost');
      const token = url.searchParams.get('token');
      
      if (!token) {
        return callback(false, 401, 'Unauthorized');
      }
      
      // Verify token
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      info.req.user = payload;
      
      callback(true);
    } catch (error) {
      console.error('WebSocket authentication error:', error);
      callback(false, 401, 'Unauthorized');
    }
  }
});
```

3. **Connect with Token in Client**:

```typescript
// In WebRTCManager.tsx
const connectWebSocket = () => {
  // Get token from API
  fetch('/api/interviews/token?interviewId=' + sessionId)
    .then(response => response.json())
    .then(data => {
      // Connect with token
      const ws = new WebSocket(`${serverUrl}?token=${data.token}&session=${sessionId}`);
      // ... rest of WebSocket setup
    })
    .catch(error => {
      console.error('Error getting WebSocket token:', error);
    });
};
```

### API Key Protection

Never expose OpenAI API keys to the client. All API interactions happen through the SDP proxy on Fly.io.

## Error Handling & Recovery

### Client-Side Error Handling

```typescript
// Add this to WebRTCManager.tsx
const handleError = (type: string, error: any) => {
  console.error(`${type} error:`, error);
  
  // Update state
  setConnectionState('error');
  onConnectionStateChange('error');
  
  // Attempt recovery based on error type
  if (type === 'webrtc') {
    // Wait and try to reinitialize WebRTC
    setTimeout(() => {
      initializeWebRTC();
    }, 5000);
  } else if (type === 'websocket') {
    // Try to reconnect WebSocket
    setTimeout(() => {
      connectWebSocket();
    }, 3000);
  }
};
```

### Server-Side Error Handling

```javascript
// In the SDP proxy server
ws.on('error', (error) => {
  console.error('WebSocket error:', error);
  
  try {
    ws.send(JSON.stringify({
      type: 'error',
      code: 'INTERNAL_ERROR',
      message: 'An internal server error occurred'
    }));
  } catch (sendError) {
    console.error('Error sending error message:', sendError);
  }
});
```

## Testing Strategy

1. **Component Testing**:
   - Test WebRTCManager component in isolation
   - Mock WebSocket and WebRTC APIs
   - Verify state transitions and callbacks

2. **Integration Testing**:
   - Test complete interview flow with the SDP proxy
   - Verify transcript storage and retrieval
   - Test error handling and recovery

3. **Performance Testing**:
   - Test with simulated network conditions
   - Measure transcript latency
   - Test with concurrent sessions

## Deployment & Monitoring

### Deployment Checklist

1. **Database Migrations**:
   - Apply schema changes to staging and then production
   - Verify proper tenant isolation with RLS policies

2. **Edge Functions**:
   - Deploy interview-start and interview-transcript functions
   - Set proper environment variables

3. **Fly.io Deployment**:
   - Deploy SDP proxy for each tenant
   - Configure secrets and environment variables
   - Set up scaling policies

### Monitoring

1. **Session Metrics**:
   - Track number of active interview sessions
   - Monitor WebRTC connection success rates
   - Track transcript generation latency

2. **Resource Usage**:
   - Monitor CPU and memory usage on Fly.io VMs
   - Track API usage for OpenAI

3. **Error Tracking**:
   - Set up alerts for connection failures
   - Monitor transcript processing errors

## Rollout Strategy

1. **Development Testing**: Internal testing with simulated interviews
2. **Beta Testing**: Limited release to specific tenants
3. **Full Rollout**: Gradual deployment to all tenants with monitoring

## Conclusion

This integration guide provides a comprehensive path to implementing the WebRTC-based interview system in the main application. The hybrid architecture leverages WebRTC for direct audio streaming while maintaining security through the SDP proxy. By following this guide, you'll implement a scalable, multi-tenant solution that provides real-time interview transcription with proper security and error handling.

---

## Note

This is a consolidated document that combines information from:
- `/fly-interview-poc/PRODUCTION_INTEGRATION.md`
- `/fly-interview-hybrid/INTEGRATION_GUIDE.md`

Please refer to this document as the definitive integration guide for the hybrid WebRTC implementation.