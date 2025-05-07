# Production Integration Guide

This document outlines the steps to integrate the lessons learned from this proof-of-concept into the main Interview AI application.

## Architecture Overview

The PoC demonstrates a real-time WebSocket-based approach to interview transcription. To integrate this into the main application, we need to:

1. Add WebSocket server capabilities to the main application
2. Create client-side components for audio capture and transcription display
3. Implement proper authentication and authorization
4. Add database integration for transcript persistence
5. Deploy the integrated solution to Fly.io

## Integration Steps

### 1. WebSocket Server Implementation

#### Add Dependencies to Main Project
```bash
npm install ws express-ws
```

#### Update Server Code
Create a new file at `src/server/websocket.js` to handle WebSocket connections:

```javascript
const WebSocket = require('ws');
const { createOpenAIToken } = require('./openai');

module.exports = function setupWebSocketServer(server) {
  const wss = new WebSocket.Server({ server });
  
  // Session storage
  const sessions = new Map();
  
  wss.on('connection', (ws, req) => {
    // Extract user ID from authenticated session
    const userId = req.session?.user?.id;
    if (!userId) {
      ws.close(1008, 'Authentication required');
      return;
    }
    
    // Create session
    const sessionId = Date.now().toString();
    sessions.set(sessionId, {
      userId,
      transcript: '',
      createdAt: new Date()
    });
    
    // Send session info
    ws.send(JSON.stringify({ type: 'session', sessionId }));
    
    // Handle messages
    ws.on('message', async (message) => {
      // Implementation similar to PoC, but with authentication and database storage
      // ...
    });
    
    // Handle disconnection
    ws.on('close', () => {
      // Clean up resources
      // Save final transcript to database
    });
  });
};
```

#### Integrate with Main Server
In your main server file:

```javascript
const setupWebSocketServer = require('./websocket');

// After creating your HTTP server
setupWebSocketServer(server);
```

### 2. Client-Side Integration

#### Create React Component for Interview Recording
Create a file at `src/components/interview/InterviewRecorder.jsx`:

```jsx
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

export default function InterviewRecorder({ interviewId }) {
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const socketRef = useRef(null);
  const { token } = useAuth();
  
  // Connect to WebSocket
  const connect = () => {
    // Implementation similar to PoC, but with authentication
    // ...
  };
  
  // Start recording
  const startRecording = async () => {
    // Implementation similar to PoC
    // ...
  };
  
  // Stop recording
  const stopRecording = () => {
    // Implementation similar to PoC
    // ...
  };
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);
  
  return (
    <div className="interview-recorder">
      {/* UI similar to PoC, styled according to main app */}
      {/* ... */}
    </div>
  );
}
```

#### Add to Interview Page
Add the recorder component to the relevant interview page:

```jsx
import InterviewRecorder from '../components/interview/InterviewRecorder';

export default function InterviewPage({ interviewId }) {
  return (
    <div className="interview-page">
      <h1>Interview Session</h1>
      <InterviewRecorder interviewId={interviewId} />
      {/* Other interview components */}
    </div>
  );
}
```

### 3. Database Integration

#### Create Database Schema
Add the following to your migration files:

```sql
CREATE TABLE interview_transcripts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  interview_id UUID NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
  transcript TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT fk_interview FOREIGN KEY (interview_id) REFERENCES interviews(id)
);

CREATE INDEX idx_interview_transcripts_interview_id ON interview_transcripts(interview_id);
```

#### Create Database Access Functions
In your database access layer:

```javascript
async function saveTranscript(interviewId, transcript) {
  const { data, error } = await supabase
    .from('interview_transcripts')
    .insert([{ interview_id: interviewId, transcript }]);
    
  if (error) throw error;
  return data;
}

async function getTranscript(interviewId) {
  const { data, error } = await supabase
    .from('interview_transcripts')
    .select('*')
    .eq('interview_id', interviewId)
    .order('created_at', { ascending: false })
    .limit(1);
    
  if (error) throw error;
  return data[0];
}
```

### 4. Authentication and Authorization

#### WebSocket Authentication
Use a token-based approach to authenticate WebSocket connections:

```javascript
// In your WebSocket server setup
const wss = new WebSocket.Server({ 
  server,
  verifyClient: async (info, callback) => {
    try {
      // Extract authentication token from headers or query params
      const token = new URL(info.req.url, 'http://localhost').searchParams.get('token');
      
      if (!token) {
        return callback(false, 401, 'Unauthorized');
      }
      
      // Verify token with your auth system
      const user = await verifyAuthToken(token);
      if (!user) {
        return callback(false, 401, 'Unauthorized');
      }
      
      // Attach user to request for later use
      info.req.user = user;
      callback(true);
    } catch (error) {
      console.error('WebSocket authentication error:', error);
      callback(false, 500, 'Internal Server Error');
    }
  }
});
```

#### Client-Side Authentication
When connecting to the WebSocket server, include the authentication token:

```javascript
const token = getAuthToken(); // From your auth context
const socket = new WebSocket(`wss://your-app.fly.dev?token=${token}`);
```

### 5. Error Handling and Recovery

#### Server-Side Error Handling

```javascript
ws.on('message', async (message) => {
  try {
    // Process message
  } catch (error) {
    console.error('Error processing message:', error);
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Failed to process message',
      code: error.code || 'UNKNOWN_ERROR'
    }));
  }
});
```

#### Client-Side Error Handling and Recovery

```javascript
socket.addEventListener('error', (event) => {
  console.error('WebSocket error:', event);
  setErrorState('Connection error. Attempting to reconnect...');
  
  // Attempt to reconnect after delay
  setTimeout(() => {
    connectWebSocket();
  }, 3000);
});

socket.addEventListener('close', (event) => {
  console.log('WebSocket closed:', event.code, event.reason);
  
  if (event.code !== 1000) {
    // Abnormal closure, attempt to reconnect
    setErrorState('Connection closed. Attempting to reconnect...');
    setTimeout(() => {
      connectWebSocket();
    }, 3000);
  }
});
```

### 6. Deployment Configuration

Update your `fly.toml` to include the WebSocket endpoint:

```toml
[http_service]
  internal_port = 3000
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 1
  processes = ["app"]

[[services.ports]]
  port = 80
  handlers = ["http"]
  force_https = true

[[services.ports]]
  port = 443
  handlers = ["tls", "http"]
```

## Testing Checklist

Before fully integrating with production, test:

1. Authentication flow with WebSockets
2. Transcript persistence in the database
3. Error handling and recovery
4. Performance under load
5. Multiple concurrent sessions
6. Integration with existing interview flow

## Performance Considerations

1. **WebSocket Connection Pooling**: Consider implementing connection pooling to handle many simultaneous connections.

2. **Database Writes**: Batch transcript updates to reduce database load.

3. **Memory Management**: Monitor memory usage and implement limits on session data.

4. **Regional Deployment**: Deploy to regions close to your users to reduce latency.

5. **Rate Limiting**: Implement rate limiting to prevent abuse.

## Security Considerations

1. **Authentication**: Ensure all WebSocket connections are properly authenticated.

2. **Data Validation**: Validate all incoming messages.

3. **Encryption**: Ensure WebSocket connections use WSS (WebSocket Secure).

4. **Session Management**: Implement proper session timeouts and cleanup.

5. **API Key Protection**: Secure your OpenAI API keys using environment variables.

## Monitoring and Logging

1. **Connection Metrics**: Track number of active connections, connection duration, etc.

2. **Error Tracking**: Log and alert on connection errors and message processing failures.

3. **Performance Metrics**: Monitor CPU, memory, and network usage.

4. **Business Metrics**: Track number of interviews, average transcript length, etc.

## Conclusion

The proof-of-concept has validated the technical approach for real-time interview transcription using WebSockets and Fly.io. Following this integration guide will help incorporate these lessons into the main application while adding necessary production features like authentication, database persistence, and robust error handling. 