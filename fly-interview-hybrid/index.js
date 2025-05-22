require('dotenv').config();
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const fetch = require('node-fetch');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

// Initialize Express app
const app = express();

// Get the port from environment or use 8080 as default to match Fly.io config
const port = process.env.PORT || 8080;

// Log environment for debugging
console.log('Environment variables:');
console.log(`PORT: ${process.env.PORT}`);
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`SIMULATION_MODE: ${process.env.SIMULATION_MODE}`);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disabled for development, enable in production
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration
app.use(cors({
  origin: '*', // Allow connections from any origin for testing
  methods: ['GET', 'POST'],
  credentials: true
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.static('public'));

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocket.Server({ 
  server,
  // Add WebSocket CORS options
  verifyClient: (info, cb) => {
    // Allow all origins for testing
    // TODO: Add proper validation in production
    cb(true);
  }
});

// CORS headers for responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

// Store active sessions
const sessions = new Map();

// Handle WebSocket connections
wss.on('connection', (ws, req) => {
  console.log('Client connected from:', req.socket.remoteAddress);
  
  // Create a session ID for this connection
  const sessionId = uuidv4();
  
  // Initialize session data
  sessions.set(sessionId, {
    ws: ws,
    offers: [], // Store SDP offers
    answers: [], // Store SDP answers
    iceCandidates: [],
    openaiSessionId: null,
    openaiClientId: null,
    connected: Date.now()
  });
  
  // Send session ID to client
  ws.send(JSON.stringify({ 
    type: 'session', 
    sessionId,
    headers: corsHeaders 
  }));
  
  // Handle incoming messages
  ws.on('message', async (message) => {
    try {
      // Parse message
      const messageStr = message.toString();
      const data = JSON.parse(messageStr);
      const session = sessions.get(sessionId);
      
      if (!session) {
        throw new Error('Session not found');
      }
      
      console.log(`Received message of type: ${data.type}`);
      
      switch (data.type) {
        case 'sdpOffer':
          // Client sent an SDP offer that should be proxied to OpenAI
          console.log('Received SDP offer');
          
          try {
            if (process.env.SIMULATION_MODE === 'true') {
              // Simulation mode - return a mock SDP answer
              console.log('Simulation mode: Generating mock SDP answer');
              
              // Store the offer
              session.offers.push(data.offer);
              
              // Create a simulated answer (in real implementation, this would come from OpenAI)
              const mockAnswer = {
                type: 'answer',
                sdp: `v=0\r\no=- ${Date.now()} 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=group:BUNDLE 0\r\na=msid-semantic: WMS\r\nm=audio 9 UDP/TLS/RTP/SAVPF 111\r\nc=IN IP4 0.0.0.0\r\na=rtcp:9 IN IP4 0.0.0.0\r\na=ice-ufrag:mock\r\na=ice-pwd:mockmockmockmockmockmock\r\na=ice-options:trickle\r\na=fingerprint:sha-256 00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00\r\na=setup:active\r\na=mid:0\r\na=recvonly\r\na=rtcp-mux\r\na=rtpmap:111 opus/48000/2\r\na=fmtp:111 minptime=10;useinbandfec=1\r\n`
              };
              
              // Store the answer
              session.answers.push(mockAnswer);
              
              // Send mock answer back to client
              ws.send(JSON.stringify({ 
                type: 'sdpAnswer', 
                answer: mockAnswer.sdp,
                headers: corsHeaders
              }));
              
            } else {
              // Real mode - proxy the offer to OpenAI
              console.log('Proxying SDP offer to OpenAI');
              
              // Store the offer
              session.offers.push(data.offer);
              
              // Call OpenAI WebRTC API to get SDP answer
              const answer = await proxySDPToOpenAI(data.offer);
              
              // Store the answer
              session.answers.push(answer);
              
              // Send the answer back to client
              ws.send(JSON.stringify({ 
                type: 'sdpAnswer', 
                answer: answer,
                headers: corsHeaders
              }));
            }
          } catch (error) {
            console.error('Error processing SDP offer:', error);
            ws.send(JSON.stringify({ 
              type: 'error', 
              message: 'Failed to process SDP offer: ' + error.message,
              headers: corsHeaders
            }));
          }
          break;
          
        case 'iceCandidate':
          // Client sent an ICE candidate that should be proxied to OpenAI
          console.log('Received ICE candidate');
          
          try {
            if (process.env.SIMULATION_MODE === 'true') {
              // In simulation mode, just acknowledge receipt
              ws.send(JSON.stringify({
                type: 'iceAcknowledge',
                headers: corsHeaders
              }));
            } else {
              // Store ICE candidate
              session.iceCandidates.push(data.candidate);
              
              // Proxy the ICE candidate to OpenAI
              await proxyICECandidateToOpenAI(data.candidate, sessionId);
              
              ws.send(JSON.stringify({
                type: 'iceAcknowledge',
                headers: corsHeaders
              }));
            }
          } catch (error) {
            console.error('Error processing ICE candidate:', error);
            ws.send(JSON.stringify({ 
              type: 'error', 
              message: 'Failed to process ICE candidate: ' + error.message,
              headers: corsHeaders
            }));
          }
          break;
          
        case 'apiKeyStatus':
          // Client is requesting a proxy for the OpenAI API key
          console.log('Processing API key status request');
          
          try {
            // For now, just confirm that the API key exists
            const apiKey = process.env.OPENAI_API_KEY;
            if (!apiKey) {
              throw new Error('OpenAI API key not configured');
            }
            
            ws.send(JSON.stringify({ 
              type: 'api_key_status', 
              status: 'available',
              headers: corsHeaders
            }));
          } catch (error) {
            console.error('Error processing API key request:', error);
            ws.send(JSON.stringify({ 
              type: 'error', 
              message: 'Failed to process API key request: ' + error.message,
              headers: corsHeaders
            }));
          }
          break;
          
        case 'end_session':
          // Client wants to end the session
          console.log('Ending session:', sessionId);
          
          // Clean up session data
          if (sessions.has(sessionId)) {
            // Store any final data if needed
            sessions.delete(sessionId);
          }
          
          ws.send(JSON.stringify({ 
            type: 'session_ended', 
            sessionId,
            headers: corsHeaders
          }));
          break;
      }
    } catch (error) {
      console.error('Error handling message:', error);
      ws.send(JSON.stringify({ 
        type: 'error', 
        message: error.message,
        headers: corsHeaders
      }));
    }
  });
  
  // Handle connection close
  ws.on('close', () => {
    console.log('Client disconnected, session:', sessionId);
    
    // Clean up session data (or keep for debugging/recovery)
    if (sessions.has(sessionId)) {
      // For now, we'll keep the session data for a while for debugging purposes
      // In production, you might want to delete it immediately or archive it
      setTimeout(() => {
        if (sessions.has(sessionId)) {
          sessions.delete(sessionId);
          console.log('Session data cleaned up:', sessionId);
        }
      }, 60000); // Clean up after 1 minute
    }
  });
});

// Proxy an SDP offer to OpenAI and get an SDP answer
async function proxySDPToOpenAI(offer) {
  try {
    console.log('Proxying SDP offer to OpenAI');
    
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }
    
    // Step 1: Create a Realtime session with OpenAI
    const sessionResponse = await fetch('https://api.openai.com/v1/audio/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'realtime'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        voice: 'alloy'
      })
    });
    
    if (!sessionResponse.ok) {
      const errorText = await sessionResponse.text();
      console.error('Error creating OpenAI session:', errorText);
      throw new Error(`OpenAI API error (session creation): ${sessionResponse.status} - ${errorText}`);
    }
    
    const sessionData = await sessionResponse.json();
    console.log('OpenAI session created:', sessionData.session_id);
    
    // Step 2: Exchange SDP with the WebRTC endpoint
    const webrtcResponse = await fetch(`https://api.openai.com/v1/audio/realtime/session/${sessionData.session_id}/client/${sessionData.client_id}/webrtc`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'realtime'
      },
      body: JSON.stringify({
        sdp: offer
      })
    });
    
    if (!webrtcResponse.ok) {
      const errorText = await webrtcResponse.text();
      console.error('Error exchanging SDP with OpenAI:', errorText);
      throw new Error(`OpenAI API error (SDP exchange): ${webrtcResponse.status} - ${errorText}`);
    }
    
    const webrtcData = await webrtcResponse.json();
    console.log('SDP exchange successful');
    
    // Store session info for ICE candidates
    const sessionId = offer.sdp ? offer.sdp.match(/o=.* ([0-9]+) [0-9]+ IN IP[4|6] .*/)?.[1] : null;
    if (sessionId && sessions.has(sessionId)) {
      const session = sessions.get(sessionId);
      session.openaiSessionId = sessionData.session_id;
      session.openaiClientId = sessionData.client_id;
    }
    
    return webrtcData.sdp;
    
  } catch (error) {
    console.error('Error proxying SDP to OpenAI:', error);
    throw error;
  }
}

// Proxy an ICE candidate to OpenAI
async function proxyICECandidateToOpenAI(candidate, sessionId) {
  try {
    console.log('Proxying ICE candidate to OpenAI for session:', sessionId);
    
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }
    
    // We need the OpenAI session and client IDs to send ICE candidates
    const session = sessions.get(sessionId);
    if (!session || !session.openaiSessionId || !session.openaiClientId) {
      throw new Error('Cannot send ICE candidate: OpenAI session not established');
    }
    
    const response = await fetch(`https://api.openai.com/v1/audio/realtime/session/${session.openaiSessionId}/client/${session.openaiClientId}/webrtc/ice`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'realtime'
      },
      body: JSON.stringify({
        candidate: candidate
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error sending ICE candidate to OpenAI:', errorText);
      throw new Error(`OpenAI API error (ICE candidate): ${response.status} - ${errorText}`);
    }
    
    return true;
    
  } catch (error) {
    console.error('Error proxying ICE candidate to OpenAI:', error);
    throw error;
  }
}

// HTTP routes

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// More detailed health check for debugging
app.get('/healthz', (req, res) => {
  const healthInfo = {
    status: 'ok',
    uptime: process.uptime(),
    timestamp: Date.now(),
    env: {
      node_env: process.env.NODE_ENV,
      port: process.env.PORT,
      simulation_mode: process.env.SIMULATION_MODE
    }
  };
  res.status(200).json(healthInfo);
});

// Root path to verify server is accessible
app.get('/', (req, res) => {
  res.send('WebRTC SDP Proxy Server is running');
});

// Get API key status endpoint (does not expose the actual key)
app.get('/api/key-status', (req, res) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'OpenAI API key not configured' });
  }
  res.json({ status: 'available' });
});

// Get session info endpoint
app.get('/api/sessions/:sessionId', (req, res) => {
  const sessionId = req.params.sessionId;
  const session = sessions.get(sessionId);
  
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  
  // Return sanitized session info (no sensitive data)
  res.json({
    sessionId,
    connected: session.connected,
    offerCount: session.offers.length,
    answerCount: session.answers.length
  });
});

// Start server
server.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port} and listening on all interfaces (0.0.0.0:${port})`);
  console.log(`Simulation mode: ${process.env.SIMULATION_MODE === 'true' ? 'ENABLED' : 'DISABLED'}`);
}).on('error', (err) => {
  console.error('Error starting server:', err);
}); 