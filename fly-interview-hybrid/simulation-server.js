const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

// Create Express app and HTTP server
const app = express();
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// Store active sessions
const sessions = new Map();

// Interview questions and responses for simulation
const simulatedResponses = [
  "Tell me about your experience with React and TypeScript.",
  "How do you approach testing in your projects?",
  "Can you explain your understanding of WebRTC technology?",
  "What challenges have you faced with real-time communication?",
  "How do you handle state management in complex applications?",
  "Tell me about a difficult problem you solved recently.",
  "How do you stay updated with the latest technologies?",
  "What's your approach to code reviews?",
  "How do you handle performance optimization?",
  "What interests you about this position?"
];

// Generate a fake SDP answer
function generateMockSdpAnswer(offer) {
  // This is a very simplified mock SDP answer
  // In a real implementation, this would be properly formatted
  return {
    type: 'answer',
    sdp: `v=0
o=- ${Date.now()} 1 IN IP4 127.0.0.1
s=-
t=0 0
a=group:BUNDLE 0
a=msid-semantic: WMS
m=audio 9 UDP/TLS/RTP/SAVPF 111
c=IN IP4 0.0.0.0
a=rtcp:9 IN IP4 0.0.0.0
a=ice-ufrag:${Math.random().toString(36).substring(2, 8)}
a=ice-pwd:${Math.random().toString(36).substring(2, 15)}
a=ice-options:trickle
a=fingerprint:sha-256 ${Array(32).fill(0).map(() => Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join(':')}
a=setup:active
a=mid:0
a=sendrecv
a=rtcp-mux
a=rtpmap:111 opus/48000/2
a=fmtp:111 minptime=10;useinbandfec=1
a=ssrc:${Math.floor(Math.random() * 4294967295)} cname:simulation`
  };
}

// Handle WebSocket connections
wss.on('connection', (ws) => {
  // Generate session ID
  const sessionId = uuidv4();
  
  // Initialize session
  sessions.set(sessionId, {
    ws,
    connected: true,
    simulationMode: true,
    responseIndex: 0,
    responseInterval: null,
    lastActivity: Date.now()
  });
  
  console.log(`New connection established: ${sessionId}`);
  
  // Send session ID to client
  ws.send(JSON.stringify({
    type: 'session',
    sessionId
  }));
  
  // Handle messages from client
  ws.on('message', (message) => {
    try {
      const session = sessions.get(sessionId);
      if (!session) {
        console.error(`Session not found: ${sessionId}`);
        return;
      }
      
      session.lastActivity = Date.now();
      const data = JSON.parse(message.toString());
      
      switch (data.type) {
        case 'init':
          console.log(`Session initialized: ${sessionId}, simulation: ${data.simulationMode}`);
          // Nothing to do here, just log
          break;
          
        case 'sdp_offer':
          console.log(`SDP offer received: ${sessionId}`);
          // Generate mock answer
          const answer = generateMockSdpAnswer(data.offer);
          
          // Send mock answer
          ws.send(JSON.stringify({
            type: 'sdp_answer',
            answer
          }));
          
          // Start sending simulated transcript after a delay
          setTimeout(() => {
            startSimulatedTranscript(sessionId);
          }, 2000);
          break;
          
        case 'ice_candidate':
          console.log(`ICE candidate received: ${sessionId}`);
          // Acknowledge ICE candidate
          ws.send(JSON.stringify({
            type: 'ice_acknowledge'
          }));
          
          // Send a fake ICE candidate back
          ws.send(JSON.stringify({
            type: 'ice_candidate',
            candidate: {
              candidate: 'candidate:1 1 UDP 2122252543 192.168.1.100 49152 typ host',
              sdpMid: '0',
              sdpMLineIndex: 0
            }
          }));
          break;
          
        case 'ping':
          // Respond with pong to keep connection alive
          ws.send(JSON.stringify({ type: 'pong' }));
          break;
          
        default:
          console.log(`Unknown message type: ${data.type}`);
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });
  
  // Handle WebSocket close
  ws.on('close', () => {
    // Clean up resources
    const session = sessions.get(sessionId);
    if (session && session.responseInterval) {
      clearInterval(session.responseInterval);
    }
    
    sessions.delete(sessionId);
    console.log(`Connection closed: ${sessionId}`);
  });
  
  // Handle WebSocket errors
  ws.on('error', (error) => {
    console.error(`WebSocket error for session ${sessionId}:`, error);
    sessions.delete(sessionId);
  });
});

// Start sending simulated transcript
function startSimulatedTranscript(sessionId) {
  const session = sessions.get(sessionId);
  if (!session || !session.connected) return;
  
  // Send initial message
  sendTranscriptMessage(sessionId, "Hello! I'm the AI interviewer. Let's begin the interview.");
  
  // Set up interval to send simulated questions
  session.responseInterval = setInterval(() => {
    if (!sessions.has(sessionId)) {
      clearInterval(session.responseInterval);
      return;
    }
    
    // Send next question
    const question = simulatedResponses[session.responseIndex];
    sendTranscriptMessage(sessionId, question);
    
    // Increment index or reset if at end
    session.responseIndex = (session.responseIndex + 1) % simulatedResponses.length;
    
    // Randomly end after going through all questions once
    if (session.responseIndex === 0 && Math.random() < 0.3) {
      sendTranscriptMessage(sessionId, "Thank you for your time. That concludes our interview.");
      clearInterval(session.responseInterval);
    }
  }, 10000); // Send a new question every 10 seconds
}

// Send a transcript message
function sendTranscriptMessage(sessionId, text) {
  const session = sessions.get(sessionId);
  if (!session || !session.connected) return;
  
  try {
    session.ws.send(JSON.stringify({
      type: 'transcript',
      text
    }));
  } catch (error) {
    console.error(`Error sending transcript message to ${sessionId}:`, error);
  }
}

// Clean up inactive sessions
setInterval(() => {
  const now = Date.now();
  for (const [sessionId, session] of sessions.entries()) {
    // If inactive for more than 5 minutes
    if (now - session.lastActivity > 5 * 60 * 1000) {
      console.log(`Cleaning up inactive session: ${sessionId}`);
      if (session.responseInterval) {
        clearInterval(session.responseInterval);
      }
      
      try {
        session.ws.close();
      } catch (error) {
        console.error(`Error closing WebSocket for session ${sessionId}:`, error);
      }
      
      sessions.delete(sessionId);
    }
  }
}, 60000); // Check every minute

// Serve static files
app.use(express.static('public'));

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Simulation server running on port ${PORT}`);
});