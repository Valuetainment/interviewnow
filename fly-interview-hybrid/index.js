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

// Parse JSON bodies first
app.use(express.json({ limit: '1mb' }));

// Middleware to log all HTTP requests
app.use((req, res, next) => {
  console.log(`[HTTP] ${req.method} ${req.url} from ${req.ip}`);
  console.log(`[HTTP] Headers:`, JSON.stringify(req.headers, null, 2));
  if (req.body && Object.keys(req.body).length > 0) {
    console.log(`[HTTP] Body:`, JSON.stringify(req.body, null, 2));
  }
  next();
});

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
        case 'sdp_offer':
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
                type: 'sdp_answer', 
                answer: mockAnswer.sdp,
                headers: corsHeaders
              }));
              
            } else {
              // Real mode - OpenAI WebRTC requires direct connection
              console.log('Received SDP offer - OpenAI WebRTC requires direct browser-to-OpenAI connection');
              
              // Store the offer
              session.offers.push(data.offer);
              
              // For hybrid architecture, we need to establish WebSocket to OpenAI
              // and forward the SDP through that connection
              if (!session.openaiWs) {
                console.log('Establishing WebSocket connection to OpenAI...');
                
                const apiKey = process.env.OPENAI_API_KEY;
                if (!apiKey) {
                  throw new Error('OpenAI API key not configured');
                }
                
                // Connect to OpenAI's WebRTC endpoint
                const openaiWs = new WebSocket('wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2025-06-03', {
                  headers: {
                    'Authorization': 'Bearer ' + apiKey,
                    'OpenAI-Beta': 'realtime=v1'
                  }
                });
                
                session.openaiWs = openaiWs;
                
                openaiWs.on('open', () => {
                  console.log('Connected to OpenAI WebSocket');
                  
                  // Send the SDP offer to OpenAI
                  openaiWs.send(JSON.stringify({
                    type: 'response.create',
                    response: {
                      modalities: ['audio'],
                      instructions: 'You are a helpful AI assistant.'
                    }
                  }));
                });
                
                openaiWs.on('message', (message) => {
                  const data = JSON.parse(message.toString());
                  console.log('Received from OpenAI:', data.type);
                  
                  // Forward messages from OpenAI to client
                  ws.send(JSON.stringify(data));
                });
                
                openaiWs.on('error', (error) => {
                  console.error('OpenAI WebSocket error:', error);
                  ws.send(JSON.stringify({ 
                    type: 'error', 
                    message: 'OpenAI connection error: ' + error.message,
                    headers: corsHeaders
                  }));
                });
                
                openaiWs.on('close', () => {
                  console.log('OpenAI WebSocket closed');
                  session.openaiWs = null;
                });
              }
              
              // For now, return a placeholder
              // The actual SDP answer will come through the WebSocket
              console.log('WebRTC hybrid mode - SDP exchange happens directly between browser and OpenAI');
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
          
        case 'ice_candidate':
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
          
        case 'transcript':
          // Forward transcript data from client's WebRTC data channel
          console.log('Received transcript data from client');
          
          // You can store this in a database, forward to another service, etc.
          // For now, just acknowledge receipt
          ws.send(JSON.stringify({
            type: 'transcript_acknowledged',
            timestamp: Date.now(),
            headers: corsHeaders
          }));
          
          // Store transcript in session if needed
          if (session.transcripts) {
            session.transcripts.push({
              timestamp: Date.now(),
              speaker: data.speaker || 'unknown',
              text: data.text,
              metadata: data.metadata
            });
          } else {
            session.transcripts = [{
              timestamp: Date.now(),
              speaker: data.speaker || 'unknown', 
              text: data.text,
              metadata: data.metadata
            }];
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
        
        case 'ping':
          // Handle ping messages to keep connection alive
          ws.send(JSON.stringify({ 
            type: 'pong',
            headers: corsHeaders 
          }));
          break;
          
        case 'audio':
          // Forward audio data to OpenAI
          console.log('Received audio data');
          
          if (!session.openaiWs) {
            console.log('Establishing connection to OpenAI Realtime...');
            
            const apiKey = process.env.OPENAI_API_KEY;
            if (!apiKey) {
              throw new Error('OpenAI API key not configured');
            }
            
            // Connect to OpenAI's Realtime endpoint
            const openaiWs = new WebSocket('wss://sessions.openai.com/v1/realtime', {
              headers: {
                'Authorization': 'Bearer ' + apiKey,
                'OpenAI-Beta': 'realtime=v1'
              }
            });
            
            session.openaiWs = openaiWs;
            
            openaiWs.on('open', () => {
              console.log('Connected to OpenAI Realtime API');
              
              // Configure the session
              openaiWs.send(JSON.stringify({
                type: 'session.update',
                session: {
                  modalities: ['text', 'audio'],
                  instructions: 'You are a helpful AI assistant conducting an interview. Be professional and engaging.',
                  voice: 'verse',
                  input_audio_format: 'webm-opus',
                  output_audio_format: 'webm-opus',
                  input_audio_transcription: {
                    model: 'whisper-1'
                  },
                  turn_detection: {
                    type: 'server_vad',
                    threshold: 0.5,
                    prefix_padding_ms: 300,
                    silence_duration_ms: 500
                  }
                }
              }));
            });
            
            openaiWs.on('message', (message) => {
              const data = JSON.parse(message.toString());
              console.log('Received from OpenAI:', data.type);
              
              // Forward all messages from OpenAI to client
              ws.send(JSON.stringify(data));
            });
            
            openaiWs.on('error', (error) => {
              console.error('OpenAI WebSocket error:', error);
              ws.send(JSON.stringify({ 
                type: 'error', 
                message: 'OpenAI connection error: ' + error.message,
                headers: corsHeaders
              }));
            });
            
            openaiWs.on('close', () => {
              console.log('OpenAI WebSocket closed');
              session.openaiWs = null;
            });
          }
          
          // Forward audio to OpenAI if connected
          if (session.openaiWs && session.openaiWs.readyState === WebSocket.OPEN) {
            session.openaiWs.send(JSON.stringify({
              type: 'input_audio_buffer.append',
              audio: data.audio // Should be base64 encoded audio
            }));
          } else {
            console.log('OpenAI WebSocket not ready, buffering audio...');
          }
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
    console.log('Proxying SDP offer to OpenAI - NOT IMPLEMENTED');
    
    // OpenAI's WebRTC doesn't work via HTTP API calls
    // It requires WebSocket connection to wss://api.openai.com/v1/realtime
    // For now, return a mock answer to prevent crashes
    
    console.warn('OpenAI WebRTC proxy not implemented - returning mock SDP answer');
    
    // Return a mock SDP answer
    const mockAnswer = `v=0\r\no=- ${Date.now()} 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=group:BUNDLE 0\r\na=msid-semantic: WMS\r\nm=audio 9 UDP/TLS/RTP/SAVPF 111\r\nc=IN IP4 0.0.0.0\r\na=rtcp:9 IN IP4 0.0.0.0\r\na=ice-ufrag:mock\r\na=ice-pwd:mockmockmockmockmockmock\r\na=ice-options:trickle\r\na=fingerprint:sha-256 00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00\r\na=setup:active\r\na=mid:0\r\na=recvonly\r\na=rtcp-mux\r\na=rtpmap:111 opus/48000/2\r\na=fmtp:111 minptime=10;useinbandfec=1\r\n`;
    
    return mockAnswer;
    
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

// Ephemeral token endpoint for OpenAI Realtime API
app.post('/api/realtime/sessions', async (req, res) => {
  try {
    console.log('Creating ephemeral token for realtime session');
    
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ 
        error: 'OpenAI API key not configured',
        headers: corsHeaders 
      });
    }

    // Get configuration from request body
    const { model = 'gpt-4o-realtime-preview', voice = 'verse' } = req.body;
    
    // Call OpenAI REST API to create ephemeral token
    const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        voice: voice,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error creating ephemeral token:', errorText);
      return res.status(response.status).json({ 
        error: `OpenAI API error: ${errorText}`,
        headers: corsHeaders 
      });
    }

    const data = await response.json();
    
    // Log success (but not the token itself for security)
    console.log('Ephemeral token created successfully');
    
    // Return the ephemeral token and session config
    res.json({
      ...data,
      headers: corsHeaders
    });
    
  } catch (error) {
    console.error('Error in ephemeral token endpoint:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to create ephemeral token',
      headers: corsHeaders 
    });
  }
});

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