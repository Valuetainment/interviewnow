// Combined HTTP and WebSocket server
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const fs = require('fs');

// Create Express app
const app = express();

// Create HTTP server using Express app
const server = http.createServer(app);

// Create WebSocket server using the HTTP server
const wss = new WebSocket.Server({ server });

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Create public directory if it doesn't exist
const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir);
}

// Create a simple WebSocket test page
fs.writeFileSync(path.join(publicDir, 'websocket-test.html'), `
<!DOCTYPE html>
<html>
<head>
  <title>WebSocket Test</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    #log { border: 1px solid #ccc; padding: 10px; height: 300px; overflow-y: auto; font-family: monospace; background: #f5f5f5; }
    button { padding: 8px 16px; margin: 5px; }
    .success { color: green; }
    .error { color: red; }
    .info { color: blue; }
  </style>
</head>
<body>
  <h1>WebSocket Connection Test</h1>
  <div>
    <button id="connect">Connect</button>
    <button id="disconnect" disabled>Disconnect</button>
    <button id="send-ping" disabled>Send Ping</button>
    <button id="send-init" disabled>Send Init</button>
  </div>
  <h3>Log:</h3>
  <div id="log"></div>

  <script>
    let socket = null;
    const log = document.getElementById('log');
    
    function addLog(message, type) {
      const line = document.createElement('div');
      line.className = type || 'info';
      line.textContent = \`\${new Date().toLocaleTimeString()}: \${message}\`;
      log.appendChild(line);
      log.scrollTop = log.scrollHeight;
    }
    
    document.getElementById('connect').addEventListener('click', () => {
      try {
        const wsUrl = 'ws://' + window.location.host;
        addLog('Connecting to ' + wsUrl);
        
        socket = new WebSocket(wsUrl);
        
        socket.onopen = () => {
          addLog('Connected!', 'success');
          document.getElementById('connect').disabled = true;
          document.getElementById('disconnect').disabled = false;
          document.getElementById('send-ping').disabled = false;
          document.getElementById('send-init').disabled = false;
        };
        
        socket.onmessage = (event) => {
          addLog('Received: ' + event.data, 'success');
        };
        
        socket.onerror = (error) => {
          addLog('Error: ' + JSON.stringify(error), 'error');
        };
        
        socket.onclose = () => {
          addLog('Connection closed');
          document.getElementById('connect').disabled = false;
          document.getElementById('disconnect').disabled = true;
          document.getElementById('send-ping').disabled = true;
          document.getElementById('send-init').disabled = true;
          socket = null;
        };
      } catch (error) {
        addLog('Error: ' + error.message, 'error');
      }
    });
    
    document.getElementById('disconnect').addEventListener('click', () => {
      if (socket) {
        socket.close();
      }
    });
    
    document.getElementById('send-ping').addEventListener('click', () => {
      if (socket) {
        const message = JSON.stringify({ type: 'ping' });
        socket.send(message);
        addLog('Sent: ' + message);
      }
    });
    
    document.getElementById('send-init').addEventListener('click', () => {
      if (socket) {
        const message = JSON.stringify({ 
          type: 'init', 
          sessionId: 'test-' + Date.now(),
          simulationMode: true
        });
        socket.send(message);
        addLog('Sent: ' + message);
      }
    });
  </script>
</body>
</html>
`);

// Root handler for HTTP
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>WebSocket Test Server</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          h1 { color: #333; }
          .status { background: #eafaea; border-left: 5px solid #4caf50; padding: 10px; }
          pre { background: #f5f5f5; padding: 10px; border-radius: 5px; }
        </style>
      </head>
      <body>
        <h1>WebSocket Test Server</h1>
        <div class="status">
          <h2>Server Status: Running</h2>
          <p>Server is running on port 3001</p>
          <p>Active WebSocket connections: ${wss.clients.size}</p>
        </div>
        <h2>Test Options</h2>
        <ul>
          <li><a href="/websocket-test.html">Test WebSocket connection</a></li>
          <li><a href="http://localhost:8080/interview-test-simple">Test Interview App</a></li>
        </ul>
      </body>
    </html>
  `);
});

// Handle WebSocket connections
wss.on('connection', (ws) => {
  console.log('Client connected!');
  
  // Send session ID right away
  const sessionId = 'test-' + Date.now();
  ws.send(JSON.stringify({
    type: 'session',
    sessionId: sessionId
  }));
  console.log(`Sent session ID: ${sessionId}`);
  
  // Handle incoming messages
  ws.on('message', (message) => {
    try {
      console.log(`Received: ${message}`);
      const data = JSON.parse(message.toString());
      
      // Handle different message types
      if (data.type === 'init') {
        ws.send(JSON.stringify({
          type: 'session',
          sessionId: data.sessionId || sessionId
        }));
        console.log('Responded to init message');
      } 
      else if (data.type === 'ping') {
        ws.send(JSON.stringify({
          type: 'pong',
          timestamp: Date.now()
        }));
        console.log('Responded to ping');
      }
      else if (data.type === 'sdp_offer') {
        // Skip SDP negotiation and just send transcript
        ws.send(JSON.stringify({
          type: 'transcript',
          text: 'Hello from the test server! WebSocket connection is working.'
        }));
        console.log('Sent transcript message');
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });
  
  // Handle disconnection
  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

// Handle WebSocket server errors
wss.on('error', (error) => {
  console.error('WebSocket server error:', error);
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`=== Combined HTTP/WebSocket Server ===`);
  console.log(`Server running on port ${PORT}`);
  console.log(`HTTP URL: http://localhost:${PORT}`);
  console.log(`WebSocket URL: ws://localhost:${PORT}`);
  console.log(`Test page: http://localhost:${PORT}/websocket-test.html`);
});