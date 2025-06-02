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
const pino = require('pino');
const pinoHttp = require('pino-http');
const promBundle = require('express-prom-bundle');

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

// Add Prometheus metrics
const metricsMiddleware = promBundle({
  includeMethod: true,
  includePath: true,
  promClient: {
    collectDefaultMetrics: {},
  },
});
app.use(metricsMiddleware);

// Handle WebSocket connections
wss.on('connection', (ws, req) => {
  console.log('Client connected from:', req.socket.remoteAddress);
  
  // Create a session ID for this connection
  const sessionId = uuidv4();
  
  // Initialize session data
  sessions.set(sessionId, {
    ws: ws,
    sessionId: sessionId,
    offers: [], // Store SDP offers
    answers: [], // Store SDP answers
    iceCandidates: [], // For debugging only - OpenAI handles ICE
    ephemeralKey: null, // OpenAI ephemeral key
    keyExpiry: null, // Key expiration timestamp
    model: null, // OpenAI model
    voice: null, // OpenAI voice
    connected: Date.now(),
    lastActivity: Date.now()
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
      
      // Update last activity timestamp
      session.lastActivity = Date.now();
      
      console.log(`Received message of type: ${data.type}`);
      
      switch (data.type) {
        case 'sdp_offer':
          // Client sent an SDP offer that should be proxied to OpenAI
          console.log('Received SDP offer from client');
          
          try {
            if (process.env.SIMULATION_MODE === 'true') {
              // Simulation mode - return a mock SDP answer
              console.log('Simulation mode: Generating mock SDP answer');
              
              // Store the offer
              session.offers.push(data.offer);
              
              // Create a simulated answer
              const mockAnswer = {
                type: 'answer',
                sdp: `v=0\r\no=- ${Date.now()} 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=group:BUNDLE 0\r\na=msid-semantic: WMS\r\nm=audio 9 UDP/TLS/RTP/SAVPF 111\r\nc=IN IP4 0.0.0.0\r\na=rtcp:9 IN IP4 0.0.0.0\r\na=ice-ufrag:mock\r\na=ice-pwd:mockmockmockmockmockmock\r\na=ice-options:trickle\r\na=fingerprint:sha-256 00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00\r\na=setup:active\r\na=mid:0\r\na=recvonly\r\na=rtcp-mux\r\na=rtpmap:111 opus/48000/2\r\na=fmtp:111 minptime=10;useinbandfec=1\r\n`
              };
              
              // Store the answer
              session.answers.push(mockAnswer);
              
              // Send mock answer back to client
              ws.send(JSON.stringify({ 
                type: 'sdp_answer', 
                answer: {
                  type: 'answer',
                  sdp: mockAnswer.sdp
                },
                headers: corsHeaders
              }));
              
            } else {
              // Real mode - Use HTTP-based SDP exchange with OpenAI
              console.log('Processing SDP offer for OpenAI WebRTC');
              
              // Check if we have a valid ephemeral key
              if (!session.ephemeralKey || session.keyExpiry < Date.now()) {
                throw new Error('Ephemeral key missing or expired. Call /api/generate-ephemeral-key first.');
              }
              
              // Store the offer
              session.offers.push(data.offer);
              
              // Extract just the SDP string
              const offerSdp = data.offer.sdp || data.offer;
              
              console.log('Forwarding SDP offer to OpenAI via HTTP');
              
              // Send SDP offer to OpenAI using HTTP POST
              const apiKey = process.env.OPENAI_API_KEY;
              if (!apiKey) {
                throw new Error('OpenAI API key not configured');
              }
              
              const response = await fetch(
                `https://api.openai.com/v1/realtime?model=${session.model || 'gpt-4o-realtime-preview-2024-12-17'}`,
                {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${session.ephemeralKey}`,
                    'Content-Type': 'application/sdp'
                  },
                  body: offerSdp // Send only the SDP string, not the full object
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
              
              // Store the answer
              session.answers.push({
                type: 'answer',
                sdp: answerSdp
              });
              
              // Send answer back to client
              ws.send(JSON.stringify({
                type: 'sdp_answer',
                answer: {
                  type: 'answer',
                  sdp: answerSdp
                },
                headers: corsHeaders
              }));
              
              console.log('SDP answer sent to client');
            }
          } catch (error) {
            console.error('Error processing SDP offer:', error);
            ws.send(JSON.stringify({ 
              type: 'error', 
              message: error.message,
              code: 'SDP_EXCHANGE_FAILED',
              headers: corsHeaders
            }));
          }
          break;
          
        case 'ice_candidate':
          // ICE candidates are handled automatically by OpenAI WebRTC
          console.log('Received ICE candidate - OpenAI handles ICE automatically');
          
          // Store for logging/debugging purposes only
          if (data.candidate) {
            session.iceCandidates.push(data.candidate);
          }
          
          // Acknowledge receipt but no forwarding needed
          ws.send(JSON.stringify({
            type: 'ice_status',
            message: 'ICE candidates are handled automatically by OpenAI',
            headers: corsHeaders
          }));
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

// Clean up expired sessions periodically
setInterval(() => {
  const now = Date.now();
  for (const [sessionId, session] of sessions) {
    // Remove sessions inactive for more than 5 minutes
    if (now - session.connected > 300000) {
      console.log('Cleaning up inactive session:', sessionId);
      sessions.delete(sessionId);
    }
    
    // Log ephemeral key expiry for debugging
    if (session.ephemeralKey && session.keyExpiry < now) {
      console.log(`Session ${sessionId} ephemeral key expired`);
    }
  }
}, 60000); // Run every minute

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

// Generate ephemeral key endpoint for OpenAI WebRTC
app.post('/api/generate-ephemeral-key', async (req, res) => {
  try {
    const { sessionId, voice = 'alloy', model = 'gpt-4o-realtime-preview-2024-12-17' } = req.body;
    
    console.log(`Generating ephemeral key for session ${sessionId}`);
    console.log(`Available sessions:`, Array.from(sessions.keys()));
    
    // Verify session exists
    const session = sessions.get(sessionId);
    if (!session) {
      console.error(`Session ${sessionId} not found. Available sessions:`, Array.from(sessions.keys()));
      return res.status(404).json({ error: `Session ${sessionId} not found` });
    }
    
    // Get OpenAI API key
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }
    
    // Call OpenAI to generate ephemeral key
    console.log('Calling OpenAI /v1/realtime/sessions endpoint');
    const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model, voice })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI ephemeral key generation failed:', errorText);
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log('Ephemeral key generated successfully');
    
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

// Get session info endpoint
app.get('/api/sessions/:sessionId', (req, res) => {
  const sessionId = req.params.sessionId;
  const session = sessions.get(sessionId);
  
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  
  // Return sanitized session info (no sensitive data)
  res.json({
    sessionId: session.sessionId,
    connected: session.connected,
    lastActivity: session.lastActivity,
    hasEphemeralKey: !!session.ephemeralKey,
    keyValid: session.keyExpiry > Date.now(),
    offerCount: session.offers.length,
    answerCount: session.answers.length,
    model: session.model,
    voice: session.voice
  });
});

// Start server
server.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port} and listening on all interfaces (0.0.0.0:${port})`);
  console.log(`Simulation mode: ${process.env.SIMULATION_MODE === 'true' ? 'ENABLED' : 'DISABLED'}`);
}).on('error', (err) => {
  console.error('Error starting server:', err);
}); 