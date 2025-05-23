const WebSocket = require('ws');
const http = require('http');
const express = require('express');

const app = express();
app.use(express.static('public'));

// Add a health check endpoint
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head><title>WebSocket Test Server</title></head>
      <body>
        <h1>WebSocket Test Server</h1>
        <p>Server is running and ready to accept connections at: ws://localhost:3001</p>
        <p>Active connections: ${server ? server.clients.size : 0}</p>
        <p>Test this with: <a href="http://localhost:8080/interview-test-simple" target="_blank">Interview Test Page</a></p>
      </body>
    </html>
  `);
});

// Create HTTP server
const httpServer = http.createServer(app);

// Create WebSocket server with no path restriction
const server = new WebSocket.Server({
  server: httpServer,
  // No path restriction to accept connections to any path
  // No origin restriction to accept connections from any origin
});

console.log('Improved WebSocket test server running on port 3001');

server.on('connection', (ws) => {
  console.log('Client connected!');
  
  // Create a session ID and send initial session message
  const sessionId = 'test-' + Date.now();
  console.log(`Sending session message with ID: ${sessionId}`);
  ws.send(JSON.stringify({
    type: 'session',
    sessionId: sessionId
  }));

  ws.on('message', (msg) => {
    console.log('Received:', msg.toString());
    let data;

    try {
      data = JSON.parse(msg.toString());
    } catch (e) {
      console.error('Error parsing message:', e);
      return;
    }

    // Handle different message types
    if (data.type === 'init') {
      console.log('Got init message, sending session confirmation');
      ws.send(JSON.stringify({
        type: 'session',
        sessionId: data.sessionId || sessionId
      }));
    }
    else if (data.type === 'sdp_offer') {
      console.log('Got SDP offer, sending mock answer');
      ws.send(JSON.stringify({
        type: 'sdp_answer',
        answer: {
          type: 'answer',
          sdp: `v=0
o=- ${Date.now()} 1 IN IP4 127.0.0.1
s=-
t=0 0
a=group:BUNDLE 0
m=audio 9 UDP/TLS/RTP/SAVPF 111
c=IN IP4 0.0.0.0
a=rtcp:9 IN IP4 0.0.0.0
a=ice-ufrag:fake
a=ice-pwd:fakepwd
a=fingerprint:sha-256 00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF
a=setup:active
a=mid:0
a=sendrecv
a=rtcp-mux
a=rtpmap:111 opus/48000/2
a=fmtp:111 minptime=10;useinbandfec=1`
        }
      }));

      // Send a transcript after the SDP negotiation
      setTimeout(() => {
        console.log('Sending simulated transcript message');
        ws.send(JSON.stringify({
          type: 'transcript',
          text: 'Hello from the test server! This is a simulated transcript.'
        }));
      }, 2000);
    }
    else if (data.type === 'ping') {
      // Respond to ping with pong
      ws.send(JSON.stringify({
        type: 'pong',
        timestamp: Date.now()
      }));
    }
    else {
      console.log(`Unhandled message type: ${data.type}`);
    }
  });
});

// Log all WebSocket errors
server.on('error', (error) => {
  console.error('WebSocket server error:', error);
});

// Start HTTP server
httpServer.listen(3001, () => {
  console.log('WebSocket server is listening at ws://localhost:3001');
  console.log('HTTP server is running at http://localhost:3001');
  console.log('Test page URL: http://localhost:8080/interview-test-simple');
});