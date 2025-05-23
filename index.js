require('dotenv').config();
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Initialize Express app
const app = express();
app.use(cors({
  origin: '*', // Allow connections from any origin for testing
  methods: ['GET', 'POST'],
  credentials: true
}));
app.use(express.json());
app.use(express.static('public'));

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocket.Server({ 
  server,
  // Add WebSocket CORS options
  verifyClient: (info, cb) => {
    // Allow all origins for testing
    cb(true);
  }
});

// Add WebSocket CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST',
  'Access-Control-Allow-Headers': 'Content-Type'
};

// Store active sessions
const sessions = new Map();

// Handle WebSocket connections
wss.on('connection', (ws, req) => {
  console.log('Client connected from:', req.socket.remoteAddress);
  
  // Create a session ID for this connection
  const sessionId = crypto.randomUUID();
  
  // Initialize session data
  sessions.set(sessionId, {
    transcript: '',
    sdpOffer: null,
    sdpAnswer: null,
    iceCandidates: []
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
      console.log('Received message type:', JSON.parse(messageStr).type);
      
      const data = JSON.parse(messageStr);
      const session = sessions.get(sessionId);
      
      switch (data.type) {
        case 'sdpOffer':
          console.log('Processing SDP offer from client');
          // Store the SDP offer
          session.sdpOffer = data.sdp;
          
          try {
            // Forward SDP offer to OpenAI and get answer
            const sdpAnswer = await proxySDPToOpenAI(session.sdpOffer);
            session.sdpAnswer = sdpAnswer;
            
            // Send SDP answer back to client
            ws.send(JSON.stringify({
              type: 'sdpAnswer',
              sdp: sdpAnswer,
              headers: corsHeaders
            }));
          } catch (error) {
            console.error('Error exchanging SDP:', error);
            ws.send(JSON.stringify({ 
              type: 'error', 
              message: 'Failed to exchange SDP: ' + error.message,
              headers: corsHeaders
            }));
          }
          break;
          
        case 'iceCandidate':
          console.log('Received ICE candidate from client');
          // Store ICE candidate
          session.iceCandidates.push(data.candidate);
          
          try {
            // Forward ICE candidate to OpenAI
            await proxyICECandidateToOpenAI(data.candidate, sessionId);
            
            // Acknowledge receipt
            ws.send(JSON.stringify({
              type: 'iceAcknowledge',
              headers: corsHeaders
            }));
          } catch (error) {
            console.error('Error proxying ICE candidate:', error);
            ws.send(JSON.stringify({ 
              type: 'error', 
              message: 'Failed to process ICE candidate: ' + error.message,
              headers: corsHeaders
            }));
          }
          break;
          
        case 'transcriptUpdate':
          // Update transcript from the client (sent directly from OpenAI)
          console.log('Received transcript update:', data.text);
          if (data.text) {
            session.transcript += ' ' + data.text;
            console.log('Updated transcript:', session.transcript);
            // Broadcast transcript update to any other connected clients for this session
            ws.send(JSON.stringify({ 
              type: 'transcriptUpdate', 
              transcript: session.transcript,
              headers: corsHeaders
            }));
          }
          break;
          
        case 'finish':
          // Send final transcript
          ws.send(JSON.stringify({ 
            type: 'finalTranscript', 
            transcript: session.transcript,
            headers: corsHeaders
          }));
          break;
      }
    } catch (error) {
      console.error('Error handling message:', error);
      ws.send(JSON.stringify({ type: 'error', message: error.message, headers: corsHeaders }));
    }
  });
  
  // Handle connection close
  ws.on('close', () => {
    console.log('Client disconnected');
    
    // Clean up session data
    if (sessions.has(sessionId)) {
      sessions.delete(sessionId);
    }
  });
});

// Proxy an SDP offer to OpenAI and get an SDP answer
async function proxySDPToOpenAI(offer) {
  try {
    console.log('Proxying SDP offer to OpenAI');
    
    // Get OpenAI API key from environment
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Step 1: Create a realtime session first to get a client secret
    const sessionResponse = await fetch("https://api.openai.com/v1/audio/realtime/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "OpenAI-Beta": "realtime"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        voice: "alloy"
      }),
    });
    
    if (!sessionResponse.ok) {
      const errorText = await sessionResponse.text();
      throw new Error(`OpenAI Session API error: ${sessionResponse.status} - ${errorText}`);
    }
    
    const sessionData = await sessionResponse.json();
    const sessionId = sessionData.id;
    const ephemeralKey = sessionData.client_secret?.value;
    
    if (!ephemeralKey) {
      throw new Error('Failed to get ephemeral key from OpenAI');
    }

    // Step 2: Now use the ephemeral key to establish WebRTC connection
    const rtcResponse = await fetch("https://api.openai.com/v1/audio/realtime/rtc", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${ephemeralKey}`,
        "Content-Type": "application/sdp"
      },
      body: offer.sdp || offer,
    });
    
    if (!rtcResponse.ok) {
      const errorText = await rtcResponse.text();
      throw new Error(`OpenAI WebRTC API error: ${rtcResponse.status} - ${errorText}`);
    }
    
    // The response will be the SDP answer
    const sdpAnswer = await rtcResponse.text();
    
    return {
      type: "answer",
      sdp: sdpAnswer
    };
    
  } catch (error) {
    console.error('Error proxying SDP to OpenAI:', error);
    throw error;
  }
}

// Proxy an ICE candidate to OpenAI
async function proxyICECandidateToOpenAI(candidate, sessionId) {
  try {
    console.log('Proxying ICE candidate to OpenAI for session:', sessionId);
    
    // Get OpenAI API key from environment
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }
    
    // Use the correct endpoint to send ICE candidates
    // Note: OpenAI's API doesn't actually have a dedicated ICE candidate endpoint 
    // They handle ICE candidates through the WebRTC connection, not via REST API
    // This function is a placeholder and should be adapted based on OpenAI's documentation
    
    return true;
    
  } catch (error) {
    console.error('Error proxying ICE candidate to OpenAI:', error);
    throw error;
  }
}

// HTTP routes

// Explicitly serve index.html from public folder for the root path
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Simple test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'Interview SDP Proxy API is working' });
});

// Create WebRTC session endpoint
app.post('/api/webrtc-session', async (req, res) => {
  try {
    // In a real implementation, this would create a session with OpenAI's WebRTC API
    const sessionId = crypto.randomUUID();
    res.json({ sessionId });
  } catch (error) {
    console.error('Error creating WebRTC session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Exchange SDP endpoint (for HTTP fallback)
app.post('/api/exchange-sdp', async (req, res) => {
  try {
    const { sdp } = req.body;
    if (!sdp) {
      return res.status(400).json({ error: 'SDP offer required' });
    }
    
    const answer = await proxySDPToOpenAI(sdp);
    res.json({ sdp: answer });
  } catch (error) {
    console.error('Error in SDP exchange:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 