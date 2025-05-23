# Complete Interview Execution Flow

This document outlines the detailed implementation steps for the complete interview flow, from setup to completion. This verified flow serves as a reference for developers implementing the WebRTC-based interview system.

## WebRTC Architecture Approaches

The interview platform now supports two WebRTC architecture approaches:

1. **Original SDP Proxy** (`fly-interview-poc/`):
   - Traditional WebRTC SDP proxy with server-side audio processing
   - Full audio transmission over WebSockets
   - Higher latency and more server resources required

2. **Hybrid OpenAI Approach** (`fly-interview-hybrid/`):
   - Uses OpenAI's native WebRTC capabilities
   - Fly.io only serves as a secure SDP exchange proxy
   - Direct WebRTC connection between client and OpenAI
   - Lower latency and more efficient resource usage

## Overview

The complete interview flow works in these stages:

1. **Interview Setup** - Initial configuration and session creation
2. **Connection Establishment** - WebRTC setup and signaling
3. **Session Configuration** - Setting interview parameters
4. **Interview Execution** - The actual interview process
5. **Interview Completion** - Cleanup and data persistence

## Stage 1: Interview Setup

This stage handles the initial setup for an interview session:

1. User selects candidate and position in `InterviewSetup.tsx`
2. System creates a new session record in the `interview_sessions` table
3. User is redirected to the interview page with the session ID

```typescript
// InterviewSetup.tsx (simplified)
const createInterviewSession = async (candidateId: string, positionId: string) => {
  const { data, error } = await supabase
    .from('interview_sessions')
    .insert({
      tenant_id: tenantId,
      candidate_id: candidateId,
      position_id: positionId,
      status: 'scheduled'
    })
    .select()
    .single();
    
  if (error) {
    console.error('Error creating interview session:', error);
    return null;
  }
  
  // Redirect to the interview room
  navigate(`/interview/${data.id}`);
  return data;
};
```

### Database Schema for Interview Sessions

```sql
CREATE TABLE interview_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id),
  position_id UUID REFERENCES positions(id),
  candidate_id UUID REFERENCES candidates(id),
  status TEXT NOT NULL DEFAULT 'scheduled',
  webrtc_status TEXT DEFAULT 'pending',
  webrtc_server_url TEXT,
  webrtc_session_id TEXT,
  ice_candidates JSONB DEFAULT '[]',
  sdp_offers JSONB DEFAULT '[]',
  sdp_answers JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

## Stage 2: Connection Establishment

This stage establishes the WebRTC connection via the SDP proxy:

1. `useWebRTC.connect()` initiates the WebRTC connection process
2. System fetches ephemeral key from `interview-start` edge function
3. Creates WebRTC peer connection with data channel
4. Generates SDP offer and sends it to SDP proxy
5. Receives SDP answer and establishes bidirectional audio connection

```typescript
// WebRTCManager.tsx (simplified)
async function connect() {
  // Step 1: Get connection details from edge function
  const { data: sessionConfig } = await supabase.functions.invoke('interview-start', {
    body: { session_id: sessionId }
  });
  
  // Step 2: Create WebRTC peer connection
  const peerConnection = new RTCPeerConnection({
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
  });
  
  // Step 3: Add audio track from microphone
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  stream.getAudioTracks().forEach(track => {
    peerConnection.addTrack(track, stream);
  });
  
  // Step 4: Create data channel for control messages
  const dataChannel = peerConnection.createDataChannel('openai-control');
  
  // Step 5: Create and send offer
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  
  // Step 6: Send offer to SDP proxy (via WebSocket)
  const ws = new WebSocket(sessionConfig.webrtc_server_url);
  ws.onopen = () => {
    ws.send(JSON.stringify({
      type: 'sdp_offer',
      sdp: peerConnection.localDescription.sdp
    }));
  };
  
  // Step 7: Receive answer and set remote description
  ws.onmessage = async (event) => {
    const message = JSON.parse(event.data);
    if (message.type === 'sdp_answer') {
      await peerConnection.setRemoteDescription({
        type: 'answer',
        sdp: message.sdp
      });
    }
  };
  
  return { peerConnection, dataChannel, stream, ws };
}
```

### SDP Proxy Flow

1. Client connects to Fly.io SDP proxy via WebSocket
2. SDP proxy receives offer and forwards to OpenAI API (with API key)
3. OpenAI returns SDP answer
4. SDP proxy forwards answer back to client
5. Direct WebRTC connection established between client and OpenAI

## Stage 3: Session Configuration

After the WebRTC connection is established, the session is configured:

1. After receiving "session.created" event, system sends "session.update" with:
   - Interview instructions based on position competencies
   - Company context for personalized interviews
   - Turn detection settings for conversational flow
   - Voice selection and audio format parameters

```typescript
// Session configuration after WebRTC connection established
dataChannel.onopen = () => {
  // Send session configuration
  dataChannel.send(JSON.stringify({
    type: 'session.update',
    session: {
      instructions: `You are an interviewer for the position of ${position.title}. 
                    Focus on evaluating these key competencies: ${competenciesString}.
                    Ask challenging but fair questions about the candidate's experience and skills.
                    The company ${company.name} values ${company.values}.`,
      voice: "alloy",
      tools: [
        {
          type: "function",
          name: "end_session",
          description: "End the interview session",
          parameters: {}
        }
      ],
      input_audio_transcription: { model: "whisper-1" },
      turn_detection: {
        type: "server_vad",
        threshold: 0.5,
        silence_duration_ms: 800,
        create_response: true
      }
    }
  }));
  
  // Start the interview
  dataChannel.send(JSON.stringify({
    type: 'response.create',
    response: {
      modalities: ['text', 'audio'],
      instructions: "Introduce yourself as an AI interviewer and ask the candidate to introduce themselves."
    }
  }));
};
```

## Stage 4: Interview Execution

This stage manages the actual interview conversation and recording:

1. AI interviewer begins with introduction based on instructions
2. User's audio is captured, encoded, and transmitted via WebRTC
3. `TranscriptRecorder` component captures and saves transcript entries:
   - Processes "input_audio_buffer.processed" for user speech
   - Handles "response.audio_transcript.delta" for AI responses
   - Debounces and processes turn detection events
4. Transcript entries are periodically saved to database (every 5-30 seconds)

```typescript
// TranscriptPanel.tsx (simplified)
dataChannel.onmessage = async (event) => {
  try {
    const message = JSON.parse(event.data);
    
    switch (message.type) {
      case 'conversation.item.input_audio_transcription.completed':
        // Candidate speech transcript
        addTranscriptEntry({
          session_id: sessionId,
          speaker: 'candidate',
          text: message.transcript,
          timestamp: new Date().toISOString()
        });
        break;
        
      case 'response.audio_transcript.delta':
        // AI speech transcript
        if (message.text && message.text.trim()) {
          addTranscriptEntry({
            session_id: sessionId,
            speaker: 'ai',
            text: message.text,
            timestamp: new Date().toISOString()
          });
        }
        break;
    }
  } catch (error) {
    console.error('Error processing WebRTC message:', error);
  }
};

// Save transcript entries to database
const saveTranscriptEntries = debounce(async (entries) => {
  if (entries.length === 0) return;
  
  try {
    const { error } = await supabase
      .from('transcript_entries')
      .insert(entries);
      
    if (error) throw error;
    
    // Mark entries as saved
    setSavedEntries(prev => [...prev, ...entries.map(e => e.id)]);
  } catch (error) {
    console.error('Error saving transcript entries:', error);
    // Queue for retry
    setFailedEntries(prev => [...prev, ...entries]);
  }
}, 5000); // Save every 5 seconds
```

### Transcript Storage Schema

```sql
CREATE TABLE transcript_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id),
  session_id UUID REFERENCES interview_sessions(id),
  speaker TEXT NOT NULL,
  text TEXT NOT NULL,
  start_ms INTEGER NOT NULL,
  confidence REAL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

## Stage 5: Interview Completion

The final stage handles the end of the interview session:

1. User clicks "End Interview" button, triggering disconnect process
2. System sends "session.cancel" message to OpenAI
3. Final transcript is saved with "completed" flag
4. Audio recording is uploaded to Supabase storage
5. Interview session status is updated to "completed"
6. For invitation interviews, invitation status is also updated

```typescript
// InterviewRoom.tsx (simplified)
const endInterview = async () => {
  try {
    // Step 1: Send end session message via data channel
    if (dataChannel && dataChannel.readyState === 'open') {
      dataChannel.send(JSON.stringify({
        type: 'session.cancel'
      }));
    }
    
    // Step 2: Close WebRTC connections
    if (peerConnection) {
      peerConnection.close();
    }
    
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.close();
    }
    
    // Step 3: Save any unsaved transcript entries
    await saveTranscriptEntries(pendingEntries);
    
    // Step 4: Update session status
    await supabase
      .from('interview_sessions')
      .update({
        status: 'completed',
        end_time: new Date().toISOString()
      })
      .eq('id', sessionId);
      
    // Step 5: If this is an invitation interview, update invitation
    if (invitation) {
      await supabase
        .from('interview_invitations')
        .update({ status: 'completed' })
        .eq('token', invitation.token);
    }
    
    // Step 6: Redirect to completion page
    navigate(`/sessions/${sessionId}/summary`);
  } catch (error) {
    console.error('Error ending interview:', error);
    // Show error message
  }
};
```

## Error Handling

The system implements robust error handling throughout the interview flow:

1. **Connection Failures**
   - Automatic reconnection with exponential backoff
   - Visual indicators for connection state
   - Graceful fallback for failed audio connections

2. **Transcript Persistence Failures**
   - Local caching of unsaved transcript entries
   - Retry mechanism for failed database writes
   - Session recovery on page reload/browser crash

3. **Session Management Errors**
   - Transaction-based database operations
   - Session status tracking with timestamps
   - Cleanup procedures for interrupted sessions

## Implementation Components

| Component | Purpose | Key Files |
|-----------|---------|-----------|
| `InterviewSetup` | Session creation UI | `src/components/interview/InterviewSetup.tsx` |
| `WebRTCManager` | WebRTC connection & state | `src/components/interview/WebRTCManager.tsx` |
| `TranscriptPanel` | Display & save transcripts | `src/components/interview/TranscriptPanel.tsx` |
| `InterviewRoom` | Main interview UI | `src/pages/InterviewRoom.tsx` |
| `useAudioCapture` | Microphone access | `src/hooks/useAudioCapture.ts` |
| `useTranscriptSubscription` | Real-time updates | `src/hooks/useTranscriptSubscription.ts` |
| `interview-start` | Edge function | `supabase/functions/interview-start/index.ts` |
| `transcript-processor` | Edge function | `supabase/functions/transcript-processor/index.ts` |

## Next Steps & Improvements

1. **Enhanced Recovery**
   - Implement better session recovery after disconnections
   - Add transcript checkpointing for longer interviews

2. **Performance Optimization**
   - Optimize audio packet size for latency reduction
   - Implement adaptive quality based on connection speed

3. **Advanced Features**
   - Add video recording capabilities
   - Implement interviewer persona selection
   - Support for multi-interviewer scenarios

## Related Documentation

- [Hybrid Architecture Specification](../architecture/consolidated-hybrid-architecture.md)
- [WebRTC SDP Proxy](../development/consolidated-webrtc-proxy.md)
- [Hybrid Technical Flow](../development/hybrid-technical-flow.md)

## Testing with Simulation Mode

For development testing, we use a simulation server that mocks the behavior of the WebRTC signaling and conversation flow:

```bash
# Run the simulation server
./start-simulation-server.sh

# In another terminal, start the development server
npm run dev
```

Then visit: http://localhost:8080/interview-test-simple

### Simulation Server Features

The simulation server provides a lightweight testing environment that:
- Simulates WebSocket signaling for WebRTC
- Generates mock SDP answers for connection testing
- Sends simulated transcript messages
- Simulates AI interviewer questions and responses
- Removes the need for actual microphone input during testing

### Connection Troubleshooting

If you encounter WebSocket connection issues:

1. Verify the simulation server is running on port 3000
2. Check that the WebSocket URL in InterviewTestSimple.tsx is set to `ws://localhost:3000`
3. Ensure there are no retry loops by checking the WebRTCManager retry settings
4. Look for error messages in the browser console to identify the exact failure point

The WebRTCManager component includes built-in retry limiting to prevent infinite reconnection loops, with a maximum of 10 retry attempts using exponential backoff.