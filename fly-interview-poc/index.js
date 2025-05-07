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
    
    // For now, this is a simulation as we don't yet have an actual OpenAI WebRTC API
    // In the real implementation, we would make a request to OpenAI's WebRTC API
    
    // Here's how it would look like when OpenAI provides a WebRTC API:
    /*
    const response = await fetch("https://api.openai.com/v1/audio/webrtc/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "whisper-1",
        sdp: clientSdp,
        // Additional parameters
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    return data.sdp;
    */
    
    // For now, return a simulated SDP answer
    // This is just a placeholder and won't actually work for WebRTC
    const simulatedAnswer = {
      type: 'answer',
      sdp: 'v=0\r\no=- 0 0 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=group:BUNDLE 0\r\na=msid-semantic: WMS\r\nm=application 9 UDP/TLS/RTP/SAVPF 0\r\nc=IN IP4 0.0.0.0\r\na=ice-ufrag:simulated\r\na=ice-pwd:simulated_password\r\na=fingerprint:sha-256 00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00\r\na=setup:active\r\na=mid:0\r\na=sctp-port:5000\r\na=max-message-size:262144\r\n'
    };
    
    console.log('Simulated SDP answer created');
    return simulatedAnswer;
  } catch (error) {
    console.error('Error in SDP exchange:', error);
    throw error;
  }
}

// Helper function to generate a compatible SDP answer
function generateCompatibleSdpAnswer(offerSdp) {
  console.log('Original Offer SDP:\n', offerSdp);
  
  // Parse the offer SDP to extract media sections
  const offerLines = offerSdp.split('\r\n');
  if (offerLines.length === 1) {
    // Try alternate line ending
    offerLines.splice(0, 1, ...offerSdp.split('\n'));
  }
  
  // Simplest approach - create a similar structure that maintains all m-lines exactly as they appear
  const sdpLines = [];
  const mLines = [];
  
  // Find all m-lines
  for (let i = 0; i < offerLines.length; i++) {
    if (offerLines[i].startsWith('m=')) {
      mLines.push(offerLines[i]);
    }
  }
  
  console.log('Found m-lines:', mLines);
  
  // Base session fields
  sdpLines.push('v=0');
  sdpLines.push('o=- ' + Date.now() + ' 2 IN IP4 127.0.0.1');
  sdpLines.push('s=-');
  sdpLines.push('t=0 0');
  
  // Try to copy session-level attributes from offer
  let i = 0;
  while (i < offerLines.length && !offerLines[i].startsWith('m=')) {
    const line = offerLines[i];
    if (line.startsWith('a=group:') || line.startsWith('a=msid-semantic:')) {
      sdpLines.push(line);
    }
    i++;
  }
  
  // Process each m-line exactly in the order from the original offer
  const parsedMLines = [];
  
  for (let j = 0; j < offerLines.length; j++) {
    const line = offerLines[j];
    if (line.startsWith('m=')) {
      const mediaSection = { mLine: line, attributes: [] };
      
      // Get all attributes until next m-line or end
      let k = j + 1;
      while (k < offerLines.length && !offerLines[k].startsWith('m=')) {
        if (offerLines[k].trim() !== '') {  // Skip empty lines
          mediaSection.attributes.push(offerLines[k]);
        }
        k++;
      }
      
      parsedMLines.push(mediaSection);
      j = k - 1;  // Adjust j to continue from the last processed line
    }
  }
  
  // Generate answer for each media section
  for (let j = 0; j < parsedMLines.length; j++) {
    const mediaSection = parsedMLines[j];
    
    // Add m-line exactly as in the offer
    sdpLines.push(mediaSection.mLine);
    
    // Add c= line if it doesn't exist in the original section
    if (!mediaSection.attributes.some(attr => attr.startsWith('c='))) {
      sdpLines.push('c=IN IP4 0.0.0.0');
    }
    
    // Copy any existing c=, b=, and i= lines
    for (const attr of mediaSection.attributes) {
      if (attr.startsWith('c=') || attr.startsWith('b=') || attr.startsWith('i=')) {
        sdpLines.push(attr);
      }
    }
    
    // Extract media type
    const mediaType = mediaSection.mLine.split(' ')[0].substring(2); // e.g., "m=audio" -> "audio"
    
    // Add a=mid attribute if it exists in original
    const midAttr = mediaSection.attributes.find(attr => attr.startsWith('a=mid:'));
    if (midAttr) {
      sdpLines.push(midAttr);
    } else {
      sdpLines.push(`a=mid:${j}`);
    }
    
    // Add direction attribute - use sendrecv as default
    const directionAttrs = ['a=sendrecv', 'a=sendonly', 'a=recvonly', 'a=inactive'];
    const existingDirection = mediaSection.attributes.find(attr => directionAttrs.includes(attr));
    sdpLines.push(existingDirection || 'a=sendrecv');
    
    // Add other required attributes based on media type
    if (mediaType === 'audio') {
      sdpLines.push('a=rtcp-mux');
      
      // Extract any codec details from the original
      const rtpmapLines = mediaSection.attributes.filter(attr => attr.startsWith('a=rtpmap:'));
      if (rtpmapLines.length > 0) {
        for (const rtpmap of rtpmapLines) {
          sdpLines.push(rtpmap);
          // Add fmtp if it exists
          const payloadType = rtpmap.split(':')[1].split(' ')[0];
          const fmtp = mediaSection.attributes.find(attr => attr.startsWith(`a=fmtp:${payloadType}`));
          if (fmtp) sdpLines.push(fmtp);
        }
      } else {
        // Add defaults if no rtpmap was found
        sdpLines.push('a=rtpmap:111 opus/48000/2');
        sdpLines.push('a=fmtp:111 minptime=10;useinbandfec=1');
      }
    } else if (mediaType === 'video') {
      sdpLines.push('a=rtcp-mux');
      
      // Extract any codec details from the original
      const rtpmapLines = mediaSection.attributes.filter(attr => attr.startsWith('a=rtpmap:'));
      if (rtpmapLines.length > 0) {
        for (const rtpmap of rtpmapLines) {
          sdpLines.push(rtpmap);
          // Add fmtp if it exists
          const payloadType = rtpmap.split(':')[1].split(' ')[0];
          const fmtp = mediaSection.attributes.find(attr => attr.startsWith(`a=fmtp:${payloadType}`));
          if (fmtp) sdpLines.push(fmtp);
        }
      } else {
        // Add defaults if no rtpmap was found
        sdpLines.push('a=rtpmap:96 VP8/90000');
        sdpLines.push('a=rtcp-fb:96 nack');
        sdpLines.push('a=rtcp-fb:96 nack pli');
      }
    } else if (mediaType === 'application') {
      const sctpmap = mediaSection.attributes.find(attr => attr.startsWith('a=sctpmap:'));
      if (sctpmap) {
        sdpLines.push(sctpmap);
      } else {
        sdpLines.push('a=sctp-port:5000');
      }
      sdpLines.push('a=max-message-size:262144');
    }
    
    // Add ICE credentials (unique per m-line)
    sdpLines.push('a=ice-ufrag:' + generateRandomString(8));
    sdpLines.push('a=ice-pwd:' + generateRandomString(24));
    
    // Add fingerprint
    sdpLines.push('a=fingerprint:sha-256 ' + generateFakeFingerprint());
    
    // Always use active role for establishing connection
    sdpLines.push('a=setup:active');
  }
  
  const finalSdp = sdpLines.join('\r\n') + '\r\n';
  console.log('Generated Answer SDP:\n', finalSdp);
  
  return finalSdp;
}

// HTTP routes

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