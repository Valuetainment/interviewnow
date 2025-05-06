require('dotenv').config();
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const cors = require('cors');
const fs = require('fs');
const path = require('path');

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

// Store active transcription sessions
const sessions = new Map();

// Handle WebSocket connections
wss.on('connection', (ws, req) => {
  console.log('Client connected from:', req.socket.remoteAddress);
  
  // Create a session ID for this connection
  const sessionId = Date.now().toString();
  
  // Initialize session data
  sessions.set(sessionId, {
    transcript: ''
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
      console.log('Received message:', messageStr);
      
      const data = JSON.parse(messageStr);
      const session = sessions.get(sessionId);
      
      switch (data.type) {
        case 'getRealtimeToken':
          console.log('Processing getRealtimeToken request');
          // Get a token for OpenAI Realtime API
          try {
            const token = await createRealtimeToken();
            console.log('Token created successfully:', token);
            ws.send(JSON.stringify({ 
              type: 'realtimeToken', 
              token,
              headers: corsHeaders
            }));
          } catch (error) {
            console.error('Error creating realtime token:', error);
            ws.send(JSON.stringify({ 
              type: 'error', 
              message: 'Failed to create realtime token: ' + error.message,
              headers: corsHeaders
            }));
          }
          break;
          
        case 'transcriptUpdate':
          // Update transcript from the client
          console.log('Received transcript update:', data.text);
          if (data.text) {
            session.transcript += ' ' + data.text;
            console.log('Updated transcript:', session.transcript);
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

// Create a realtime token for OpenAI
async function createRealtimeToken() {
  try {
    console.log('Creating OpenAI Realtime token...');
    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "tts-1",
        input: "Test",
        voice: "alloy",
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }
    
    console.log('Successfully created OpenAI token');
    
    // For testing purposes, we're not actually using the tokens since we're going with a simpler approach
    return { success: true };
  } catch (error) {
    console.error('Error creating token:', error);
    throw error;
  }
}

// HTTP routes

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Simple test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'Interview POC API is working' });
});

// Get OpenAI session token endpoint
app.get('/api/realtime-token', async (req, res) => {
  try {
    const token = await createRealtimeToken();
    res.json(token);
  } catch (error) {
    console.error('Error getting token:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start server
const PORT = process.env.PORT || 0; // Use 0 to automatically find an available port
server.listen(PORT, () => {
  console.log(`Server running on port ${server.address().port}`);
}); 