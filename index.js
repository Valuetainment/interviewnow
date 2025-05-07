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
            const sdpAnswer = await exchangeSDP(session.sdpOffer);
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
          // In a production implementation, we would need to handle
          // exchanging ICE candidates with OpenAI
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

// Exchange SDP with OpenAI
async function exchangeSDP(clientSdp) {
  try {
    console.log('Exchanging SDP with OpenAI WebRTC API');
    
    // For now, we need to use our simulation approach since there isn't a public
    // OpenAI WebRTC API endpoint available yet
    
    // Get the client SDP as a string
    const clientSdpStr = typeof clientSdp === 'string' ? clientSdp : clientSdp.sdp;
    
    // Create an answer by directly modifying the offer
    // This ensures the m-lines stay in exactly the same order
    const answerSdp = createAnswerFromOffer(clientSdpStr);
    
    const simulatedAnswer = {
      type: 'answer',
      sdp: answerSdp
    };
    
    // Test the OpenAI API connection with a simple request to verify the key works
    try {
      const response = await fetch("https://api.openai.com/v1/models", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        }
      });
      
      if (response.ok) {
        const models = await response.json();
        console.log('OpenAI API connection successful', models.data.length ? 'models available' : 'no models found');
      } else {
        console.error('OpenAI API connection failed:', await response.text());
      }
    } catch (apiError) {
      console.error('Error testing OpenAI API:', apiError);
    }
    
    console.log('Generated SDP answer');
    return simulatedAnswer;
  } catch (error) {
    console.error('Error in SDP exchange:', error);
    throw error;
  }
}

// Create an SDP answer directly from the offer by changing only what's necessary
function createAnswerFromOffer(offerSdp) {
  // Split the SDP into lines
  const lines = offerSdp.split('\r\n');
  if (lines.length === 1) {
    // Try alternate line ending
    lines.splice(0, 1, ...offerSdp.split('\n'));
  }
  
  const answer = [];
  
  // Keep track of whether we're in a media section
  let inMediaSection = false;
  let currentMediaType = null;
  
  // Process line by line
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Start with the line as is
    let newLine = line;
    
    // Detect media sections
    if (line.startsWith('m=')) {
      inMediaSection = true;
      currentMediaType = line.split(' ')[0].substring(2); // e.g., "audio", "video", "application"
      // Keep the m= line exactly as is
    }
    
    // For session-level or media-level attributes, modify as needed
    if (line.startsWith('a=')) {
      // Change offer to answer
      if (line === 'a=type:offer') {
        newLine = 'a=type:answer';
      }
      
      // Reverse the setup role
      else if (line.startsWith('a=setup:')) {
        if (line === 'a=setup:actpass') {
          newLine = 'a=setup:active';
        }
      }
      
      // Change sendrecv to recvonly for audio/video
      else if (inMediaSection && (currentMediaType === 'audio' || currentMediaType === 'video')) {
        if (line === 'a=sendrecv') {
          newLine = 'a=recvonly';
        } else if (line === 'a=sendonly') {
          newLine = 'a=recvonly';
        }
      }
      
      // Use our own ICE credentials
      else if (line.startsWith('a=ice-ufrag:')) {
        newLine = 'a=ice-ufrag:' + generateRandomString(8);
      }
      else if (line.startsWith('a=ice-pwd:')) {
        newLine = 'a=ice-pwd:' + generateRandomString(24);
      }
      
      // Replace fingerprint with our fake one (in a real implementation, this would be actual cert)
      else if (line.startsWith('a=fingerprint:')) {
        const parts = line.split(' ');
        if (parts.length >= 2) {
          newLine = parts[0] + ' ' + generateFakeFingerprint();
        }
      }
    }
    
    // Add the line to the answer
    answer.push(newLine);
  }
  
  return answer.join('\r\n') + '\r\n';
}

// Helper function to generate random string of specified length
function generateRandomString(length) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

// Helper function to generate a fake fingerprint
function generateFakeFingerprint() {
  let fingerprint = '';
  for (let i = 0; i < 32; i++) {
    fingerprint += (Math.floor(Math.random() * 256)).toString(16).padStart(2, '0');
    if (i < 31) fingerprint += ':';
  }
  return fingerprint;
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
    
    const answer = await exchangeSDP(sdp);
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