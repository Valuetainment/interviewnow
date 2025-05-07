# Hybrid Architecture Implementation Guide
# Building the Fly.io + OpenAI WebRTC Interview Platform

This guide provides step-by-step instructions for implementing the hybrid architecture combining Fly.io and OpenAI WebRTC capabilities for our AI Interview Platform.

## Prerequisites

- Node.js 18+ and npm/yarn
- Supabase account and project
- OpenAI API key with access to Realtime API
- api.video account and API key
- Fly.io account and CLI installed

## 1. Setting Up the Development Environment

### Initial Project Structure

Create a project with the following structure:

```
ai-interview-platform/
├── client/                  # React frontend
├── server/                  # Express server for local development
├── fly-app/                 # Fly.io application code
│   ├── Dockerfile
│   ├── src/
│   └── package.json
├── supabase/
│   ├── migrations/          # Database migrations
│   └── functions/           # Edge functions
└── package.json
```

### Environment Configuration

Create a `.env` file in the root directory:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenAI Configuration
OPENAI_API_KEY=your-openai-key

# api.video Configuration
API_VIDEO_KEY=your-apivideo-key

# Fly.io Configuration
FLY_API_TOKEN=your-fly-token
FLY_ORGANIZATION=your-org-name
```

## 2. Database Schema Setup

### Create Migration Scripts

Create the necessary tables in Supabase:

```sql
-- migration.sql
-- Users table is handled by Supabase Auth

-- Tenants
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tenant Users Junction
CREATE TABLE tenant_users (
  tenant_id UUID REFERENCES tenants(id),
  user_id UUID REFERENCES auth.users(id),
  role TEXT NOT NULL DEFAULT 'member',
  PRIMARY KEY (tenant_id, user_id)
);

-- Candidates
CREATE TABLE candidates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tenant Candidates Junction
CREATE TABLE tenant_candidates (
  tenant_id UUID REFERENCES tenants(id),
  candidate_id UUID REFERENCES candidates(id),
  external_id TEXT,
  status TEXT,
  PRIMARY KEY (tenant_id, candidate_id)
);

-- Positions
CREATE TABLE positions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id),
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Interview Sessions
CREATE TABLE interview_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id),
  candidate_id UUID REFERENCES candidates(id),
  position_id UUID REFERENCES positions(id),
  user_id UUID REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'pending',
  settings JSONB NOT NULL DEFAULT '{}',
  fly_machine_id TEXT,
  video_recording_id TEXT,
  video_recording_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Transcript Entries
CREATE TABLE transcript_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES interview_sessions(id),
  tenant_id UUID REFERENCES tenants(id),
  speaker TEXT NOT NULL,
  text TEXT NOT NULL,
  confidence NUMERIC,
  start_ms BIGINT,
  end_ms BIGINT,
  sequence_number INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Interview Results
CREATE TABLE interview_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES interview_sessions(id) UNIQUE,
  tenant_id UUID REFERENCES tenants(id),
  summary TEXT,
  evaluation JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Configure Row-Level Security (RLS)

Set up RLS policies to ensure tenant isolation:

```sql
-- Enable RLS on all tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcript_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_results ENABLE ROW LEVEL SECURITY;

-- Tenant access policies
CREATE POLICY tenant_access_policy ON tenants
  USING (id IN (
    SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
  ));

-- Tenant Users access policies
CREATE POLICY tenant_users_access_policy ON tenant_users
  USING (tenant_id IN (
    SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
  ));

-- Similar policies for other tables...
```

## 3. Fly.io Interview Processor Implementation

### Dockerfile

Create a Dockerfile for the interview processor:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 8080

CMD ["node", "src/index.js"]
```

### Server Implementation

Create the main server file (`fly-app/src/index.js`):

```javascript
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { createClient } = require('@supabase/supabase-js');
const { fetch } = require('undici');

// Configuration
const PORT = process.env.PORT || 8080;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const API_VIDEO_KEY = process.env.API_VIDEO_KEY;

// Initialize Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Set up Express app
const app = express();
app.use(express.json());
const server = http.createServer(app);

// WebSocket server for session communication
const wss = new WebSocket.Server({ server });

// Session management
const activeSessions = new Map();

// API routes
app.post('/api/sessions', async (req, res) => {
  try {
    const { candidate_id, position_id, settings } = req.body;
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify JWT and get user info
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    // Get user's tenant(s)
    const { data: tenants, error: tenantError } = await supabase
      .from('tenant_users')
      .select('tenant_id')
      .eq('user_id', user.id);
      
    if (tenantError || !tenants.length) {
      return res.status(403).json({ error: 'No tenant access' });
    }
    
    const tenant_id = tenants[0].tenant_id;
    
    // Create session record
    const { data: session, error: sessionError } = await supabase
      .from('interview_sessions')
      .insert({
        tenant_id,
        candidate_id,
        position_id,
        user_id: user.id,
        status: 'pending',
        settings
      })
      .select()
      .single();
      
    if (sessionError) {
      return res.status(500).json({ error: 'Failed to create session' });
    }
    
    // Get position and candidate details
    const [positionResult, candidateResult] = await Promise.all([
      supabase.from('positions').select('*').eq('id', position_id).single(),
      supabase.from('candidates').select('*').eq('id', candidate_id).single()
    ]);
    
    // Generate api.video token
    const videoToken = await generateApiVideoToken(session.id);
    
    // Return session info
    res.json({
      session_id: session.id,
      websocket_url: `wss://${req.headers.host}/ws`,
      video_token: videoToken,
      interview_context: {
        position: positionResult.data,
        candidate: candidateResult.data
      }
    });
  } catch (error) {
    console.error('Session creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// WebSocket connection handling
wss.on('connection', (ws, req) => {
  let sessionId = null;
  let sessionInfo = null;
  
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      
      // Handle different message types
      switch(data.type) {
        case 'init_session':
          // Initialize session
          sessionId = data.session_id;
          
          // Get session info
          const { data: session, error } = await supabase
            .from('interview_sessions')
            .select('*')
            .eq('id', sessionId)
            .single();
            
          if (error) {
            ws.send(JSON.stringify({ 
              type: 'error', 
              error: 'Invalid session' 
            }));
            ws.close();
            return;
          }
          
          sessionInfo = session;
          activeSessions.set(sessionId, { ws, sessionInfo });
          
          // Update session status
          await supabase
            .from('interview_sessions')
            .update({ status: 'connecting' })
            .eq('id', sessionId);
          
          ws.send(JSON.stringify({ type: 'session_ready' }));
          break;
          
        case 'sdp_offer':
          // Forward SDP offer to OpenAI
          if (!sessionId) {
            ws.send(JSON.stringify({ 
              type: 'error', 
              error: 'Session not initialized' 
            }));
            return;
          }
          
          // Send offer to OpenAI API
          const response = await fetch('https://api.openai.com/v1/realtime', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${OPENAI_API_KEY}`,
              'Content-Type': 'application/sdp'
            },
            body: data.sdp
          });
          
          if (!response.ok) {
            ws.send(JSON.stringify({ 
              type: 'error', 
              error: 'Failed to connect to OpenAI' 
            }));
            return;
          }
          
          // Send SDP answer back to client
          const sdpAnswer = await response.text();
          ws.send(JSON.stringify({
            type: 'sdp_answer',
            sdp: sdpAnswer
          }));
          
          // Update session status
          await supabase
            .from('interview_sessions')
            .update({ 
              status: 'in_progress',
              started_at: new Date().toISOString()
            })
            .eq('id', sessionId);
          break;
          
        case 'transcript_update':
          // Store transcript entries
          if (!sessionId) {
            ws.send(JSON.stringify({ 
              type: 'error', 
              error: 'Session not initialized' 
            }));
            return;
          }
          
          // Insert transcript entries into database
          for (const entry of data.entries) {
            await supabase
              .from('transcript_entries')
              .insert({
                session_id: sessionId,
                tenant_id: sessionInfo.tenant_id,
                speaker: entry.speaker,
                text: entry.text,
                start_ms: new Date(entry.timestamp).getTime(),
                sequence_number: entry.sequence_number || 0
              });
          }
          break;
          
        case 'end_session':
          // End the session
          if (!sessionId) {
            ws.send(JSON.stringify({ 
              type: 'error', 
              error: 'Session not initialized' 
            }));
            return;
          }
          
          // Update session record with completion info
          await supabase
            .from('interview_sessions')
            .update({ 
              status: 'completed', 
              completed_at: new Date().toISOString(),
              video_recording_url: data.recording_url || null
            })
            .eq('id', sessionId);
            
          // Generate interview summary
          generateInterviewSummary(sessionId, sessionInfo.tenant_id);
          
          ws.send(JSON.stringify({ type: 'session_ended' }));
          
          // Remove from active sessions
          activeSessions.delete(sessionId);
          break;
          
        default:
          ws.send(JSON.stringify({ 
            type: 'error', 
            error: 'Unknown message type' 
          }));
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
      ws.send(JSON.stringify({ 
        type: 'error', 
        error: 'Failed to process message' 
      }));
    }
  });
  
  ws.on('close', async () => {
    if (sessionId) {
      // Handle unexpected disconnections
      const session = activeSessions.get(sessionId);
      if (session) {
        // Check if session wasn't properly ended
        const { data } = await supabase
          .from('interview_sessions')
          .select('status')
          .eq('id', sessionId)
          .single();
          
        if (data && data.status !== 'completed') {
          await supabase
            .from('interview_sessions')
            .update({ 
              status: 'disconnected', 
              completed_at: new Date().toISOString() 
            })
            .eq('id', sessionId);
        }
        
        activeSessions.delete(sessionId);
      }
    }
  });
});

// Helper functions
async function generateApiVideoToken(sessionId) {
  try {
    // Create a client token for api.video
    const response = await fetch('https://ws.api.video/upload-tokens', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_VIDEO_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ttl: 3600, // 1 hour
        metadata: {
          session_id: sessionId
        }
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to generate video token');
    }
    
    const data = await response.json();
    return data.token;
  } catch (error) {
    console.error('Video token generation error:', error);
    throw error;
  }
}

async function generateInterviewSummary(sessionId, tenantId) {
  try {
    // Get transcript entries
    const { data: entries } = await supabase
      .from('transcript_entries')
      .select('*')
      .eq('session_id', sessionId)
      .order('sequence_number', { ascending: true });
      
    if (!entries || entries.length === 0) {
      console.log('No transcript entries found');
      return;
    }
    
    // Format transcript for summarization
    const transcript = entries.map(entry => {
      return `${entry.speaker === 'ai' ? 'Interviewer' : 'Candidate'}: ${entry.text}`;
    }).join('\n\n');
    
    // Use OpenAI to generate summary
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at summarizing job interviews. Create a concise summary of the interview highlighting key points from the candidate\'s responses. Include strengths, areas for improvement, and overall impression.'
          },
          {
            role: 'user',
            content: `Here is the interview transcript:\n\n${transcript}`
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });
    
    if (!openaiResponse.ok) {
      throw new Error('Failed to generate summary');
    }
    
    const summaryData = await openaiResponse.json();
    const summary = summaryData.choices[0].message.content;
    
    // Store summary in database
    await supabase
      .from('interview_results')
      .insert({
        session_id: sessionId,
        tenant_id: tenantId,
        summary
      });
      
    console.log('Interview summary generated and stored');
  } catch (error) {
    console.error('Summary generation error:', error);
  }
}

// Start the server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### Package Configuration

Configure the Node.js package for the Fly Machine:

```json
{
  "name": "interview-processor",
  "version": "1.0.0",
  "description": "Interview processor for AI Interview Platform",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.20.0",
    "express": "^4.18.2",
    "undici": "^5.21.0",
    "ws": "^8.13.0"
  },
  "devDependencies": {
    "nodemon": "^2.0.22"
  }
}
```

## 4. Client-Side Implementation

### React Application Setup

Set up the React application with necessary dependencies:

```bash
# In the client directory
npx create-react-app .
npm install @supabase/supabase-js @api.video/video-recorder
```

### WebRTC Interface Component

Create a WebRTC interface for connecting to OpenAI:

```jsx
// client/src/components/WebRTCInterface.jsx
import React, { useState, useEffect, useRef } from 'react';

const WebRTCInterface = ({ sessionId, sdpAnswer, onTranscriptUpdate }) => {
  const [status, setStatus] = useState('initializing');
  const [transcript, setTranscript] = useState([]);
  
  const peerConnectionRef = useRef(null);
  const dataChannelRef = useRef(null);
  const streamRef = useRef(null);
  
  // Initialize WebRTC connection
  useEffect(() => {
    const initializeWebRTC = async () => {
      try {
        // Get user media
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        
        // Create peer connection
        const peerConnection = new RTCPeerConnection({
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });
        peerConnectionRef.current = peerConnection;
        
        // Add audio track to peer connection
        const [audioTrack] = stream.getAudioTracks();
        peerConnection.addTrack(audioTrack, stream);
        
        // Create data channel
        const dataChannel = peerConnection.createDataChannel('openai-realtime');
        dataChannelRef.current = dataChannel;
        
        // Set up data channel event handlers
        dataChannel.onopen = () => {
          console.log('Data channel opened');
          setStatus('connected');
          
          // Send session configuration
          sendSessionConfig();
        };
        
        dataChannel.onmessage = (event) => {
          handleDataChannelMessage(JSON.parse(event.data));
        };
        
        dataChannel.onerror = (error) => {
          console.error('Data channel error:', error);
        };
        
        dataChannel.onclose = () => {
          console.log('Data channel closed');
          setStatus('disconnected');
        };
        
        // Set up remote track handler
        peerConnection.ontrack = (event) => {
          const [remoteStream] = event.streams;
          // Connect to audio element
          const audioElement = document.getElementById('remote-audio');
          if (audioElement) {
            audioElement.srcObject = remoteStream;
          }
        };
        
        // Create offer
        await peerConnection.setRemoteDescription({
          type: 'answer',
          sdp: sdpAnswer
        });
        
        setStatus('connecting');
      } catch (error) {
        console.error('WebRTC initialization error:', error);
        setStatus('error');
      }
    };
    
    if (sessionId && sdpAnswer) {
      initializeWebRTC();
    }
    
    return () => {
      // Cleanup
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [sessionId, sdpAnswer]);
  
  // Send session configuration
  const sendSessionConfig = () => {
    if (dataChannelRef.current?.readyState === 'open') {
      // Send session configuration
      dataChannelRef.current.send(JSON.stringify({
        type: 'session.update',
        session: {
          instructions: 'You are an interviewer for a software engineering position. Ask relevant technical questions and evaluate the candidate\'s responses.',
          voice: 'alloy',
          input_audio_transcription: { model: 'whisper-1' },
          temperature: 0.7,
        }
      }));
      
      // Start the interview
      dataChannelRef.current.send(JSON.stringify({
        type: 'response.create',
        response: {
          modalities: ['text', 'audio'],
          instructions: 'Introduce yourself and ask the candidate to tell you about their experience.',
          max_output_tokens: 100
        }
      }));
    }
  };
  
  // Handle incoming data channel messages
  const handleDataChannelMessage = (message) => {
    console.log('Received message:', message);
    
    switch (message.type) {
      case 'conversation.item.input_audio_transcription.completed':
        // Add candidate transcript
        const candidateEntry = {
          speaker: 'candidate',
          text: message.transcript,
          timestamp: new Date().toISOString()
        };
        
        updateTranscript(candidateEntry);
        break;
        
      case 'response.audio_transcript.delta':
        // Add AI transcript
        const aiEntry = {
          speaker: 'ai',
          text: message.text,
          timestamp: new Date().toISOString()
        };
        
        updateTranscript(aiEntry);
        break;
        
      case 'response.function_call_arguments.done':
        if (message.name === 'end_session') {
          handleEndSession();
        }
        break;
        
      default:
        // Handle other message types as needed
    }
  };
  
  // Update transcript and notify parent
  const updateTranscript = (entry) => {
    setTranscript(prev => {
      const updated = [...prev, entry];
      // Notify parent component
      onTranscriptUpdate(updated);
      return updated;
    });
  };
  
  // End session
  const handleEndSession = () => {
    if (dataChannelRef.current?.readyState === 'open') {
      // Send goodbye message
      dataChannelRef.current.send(JSON.stringify({
        type: 'response.create',
        response: {
          modalities: ['text', 'audio'],
          instructions: 'Thank the candidate for their time and end the interview.',
          max_output_tokens: 100
        }
      }));
      
      // Close connection after response
      setTimeout(() => {
        if (peerConnectionRef.current) {
          peerConnectionRef.current.close();
        }
        setStatus('completed');
      }, 5000);
    } else {
      setStatus('completed');
    }
  };
  
  return (
    <div className="webrtc-interface">
      <div className="status">Status: {status}</div>
      <audio id="remote-audio" autoPlay></audio>
      
      <div className="transcript">
        <h3>Transcript</h3>
        <div className="transcript-entries">
          {transcript.map((entry, index) => (
            <div key={index} className={`transcript-entry ${entry.speaker}`}>
              <div className="speaker">{entry.speaker === 'ai' ? 'Interviewer' : 'Candidate'}</div>
              <div className="text">{entry.text}</div>
            </div>
          ))}
        </div>
      </div>
      
      <button 
        onClick={handleEndSession} 
        disabled={status !== 'connected'}
      >
        End Interview
      </button>
    </div>
  );
};

export default WebRTCInterface;
```

### Video Recorder Component

Implement the api.video recorder component:

```jsx
// client/src/components/VideoRecorder.jsx
import React, { useState, useEffect, useRef } from 'react';
import { createRecorder } from '@api.video/video-recorder';

const VideoRecorder = ({ sessionId, videoToken, onRecordingUpdate }) => {
  const [status, setStatus] = useState('initializing');
  const [recordingId, setRecordingId] = useState(null);
  const recorderRef = useRef(null);
  const containerRef = useRef(null);
  
  useEffect(() => {
    if (!videoToken) return;
    
    const initializeRecorder = async () => {
      try {
        // Initialize api.video recorder
        const recorder = createRecorder({
          apiKey: videoToken,
          recordingId: sessionId,
          features: {
            recorder: {
              autoStart: false,
              camera: true,
              audio: false, // Audio handled by WebRTC
              countdown: 3
            }
          }
        });
        
        // Mount to container
        if (containerRef.current) {
          recorder.mount(containerRef.current);
        }
        
        // Set up event handlers
        recorder.on('recording.started', () => {
          setStatus('recording');
          setRecordingId(sessionId);
          onRecordingUpdate({ 
            status: 'recording', 
            recordingId: sessionId 
          });
        });
        
        recorder.on('recording.stopped', () => {
          setStatus('completed');
          const videoUrl = recorder.getAssets().mp4;
          onRecordingUpdate({ 
            status: 'completed', 
            recordingId: sessionId,
            url: videoUrl
          });
        });
        
        recorderRef.current = recorder;
        setStatus('ready');
      } catch (error) {
        console.error('Video recorder initialization error:', error);
        setStatus('error');
      }
    };
    
    initializeRecorder();
    
    return () => {
      // Cleanup
      if (recorderRef.current) {
        recorderRef.current.destroy();
      }
    };
  }, [sessionId, videoToken, onRecordingUpdate]);
  
  // Start recording
  const startRecording = () => {
    if (recorderRef.current && status === 'ready') {
      recorderRef.current.start();
    }
  };
  
  // Stop recording
  const stopRecording = () => {
    if (recorderRef.current && status === 'recording') {
      recorderRef.current.stop();
    }
  };
  
  return (
    <div className="video-recorder">
      <div ref={containerRef} className="recorder-container"></div>
      
      <div className="controls">
        {status === 'ready' && (
          <button onClick={startRecording}>Start Recording</button>
        )}
        
        {status === 'recording' && (
          <button onClick={stopRecording}>Stop Recording</button>
        )}
        
        <div className="status">Status: {status}</div>
      </div>
    </div>
  );
};

export default VideoRecorder;
```

### Interview Session Component

Create the main interview session component:

```jsx
// client/src/components/InterviewSession.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import WebRTCInterface from './WebRTCInterface';
import VideoRecorder from './VideoRecorder';

const InterviewSession = () => {
  const { sessionId } = useParams();
  const [status, setStatus] = useState('initializing');
  const [sessionData, setSessionData] = useState(null);
  const [websocket, setWebsocket] = useState(null);
  const [sdpAnswer, setSdpAnswer] = useState(null);
  const [videoToken, setVideoToken] = useState(null);
  const [recordingData, setRecordingData] = useState(null);
  const [transcript, setTranscript] = useState([]);
  
  // Initialize session
  useEffect(() => {
    const initializeSession = async () => {
      try {
        // Check if session exists and user has access
        const { data: session, error } = await supabase
          .from('interview_sessions')
          .select('*, positions(*), candidates(*)')
          .eq('id', sessionId)
          .single();
          
        if (error) {
          console.error('Session fetch error:', error);
          setStatus('error');
          return;
        }
        
        setSessionData(session);
        
        // Connect to Fly.io VM via WebSocket
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/api/ws`;
        const ws = new WebSocket(wsUrl);
        
        ws.onopen = () => {
          console.log('WebSocket connected');
          // Initialize session
          ws.send(JSON.stringify({
            type: 'init_session',
            session_id: sessionId
          }));
        };
        
        ws.onmessage = (event) => {
          const message = JSON.parse(event.data);
          console.log('Received message:', message);
          
          switch (message.type) {
            case 'session_ready':
              setStatus('ready');
              // Create and send SDP offer
              createOffer(ws);
              break;
              
            case 'sdp_answer':
              setSdpAnswer(message.sdp);
              setStatus('connecting');
              break;
              
            case 'video_token':
              setVideoToken(message.token);
              break;
              
            case 'error':
              console.error('Session error:', message.error);
              setStatus('error');
              break;
              
            case 'session_ended':
              setStatus('completed');
              ws.close();
              break;
          }
        };
        
        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          setStatus('error');
        };
        
        ws.onclose = () => {
          console.log('WebSocket closed');
          if (status !== 'completed') {
            setStatus('disconnected');
          }
        };
        
        setWebsocket(ws);
      } catch (error) {
        console.error('Session initialization error:', error);
        setStatus('error');
      }
    };
    
    initializeSession();
    
    return () => {
      // Cleanup WebSocket
      if (websocket) {
        websocket.close();
      }
    };
  }, [sessionId]);
  
  // Create WebRTC offer
  const createOffer = async (ws) => {
    try {
      // Create peer connection to generate offer
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });
      
      // Add audio track (needed for offer generation)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });
      
      // Generate offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      // Wait for ICE gathering to complete
      await new Promise(resolve => {
        if (pc.iceGatheringState === 'complete') {
          resolve();
        } else {
          pc.addEventListener('icegatheringstatechange', () => {
            if (pc.iceGatheringState === 'complete') {
              resolve();
            }
          });
        }
      });
      
      // Send offer to server
      ws.send(JSON.stringify({
        type: 'sdp_offer',
        sdp: pc.localDescription.sdp
      }));
      
      // Clean up temporary peer connection
      stream.getTracks().forEach(track => track.stop());
      pc.close();
    } catch (error) {
      console.error('Offer creation error:', error);
      setStatus('error');
    }
  };
  
  // Handle transcript updates
  const handleTranscriptUpdate = useCallback((entries) => {
    setTranscript(entries);
    
    // Send updates to server
    if (websocket && websocket.readyState === WebSocket.OPEN) {
      websocket.send(JSON.stringify({
        type: 'transcript_update',
        entries
      }));
    }
  }, [websocket]);
  
  // Handle recording updates
  const handleRecordingUpdate = useCallback((data) => {
    setRecordingData(data);
    
    // If recording is completed, send URL to server
    if (data.status === 'completed' && data.url && websocket && websocket.readyState === WebSocket.OPEN) {
      websocket.send(JSON.stringify({
        type: 'end_session',
        recording_url: data.url,
        final_transcript: transcript
      }));
    }
  }, [websocket, transcript]);
  
  if (status === 'error') {
    return <div className="error">Error initializing interview session</div>;
  }
  
  if (status === 'initializing' || !sessionData) {
    return <div className="loading">Loading session...</div>;
  }
  
  return (
    <div className="interview-session">
      <div className="session-header">
        <h1>Interview Session</h1>
        <div className="status">Status: {status}</div>
      </div>
      
      <div className="session-info">
        <div className="position">
          <h2>Position: {sessionData.positions.title}</h2>
          <p>{sessionData.positions.description}</p>
        </div>
        
        <div className="candidate">
          <h2>Candidate: {sessionData.candidates.name}</h2>
          <p>{sessionData.candidates.email}</p>
        </div>
      </div>
      
      <div className="interview-area">
        <div className="video-area">
          {videoToken && (
            <VideoRecorder
              sessionId={sessionId}
              videoToken={videoToken}
              onRecordingUpdate={handleRecordingUpdate}
            />
          )}
        </div>
        
        <div className="audio-area">
          {sdpAnswer && (
            <WebRTCInterface
              sessionId={sessionId}
              sdpAnswer={sdpAnswer}
              onTranscriptUpdate={handleTranscriptUpdate}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default InterviewSession;
```

### Supabase Client Setup

Create a Supabase client file:

```javascript
// client/src/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

## 5. Fly.io Deployment

### Create Fly App for Tenant

Create a new Fly app for each tenant using the Fly CLI:

```bash
fly apps create interviews-tenant123
```

### Set Secrets

Set the necessary API keys and environment variables:

```bash
fly secrets set OPENAI_API_KEY="your-openai-key" \
               SUPABASE_URL="your-supabase-url" \
               SUPABASE_SERVICE_KEY="your-service-key" \
               API_VIDEO_KEY="your-apivideo-key" \
               --app interviews-tenant123
```

### Deploy Interview Processor

Deploy the interview processor to Fly.io:

```bash
cd fly-app
fly deploy --app interviews-tenant123
```

### Create Interview Session Machines

For each interview session, provision a new machine:

```bash
fly machine run \
  --app interviews-tenant123 \
  --region fra \
  --name "interview-${SESSION_ID}" \
  --env "SESSION_ID=${SESSION_ID}" \
  --env "TENANT_ID=${TENANT_ID}" \
  --image registry.fly.io/interview-processor:latest \
  --vm-memory 512 \
  --vm-cpus 1
```

## 6. Integration Testing

### Local Development Setup

Set up a development environment for testing:

```javascript
// server/index.js
const express = require('express');
const http = require('http');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3001;

// Serve static files from the React app
app.use(express.static('../client/build'));

// Proxy API requests to Fly.io
app.use('/api', createProxyMiddleware({
  target: 'https://interviews-tenant123.fly.dev',
  changeOrigin: true,
  ws: true,
  pathRewrite: {
    '^/api': '',
  },
}));

// All other requests go to the React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build/index.html'));
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### Test End-to-End Flow

Test the complete interview flow:

1. Create a new interview session
2. Connect to WebRTC and api.video services
3. Conduct a test interview
4. Verify transcript and recording storage
5. Validate the interview summary generation

## 7. Monitoring and Error Handling

### Implement Basic Monitoring

Set up basic monitoring for the Fly.io app:

```javascript
// fly-app/src/monitoring.js
const os = require('os');
const process = require('process');

// Basic system metrics
function collectMetrics() {
  return {
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      total: os.totalmem(),
      free: os.freemem(),
      used: process.memoryUsage(),
    },
    cpu: {
      load: os.loadavg(),
      cores: os.cpus().length,
    },
    sessions: {
      active: activeSessions.size,
    },
  };
}

// Log metrics every minute
setInterval(() => {
  const metrics = collectMetrics();
  console.log('METRICS:', JSON.stringify(metrics));
}, 60000);

// Error handler
process.on('uncaughtException', (error) => {
  console.error('UNCAUGHT_EXCEPTION:', error);
  // Implement notification or alerting here
});

module.exports = { collectMetrics };
```

### Structured Logging

Implement structured logging for better observability:

```javascript
// fly-app/src/logger.js
function log(level, message, data = {}) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...data,
  };
  
  console.log(JSON.stringify(logEntry));
}

module.exports = {
  debug: (message, data) => log('debug', message, data),
  info: (message, data) => log('info', message, data),
  warn: (message, data) => log('warn', message, data),
  error: (message, data) => log('error', message, data),
};
```

## 8. Future Enhancements

### Automated Testing

Set up automated testing for the system:

```javascript
// test/interview-flow.test.js
const { expect } = require('chai');
const WebSocket = require('ws');
const fetch = require('node-fetch');

describe('Interview Flow', () => {
  let sessionId;
  let wsUrl;
  
  before(async () => {
    // Create test session
    const response = await fetch('https://interviews-tenant123.fly.dev/api/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${testUserToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        candidate_id: testCandidateId,
        position_id: testPositionId,
      }),
    });
    
    const data = await response.json();
    sessionId = data.session_id;
    wsUrl = data.websocket_url;
  });
  
  it('should connect to WebSocket', (done) => {
    const ws = new WebSocket(wsUrl);
    
    ws.on('open', () => {
      expect(ws.readyState).to.equal(WebSocket.OPEN);
      ws.close();
      done();
    });
    
    ws.on('error', (error) => {
      done(error);
    });
  });
  
  // Add more tests for the complete flow
});
```

### Scalability Improvements

Implement strategies for handling high loads:

1. Use Fly.io machine pool for fast startup
2. Implement caching for session initialization
3. Add database connection pooling
4. Set up regional deployment based on user location 