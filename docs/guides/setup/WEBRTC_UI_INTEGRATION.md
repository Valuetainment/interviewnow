# WebRTC UI Integration Tasks

This document outlines the tasks needed to integrate the hybrid WebRTC implementation into the main application UI.

## Current Status

The project has a working WebRTC implementation in the `fly-interview-hybrid` directory, but it's not fully integrated into the main application UI. The existing UI components (`WebRTCManager.tsx` and `TranscriptPanel.tsx`) need to be updated to support the hybrid architecture.

## Integration Tasks

### 1. Add Test Route for Immediate Testing

- [ ] Add the `InterviewTestSimple` route to `App.tsx`:
```tsx
// Add this import
import InterviewTestSimple from "./pages/InterviewTestSimple";

// Add this route (outside the DashboardLayout)
<Route path="/interview-test-simple" element={<InterviewTestSimple />} />
```

- [ ] Ensure CSS for the test page is properly loaded:
```tsx
// Update InterviewTestSimple.tsx to use proper styling approach
// Replace styled-jsx with your project's styling approach (Tailwind, CSS modules, etc.)
```

### 2. Fix Environment Variables in WebRTCManager

- [ ] Update environment variable references in `WebRTCManager.tsx`:
```tsx
// Replace
process.env.NEXT_PUBLIC_SUPABASE_URL
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// With
import.meta.env.VITE_SUPABASE_URL
import.meta.env.VITE_SUPABASE_ANON_KEY
```

- [ ] Do the same for `TranscriptPanel.tsx`

### 3. Update WebRTCManager for Hybrid Architecture

- [ ] Add support for direct OpenAI WebRTC connection:
```tsx
// Add OpenAI session parameters to the initializeWebRTC function
const openAiSessionParams = {
  instructions: "You are an interviewer for a software engineering position...",
  voice: "alloy",
  input_audio_transcription: { model: "whisper-1" },
  turn_detection: {
    type: "server_vad",
    threshold: 0.5,
    silence_duration_ms: 800,
    create_response: true
  }
};

// Handle OpenAI WebRTC specific messages
case 'dataChannel':
  // Handle DataChannel message
  if (data.dataChannel) {
    handleDataChannelMessage(data.dataChannel);
  }
  break;
```

- [ ] Update SDP handling to support the OpenAI SDP format
- [ ] Add proper connection to the Fly.io SDP proxy in production mode

### 4. Update TranscriptPanel for Hybrid Architecture

- [ ] Update transcript handling to support the OpenAI transcript format:
```tsx
// Handle OpenAI transcript format
case 'conversation.item.input_audio_transcription.completed':
  // Candidate speech transcript
  onTranscriptUpdate({
    type: 'candidate',
    text: message.transcript
  });
  break;
  
case 'response.audio_transcript.delta':
  // AI speech transcript
  if (message.text && message.text.trim()) {
    onTranscriptUpdate({
      type: 'ai',
      text: message.text
    });
  }
  break;
```

- [ ] Update the transcript display to differentiate between AI and candidate speech

### 5. Integrate with Main Interview Flow

- [ ] Update `InterviewRoom.tsx` to use the enhanced WebRTCManager:
```tsx
// Import and use the updated WebRTCManager
import { WebRTCManager } from '../components/interview/WebRTCManager';

// In the component
<WebRTCManager
  sessionId={sessionId}
  onTranscriptUpdate={handleTranscriptUpdate}
  onConnectionStateChange={handleConnectionStateChange}
  // For testing, can enable simulation mode
  simulationMode={false}
/>
```

- [ ] Update the session creation flow to initialize the WebRTC connection properly

### 6. Create Session Initialization Edge Function

- [ ] Update or create the `interview-start` edge function to support the hybrid architecture:
```typescript
// supabase/functions/interview-start/index.ts
const handleRequest = async (req: Request) => {
  const { interview_session_id, tenant_id } = await req.json();
  
  // Generate a secure session token
  const sessionToken = crypto.randomUUID();
  
  // Get the SDP proxy URL for the tenant
  const sdpProxyUrl = await getSdpProxyUrl(tenant_id);
  
  // Return the configuration
  return {
    success: true,
    webrtc_session_id: sessionToken,
    webrtc_server_url: sdpProxyUrl,
    // Include any other necessary configuration
  };
};
```

### 7. Update Interview Session Database Schema

- [ ] Update the database schema to support the hybrid architecture:
```sql
-- Add fields for hybrid WebRTC architecture
ALTER TABLE interview_sessions
ADD COLUMN IF NOT EXISTS webrtc_proxy_url TEXT,
ADD COLUMN IF NOT EXISTS openai_session_id TEXT,
ADD COLUMN IF NOT EXISTS interview_configuration JSONB DEFAULT '{}'::jsonb;
```

### 8. Test End-to-End Flow

- [ ] Test with simulation mode
- [ ] Test with actual OpenAI connection
- [ ] Test with the full interview flow

## UI Components to Update

1. `src/components/interview/WebRTCManager.tsx`
2. `src/components/interview/TranscriptPanel.tsx`
3. `src/pages/InterviewRoom.tsx`
4. `src/pages/InterviewTestSimple.tsx`

## Implementation Timeline

1. **Day 1**: Add test route and fix environment variables
2. **Day 2**: Update WebRTCManager for hybrid architecture
3. **Day 3**: Update TranscriptPanel and test with simulation mode
4. **Day 4**: Update interview-start edge function and database schema
5. **Day 5**: Integrate with main interview flow and test end-to-end