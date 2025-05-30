# WebRTC Implementation Guide - Code Snippets

## Complete Fly.io Server Implementation

### 1. Updated index.js with Proper OpenAI WebRTC Integration

```javascript
// fly-interview-hybrid/index.js
require('dotenv').config();
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const fetch = require('node-fetch');
const cors = require('cors');
const helmet = require('helmet');
const { v4: uuidv4 } = require('uuid');

const app = express();
const port = process.env.PORT || 8080;

// Middleware setup
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  credentials: true
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.static('public'));

const server = http.createServer(app);
const wss = new WebSocket.Server({ 
  server,
  verifyClient: (info, cb) => {
    // TODO: Add JWT validation here
    cb(true);
  }
});

// Store active sessions with enhanced data
const sessions = new Map();

// Generate ephemeral key endpoint
app.post('/api/generate-ephemeral-key', async (req, res) => {
  try {
    const { sessionId, voice = 'alloy', model = 'gpt-4o-realtime-preview-2024-12-17' } = req.body;
    
    // Verify session exists
    const session = sessions.get(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    // Call OpenAI to generate ephemeral key
    const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model, voice })
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${error}`);
    }
    
    const data = await response.json();
    
    // Store ephemeral key with session
    session.ephemeralKey = data.client_secret;
    session.keyExpiry = Date.now() + 60000; // 60 seconds
    session.model = model;
    session.voice = voice;
    
    res.json({ 
      success: true,
      client_secret: data.client_secret,
      expires_in: 60
    });
  } catch (error) {
    console.error('Error generating ephemeral key:', error);
    res.status(500).json({ error: error.message });
  }
});

// WebSocket connection handler
wss.on('connection', (ws, req) => {
  console.log('Client connected from:', req.socket.remoteAddress);
  
  const sessionId = uuidv4();
  
  // Initialize session with enhanced data structure
  sessions.set(sessionId, {
    ws: ws,
    sessionId: sessionId,
    ephemeralKey: null,
    keyExpiry: null,
    model: null,
    voice: null,
    connected: Date.now(),
    lastActivity: Date.now()
  });
  
  // Send session info to client
  ws.send(JSON.stringify({ 
    type: 'session', 
    sessionId: sessionId,
    message: 'Connected to SDP proxy'
  }));
  
  // Handle incoming messages
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message.toString());
      const session = sessions.get(sessionId);
      
      if (!session) {
        throw new Error('Session not found');
      }
      
      // Update last activity
      session.lastActivity = Date.now();
      
      console.log(`Received message type: ${data.type}`);
      
      switch (data.type) {
        case 'sdp_offer':
          await handleSDPOffer(session, data, ws);
          break;
          
        case 'ice_candidate':
          // ICE candidates are not needed for OpenAI WebRTC
          // OpenAI handles its own ICE gathering
          console.log('ICE candidate received but not needed for OpenAI WebRTC');
          ws.send(JSON.stringify({
            type: 'ice_status',
            message: 'ICE candidates handled by OpenAI'
          }));
          break;
          
        case 'end_session':
          console.log('Ending session:', sessionId);
          sessions.delete(sessionId);
          ws.send(JSON.stringify({ 
            type: 'session_ended', 
            sessionId: sessionId
          }));
          ws.close();
          break;
          
        default:
          console.warn('Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('Error handling message:', error);
      ws.send(JSON.stringify({ 
        type: 'error', 
        message: error.message
      }));
    }
  });
  
  // Handle disconnection
  ws.on('close', () => {
    console.log('Client disconnected, session:', sessionId);
    
    // Clean up after delay
    setTimeout(() => {
      if (sessions.has(sessionId)) {
        sessions.delete(sessionId);
        console.log('Session cleaned up:', sessionId);
      }
    }, 60000); // 1 minute cleanup delay
  });
  
  // Handle errors
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// Handle SDP offer and exchange with OpenAI
async function handleSDPOffer(session, data, ws) {
  console.log('Processing SDP offer');
  
  try {
    // Check if we have a valid ephemeral key
    if (!session.ephemeralKey || session.keyExpiry < Date.now()) {
      throw new Error('Ephemeral key missing or expired. Generate a new key first.');
    }
    
    // Extract just the SDP string from the offer
    const offerSdp = data.offer.sdp || data.offer;
    
    console.log('Forwarding SDP offer to OpenAI');
    
    // Send SDP offer to OpenAI
    const response = await fetch(
      `https://api.openai.com/v1/realtime?model=${session.model || 'gpt-4o-realtime-preview-2024-12-17'}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.ephemeralKey.value}`,
          'Content-Type': 'application/sdp'
        },
        body: offerSdp // Send only the SDP string
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI SDP exchange error:', response.status, errorText);
      throw new Error(`OpenAI SDP exchange failed: ${response.status} - ${errorText}`);
    }
    
    // Get SDP answer as plain text
    const answerSdp = await response.text();
    
    console.log('Received SDP answer from OpenAI');
    
    // Send answer back to client
    ws.send(JSON.stringify({
      type: 'sdp_answer',
      answer: {
        type: 'answer',
        sdp: answerSdp
      }
    }));
    
    console.log('SDP answer sent to client');
    
  } catch (error) {
    console.error('Error in SDP exchange:', error);
    ws.send(JSON.stringify({
      type: 'error',
      message: error.message,
      code: 'SDP_EXCHANGE_FAILED'
    }));
  }
}

// Health check endpoints
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

app.get('/healthz', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    sessions: sessions.size,
    env: {
      node_env: process.env.NODE_ENV,
      port: port,
      has_openai_key: !!process.env.OPENAI_API_KEY
    }
  });
});

// Session info endpoint
app.get('/api/sessions/:sessionId', (req, res) => {
  const session = sessions.get(req.params.sessionId);
  
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  
  res.json({
    sessionId: session.sessionId,
    connected: session.connected,
    lastActivity: session.lastActivity,
    hasEphemeralKey: !!session.ephemeralKey,
    keyValid: session.keyExpiry > Date.now()
  });
});

// Clean up expired sessions periodically
setInterval(() => {
  const now = Date.now();
  for (const [sessionId, session] of sessions) {
    // Remove sessions inactive for more than 5 minutes
    if (now - session.lastActivity > 300000) {
      console.log('Cleaning up inactive session:', sessionId);
      if (session.ws.readyState === WebSocket.OPEN) {
        session.ws.close();
      }
      sessions.delete(sessionId);
    }
  }
}, 60000); // Run every minute

// Start server
server.listen(port, '0.0.0.0', () => {
  console.log(`SDP Proxy server running on port ${port}`);
  console.log(`OpenAI API Key configured: ${!!process.env.OPENAI_API_KEY}`);
}).on('error', (err) => {
  console.error('Error starting server:', err);
  process.exit(1);
});
```

## Frontend Hook Updates

### 2. Updated useSDPProxy.ts

```typescript
// src/hooks/webrtc/useSDPProxy.ts
import { useCallback, useRef, useState, useEffect } from 'react';
import { useWebSocketConnection } from './useWebSocketConnection';
import { useWebRTCConnection } from './useWebRTCConnection';

interface SDPProxyConfig {
  serverUrl: string;
  sessionId: string;
  authToken?: string;
  openAISettings?: {
    voice?: string;
    model?: string;
    instructions?: string;
  };
  disabled?: boolean;
}

export function useSDPProxy(sessionId: string, config: SDPProxyConfig) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [ephemeralKey, setEphemeralKey] = useState<string | null>(null);
  const isInitializingRef = useRef(false);
  
  // Generate ephemeral key from Fly.io proxy
  const generateEphemeralKey = useCallback(async () => {
    if (!config.serverUrl) {
      throw new Error('Server URL is required');
    }
    
    try {
      // Extract base URL from WebSocket URL
      const baseUrl = config.serverUrl
        .replace('wss://', 'https://')
        .replace('ws://', 'http://')
        .replace(/\/ws.*$/, ''); // Remove WebSocket path
      
      const response = await fetch(`${baseUrl}/api/generate-ephemeral-key`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(config.authToken && { 'Authorization': `Bearer ${config.authToken}` })
        },
        body: JSON.stringify({
          sessionId: sessionId,
          voice: config.openAISettings?.voice || 'alloy',
          model: config.openAISettings?.model || 'gpt-4o-realtime-preview-2024-12-17'
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate ephemeral key');
      }
      
      const data = await response.json();
      setEphemeralKey(data.client_secret.value);
      
      // Set timer to refresh key before expiration
      setTimeout(() => {
        setEphemeralKey(null); // Key expired
      }, 55000); // Refresh 5 seconds before expiration
      
      return data.client_secret;
    } catch (error) {
      console.error('Error generating ephemeral key:', error);
      throw error;
    }
  }, [config.serverUrl, config.authToken, sessionId, config.openAISettings]);
  
  // WebSocket connection for SDP exchange
  const {
    isConnected: wsConnected,
    sendMessage,
    disconnect: disconnectWebSocket
  } = useWebSocketConnection(config.serverUrl, {
    onMessage: handleWebSocketMessage,
    onConnect: handleWebSocketConnect,
    onDisconnect: handleWebSocketDisconnect,
    reconnect: true,
    reconnectDelay: 2000
  });
  
  // WebRTC connection with OpenAI
  const {
    peerConnection,
    dataChannel,
    localStream,
    connectionState,
    initialize: initializeWebRTC,
    cleanup: cleanupWebRTC,
    createOffer,
    setRemoteDescription
  } = useWebRTCConnection({
    audioConstraints: {
      echoCancellation: true,
      noiseSuppression: true,
      sampleRate: 48000
    }
  });
  
  // Handle WebSocket messages
  async function handleWebSocketMessage(event: MessageEvent) {
    try {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'session':
          console.log('Session established:', data.sessionId);
          // Generate ephemeral key after session is established
          if (!ephemeralKey) {
            await generateEphemeralKey();
          }
          break;
          
        case 'sdp_answer':
          console.log('Received SDP answer from proxy');
          await setRemoteDescription(data.answer);
          break;
          
        case 'error':
          console.error('Proxy error:', data.message);
          if (data.code === 'SDP_EXCHANGE_FAILED') {
            // Retry with new ephemeral key
            await generateEphemeralKey();
          }
          break;
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  }
  
  function handleWebSocketConnect() {
    console.log('Connected to SDP proxy');
  }
  
  function handleWebSocketDisconnect() {
    console.log('Disconnected from SDP proxy');
  }
  
  // Initialize connection
  const initialize = useCallback(async () => {
    if (config.disabled || isInitializingRef.current) {
      return;
    }
    
    try {
      isInitializingRef.current = true;
      
      // Wait for WebSocket connection
      if (!wsConnected) {
        console.log('Waiting for WebSocket connection...');
        return;
      }
      
      // Initialize WebRTC
      await initializeWebRTC();
      
      // Create data channel for OpenAI events
      const dc = peerConnection.createDataChannel('oai-events', {
        ordered: true
      });
      
      // Set up data channel handlers
      dc.onopen = () => {
        console.log('OpenAI data channel opened');
        
        // Send initial configuration
        dc.send(JSON.stringify({
          type: 'session.update',
          session: {
            instructions: config.openAISettings?.instructions || 
              'You are a helpful AI assistant conducting an interview.',
            voice: config.openAISettings?.voice || 'alloy',
            input_audio_transcription: {
              model: 'whisper-1'
            },
            turn_detection: {
              type: 'server_vad',
              threshold: 0.5,
              prefix_padding_ms: 300,
              silence_duration_ms: 800
            }
          }
        }));
      };
      
      dc.onmessage = (event) => {
        handleDataChannelMessage(event);
      };
      
      // Create and send offer
      const offer = await createOffer();
      
      // Send offer through WebSocket to proxy
      sendMessage({
        type: 'sdp_offer',
        offer: offer
      });
      
      setIsInitialized(true);
      
    } catch (error) {
      console.error('Error initializing SDP proxy connection:', error);
      throw error;
    } finally {
      isInitializingRef.current = false;
    }
  }, [
    config.disabled,
    wsConnected,
    initializeWebRTC,
    createOffer,
    sendMessage,
    peerConnection,
    config.openAISettings
  ]);
  
  // Handle data channel messages from OpenAI
  function handleDataChannelMessage(event: MessageEvent) {
    try {
      const data = JSON.parse(event.data);
      
      // Log all event types for debugging
      console.log('OpenAI event:', data.type);
      
      switch (data.type) {
        case 'response.audio_transcript.done':
          // Final transcript
          if (config.onTranscript) {
            config.onTranscript(data.transcript);
          }
          break;
          
        case 'response.audio_transcript.delta':
          // Incremental transcript
          if (config.onTranscriptDelta) {
            config.onTranscriptDelta(data.delta);
          }
          break;
          
        case 'response.done':
          // Response completed
          console.log('OpenAI response completed');
          break;
          
        case 'error':
          console.error('OpenAI error:', data.error);
          break;
      }
    } catch (error) {
      console.error('Error parsing data channel message:', error);
    }
  }
  
  // Cleanup
  const cleanup = useCallback(() => {
    if (!config.disabled && !isInitializingRef.current) {
      cleanupWebRTC();
      disconnectWebSocket();
      setIsInitialized(false);
      setEphemeralKey(null);
    }
  }, [config.disabled, cleanupWebRTC, disconnectWebSocket]);
  
  // Auto-initialize when WebSocket connects
  useEffect(() => {
    if (wsConnected && !isInitialized && !config.disabled) {
      initialize();
    }
  }, [wsConnected, isInitialized, config.disabled, initialize]);
  
  return {
    isConnected: wsConnected && connectionState === 'connected',
    isInitialized,
    connectionState,
    localStream,
    dataChannel,
    initialize,
    cleanup,
    sendMessage: (message: any) => {
      if (dataChannel?.readyState === 'open') {
        dataChannel.send(JSON.stringify(message));
      } else {
        console.warn('Data channel not open, cannot send message');
      }
    }
  };
}
```

## Testing Implementation

### 3. Test Page for Verification

```tsx
// src/pages/WebRTCTestPage.tsx
import React, { useState, useCallback } from 'react';
import { useSDPProxy } from '../hooks/webrtc/useSDPProxy';

export function WebRTCTestPage() {
  const [serverUrl, setServerUrl] = useState('wss://interview-hybrid-template.fly.dev/ws');
  const [transcript, setTranscript] = useState('');
  const [status, setStatus] = useState('Not connected');
  const [logs, setLogs] = useState<string[]>([]);
  
  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toISOString()}: ${message}`]);
  };
  
  const {
    isConnected,
    connectionState,
    initialize,
    cleanup,
    sendMessage
  } = useSDPProxy('test-session-' + Date.now(), {
    serverUrl,
    openAISettings: {
      voice: 'alloy',
      model: 'gpt-4o-realtime-preview-2024-12-17',
      instructions: 'You are a helpful AI assistant. Please introduce yourself.'
    },
    onTranscript: (text: string) => {
      setTranscript(prev => prev + '\\n' + text);
      addLog(`Transcript: ${text}`);
    },
    onTranscriptDelta: (delta: string) => {
      addLog(`Delta: ${delta}`);
    }
  });
  
  const handleConnect = async () => {
    try {
      addLog('Initializing connection...');
      await initialize();
      addLog('Connection initialized');
    } catch (error) {
      addLog(`Error: ${error.message}`);
    }
  };
  
  const handleDisconnect = () => {
    cleanup();
    addLog('Disconnected');
  };
  
  const handleSendMessage = () => {
    sendMessage({
      type: 'response.create',
      response: {
        modalities: ['text', 'audio']
      }
    });
    addLog('Sent response.create message');
  };
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">WebRTC Test Page</h1>
      
      <div className="mb-4">
        <label className="block mb-2">Server URL:</label>
        <input
          type="text"
          value={serverUrl}
          onChange={(e) => setServerUrl(e.target.value)}
          className="w-full p-2 border rounded"
          disabled={isConnected}
        />
      </div>
      
      <div className="mb-4">
        <p>Status: {connectionState}</p>
        <p>Connected: {isConnected ? 'Yes' : 'No'}</p>
      </div>
      
      <div className="mb-4 space-x-2">
        <button
          onClick={handleConnect}
          disabled={isConnected}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          Connect
        </button>
        
        <button
          onClick={handleDisconnect}
          disabled={!isConnected}
          className="px-4 py-2 bg-red-500 text-white rounded disabled:opacity-50"
        >
          Disconnect
        </button>
        
        <button
          onClick={handleSendMessage}
          disabled={!isConnected}
          className="px-4 py-2 bg-green-500 text-white rounded disabled:opacity-50"
        >
          Send Test Message
        </button>
      </div>
      
      <div className="mb-4">
        <h2 className="text-xl font-bold mb-2">Transcript</h2>
        <pre className="p-4 bg-gray-100 rounded h-48 overflow-y-auto">
          {transcript || 'No transcript yet...'}
        </pre>
      </div>
      
      <div>
        <h2 className="text-xl font-bold mb-2">Logs</h2>
        <div className="p-4 bg-gray-100 rounded h-48 overflow-y-auto text-xs">
          {logs.map((log, i) => (
            <div key={i} className="mb-1">{log}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

## Deployment Commands

### 4. Deploy to Fly.io

```bash
# From fly-interview-hybrid directory
cd fly-interview-hybrid

# Create .env file if not exists
echo "OPENAI_API_KEY=your-key-here" > .env

# Deploy to Fly.io
fly deploy --app interview-hybrid-template

# Watch logs
fly logs --app interview-hybrid-template

# Scale if needed
fly scale count 2 --app interview-hybrid-template
```

### 5. Environment Variables for Fly.io

```bash
# Set OpenAI API key as secret
fly secrets set OPENAI_API_KEY="your-openai-api-key" --app interview-hybrid-template

# Verify secrets are set
fly secrets list --app interview-hybrid-template
```

## Debugging Tips

1. **Check Fly.io logs**: `fly logs --app interview-hybrid-template`
2. **Monitor browser console** for WebRTC state changes
3. **Use chrome://webrtc-internals** to debug WebRTC connections
4. **Verify ephemeral key generation** in network tab
5. **Check data channel state** in console logs

## Common Issues and Solutions

### Issue: "Ephemeral key missing or expired"
**Solution**: Ensure generateEphemeralKey is called before SDP exchange

### Issue: "SDP exchange failed"
**Solution**: Check OpenAI API key is valid and has realtime API access

### Issue: "WebSocket disconnects immediately"
**Solution**: Check CORS settings and WebSocket URL format

### Issue: "No audio/transcript"
**Solution**: Verify data channel is named 'oai-events' and check message format

---
**Created**: ${new Date().toISOString()}