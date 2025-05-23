// Enhanced WebSocket server for ngrok testing with improved error handling and JWT validation
const WebSocket = require('ws');
const http = require('http');
const url = require('url');
const crypto = require('crypto');

// Simulated JWT secret (in production this would be in environment variables)
const JWT_SECRET = process.env.JWT_SECRET || 'simulation-test-secret';

// Track active sessions with their recovery state
const activeSessions = new Map();

// Connection recovery configuration
const RECOVERY_TIMEOUT = 60000; // 1 minute
const MAX_RECONNECT_ATTEMPTS = 3;

// Create HTTP server with enhanced CORS headers and security
const server = http.createServer((req, res) => {
  // Set comprehensive CORS and security headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type,Authorization');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Content-Security-Policy', "default-src 'self'");

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Get the host from request and use it directly
  const host = req.headers.host || 'localhost:3001';
  // No hardcoded URL - use the actual request host
  const ngrokUrl = host;

  // Render status page with enhanced diagnostics
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`
    <html>
      <head>
        <title>WebRTC SDP Proxy - Hybrid Architecture</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
          .container { max-width: 800px; margin: 0 auto; }
          .code { background: #f4f4f4; padding: 10px; border-radius: 4px; font-family: monospace; overflow-wrap: break-word; }
          .status { padding: 10px; border-radius: 4px; margin: 20px 0; }
          .success { background: #d4edda; color: #155724; }
          .info { background: #cce5ff; color: #004085; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background-color: #f4f4f4; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>WebRTC SDP Proxy - Hybrid Architecture</h1>
          <div class="status success">Server is running!</div>

          <div class="grid">
            <div>
              <h2>Connection Options:</h2>
              <h3>Local Connection:</h3>
              <div class="code">ws://${host}</div>

              <h3>Ngrok Connection:</h3>
              <div class="code">wss://${ngrokUrl}</div>
            </div>

            <div>
              <h3>Server Info:</h3>
              <table>
                <tr><th>Server Time</th><td>${new Date().toISOString()}</td></tr>
                <tr><th>Protocol</th><td>${req.headers['x-forwarded-proto'] || 'http'}</td></tr>
                <tr><th>Host</th><td>${host}</td></tr>
                <tr><th>Active Sessions</th><td>${activeSessions.size}</td></tr>
                <tr><th>Security</th><td>JWT Validation Enabled</td></tr>
                <tr><th>Recovery</th><td>Session Recovery Enabled (${RECOVERY_TIMEOUT/1000}s timeout)</td></tr>
              </table>
            </div>
          </div>

          <div class="status info">
            <h3>Hybrid Architecture:</h3>
            <p>This server implements the hybrid WebRTC architecture where:</p>
            <ul>
              <li>SDP signaling is securely handled through this proxy</li>
              <li>Direct WebRTC connections are established between client and OpenAI</li>
              <li>Enhanced error handling and session recovery is enabled</li>
              <li>JWT validation for secure tenant isolation</li>
            </ul>
          </div>

          <div class="status info" style="background: #d1ecf1; color: #0c5460; margin-top: 15px;">
            <h3>React-Specific Optimizations:</h3>
            <p>This server includes special handling for React components:</p>
            <ul>
              <li><strong>Code 1001 handling:</strong> Special recovery for React navigation events</li>
              <li><strong>Delayed messaging:</strong> Prevents race conditions during component mounting</li>
              <li><strong>Rapid reconnect detection:</strong> Identifies and handles React re-renders</li>
              <li><strong>Enhanced heartbeat:</strong> More frequent at first, then reduced to minimize traffic</li>
              <li><strong>Connection stabilization:</strong> Added ready notifications to help React components</li>
            </ul>
            <p><strong>Usage:</strong> Add <code>?react=true</code> to your WebSocket URL to enable React-specific optimizations</p>
          </div>

          <h3>Testing:</h3>
          <p>Use the WebRTC test page at: <a href="http://localhost:8080/simple-webrtc-test" target="_blank">http://localhost:8080/simple-webrtc-test</a></p>
          <p>For React-optimized connection: <a href="http://localhost:8080/simple-webrtc-test?simulation=true&react=true" target="_blank">http://localhost:8080/simple-webrtc-test?simulation=true&react=true</a></p>
        </div>
      </body>
    </html>
  `);
});

// Verify JWT token (simulation - in production would use proper verification)
function verifyJWT(token) {
  try {
    // In a real implementation, this would use a proper JWT library
    // This is a simplified simulation for testing purposes
    const [header, payload, signature] = token.split('.');

    // Basic validation for the simulation server
    if (!header || !payload || !signature) {
      return { valid: false, error: 'Invalid token format' };
    }

    // Decode payload (base64url)
    const decodedPayload = JSON.parse(
      Buffer.from(payload, 'base64').toString('utf8')
    );

    // Verify token expiration
    if (decodedPayload.exp && decodedPayload.exp < Math.floor(Date.now() / 1000)) {
      return { valid: false, error: 'Token expired' };
    }

    // For the simulation, accept any properly formatted token
    // In production, this would verify the signature against the JWT_SECRET
    return {
      valid: true,
      tenantId: decodedPayload.tenant_id || 'simulation',
      userId: decodedPayload.sub || 'test-user',
      sessionId: decodedPayload.session_id
    };
  } catch (error) {
    console.error('JWT verification error:', error);
    return { valid: false, error: error.message };
  }
}

// Create WebSocket server with enhanced connection handling
const wss = new WebSocket.Server({
  server,
  // Validate connections with JWT in production (simulated here)
  verifyClient: (info, callback) => {
    // Parse URL for query parameters
    const parsedUrl = url.parse(info.req.url, true);
    const { token, session, simulation } = parsedUrl.query;

    // Allow simulation connections for testing
    if (simulation === 'true') {
      console.log('Allowing simulation connection without JWT verification');
      return callback(true);
    }

    // In development mode, allow connections without tokens
    if (process.env.NODE_ENV === 'development') {
      console.log('Development mode: skipping JWT verification');
      return callback(true);
    }

    // For production, verify JWT token
    if (!token) {
      console.error('Missing JWT token in connection request');
      return callback(false, 401, 'Authentication required');
    }

    const verificationResult = verifyJWT(token);
    if (!verificationResult.valid) {
      console.error(`JWT verification failed: ${verificationResult.error}`);
      return callback(false, 403, verificationResult.error);
    }

    // Store verification result in the request for later use
    info.req.jwtData = verificationResult;
    callback(true);
  },
  clientTracking: true,
  perMessageDeflate: false // Disable compression for simplicity
});

console.log('=== Enhanced WebSocket Test Server for Hybrid Architecture ===');
console.log('HTTP server running on http://localhost:3001');
console.log('WebSocket server mounted on the same port');
console.log('CORS enabled for all origins');
console.log('JWT validation and session recovery enabled');
console.log('');
console.log('=== React-Specific Enhancements ===');
console.log('• Added special handling for code 1001 closures (common in React navigation)');
console.log('• Added detection of rapid reconnections (indicates React re-rendering)');
console.log('• Enhanced heartbeat mechanism with variable frequency');
console.log('• Added message delay to prevent race conditions during component mounting');
console.log('• Improved connection recovery for React component lifecycle');
console.log('');
console.log('=== Debugging Tips ===');
console.log('• Add ?simulation=true to bypass JWT validation');
console.log('• Add ?react=true to enable React-specific optimizations');
console.log('• For React components, ensure useEffect cleanup doesn\'t close connections prematurely');
console.log('• Watch for rapid connect/disconnect cycles in the logs (sign of component re-rendering)');
console.log('');

// Enhanced connection handling with improved error handling and React-friendly behavior
wss.on('connection', (ws, req) => {
  const ip = req.socket.remoteAddress;
  const forwardedFor = req.headers['x-forwarded-for'] || '';
  const host = req.headers.host || '';
  const origin = req.headers.origin || '';
  const userAgent = req.headers['user-agent'] || '';

  // Parse URL for query parameters (for session recovery)
  const parsedUrl = url.parse(req.url, true);
  const { token, session: sessionIdParam, simulation, react } = parsedUrl.query;

  // Get tenant info from JWT or use simulation values
  const tenantId = req.jwtData?.tenantId || 'simulation';
  const userId = req.jwtData?.userId || 'test-user';

  // Create or restore session ID
  let sessionId = sessionIdParam || req.jwtData?.sessionId || 'test-' + Date.now();
  let isRecoveredSession = false;
  let sessionHistory = [];

  // Track connection details
  const connectionDetails = {
    timestamp: new Date().toISOString(),
    ip,
    origin,
    userAgent,
    host,
    params: {
      simulation: !!simulation,
      react: !!react,
      hasToken: !!token,
      sessionProvided: !!sessionIdParam
    }
  };

  // Check if this is a session recovery
  if (activeSessions.has(sessionId)) {
    const sessionData = activeSessions.get(sessionId);
    isRecoveredSession = true;
    sessionHistory = sessionData.connections || [];

    console.log(`Recovering session: ${sessionId}`);
    console.log(`Previous connection state: ${JSON.stringify(sessionData.lastState || {})}`);
    console.log(`Connection history: ${sessionData.connections?.length || 0} previous connections`);

    // Clear the recovery timeout
    if (sessionData.recoveryTimeout) {
      clearTimeout(sessionData.recoveryTimeout);
    }

    // Check if this is a rapid reconnection (likely React re-render)
    const now = new Date();
    const timeSinceLastDisconnect = sessionData.lastDisconnect
      ? now.getTime() - sessionData.lastDisconnect.getTime()
      : Infinity;

    const isRapidReconnect = timeSinceLastDisconnect < 5000; // 5 seconds

    if (isRapidReconnect) {
      console.log(`Detected rapid reconnection (${timeSinceLastDisconnect}ms since disconnect)`);
      console.log(`This is likely caused by React component re-rendering`);

      if (sessionData.lastCloseCode === 1001) {
        console.log(`Previous close was code 1001 - confirming React navigation pattern`);
      }
    }

    // Update the session with recovery information
    sessionData.reconnections = (sessionData.reconnections || 0) + 1;
    sessionData.lastReconnect = now;
    sessionData.ws = ws;
    sessionData.isRapidReconnect = isRapidReconnect;

    // Track connection history
    sessionHistory.push(connectionDetails);
    sessionData.connections = sessionHistory;

    activeSessions.set(sessionId, sessionData);
  } else {
    // Initialize new session with enhanced tracking
    sessionHistory.push(connectionDetails);

    activeSessions.set(sessionId, {
      id: sessionId,
      tenantId,
      userId,
      createdAt: new Date(),
      lastActivity: new Date(),
      ws,
      state: 'connecting',
      lastMessages: [],
      reconnections: 0,
      connections: sessionHistory,
      params: {
        simulation: !!simulation,
        react: !!react
      }
    });
  }

  // Enhanced connection logging with more details
  console.log('=============================================');
  console.log(`Client connected! [${new Date().toISOString()}]`);
  console.log(`Tenant: ${tenantId}, User: ${userId}, Session: ${sessionId}`);
  console.log(`IP: ${ip}, Origin: ${origin}`);

  if (simulation === 'true') {
    console.log(`SIMULATION MODE ACTIVE - JWT validation bypassed`);
  }

  if (react === 'true') {
    console.log(`REACT MODE ACTIVE - Using React-friendly connection handling`);
  }

  console.log(`Connection count for this session: ${sessionHistory.length + 1}`);

  if (isRecoveredSession) {
    console.log(`This is a reconnection. Previous disconnects: ${sessionHistory.length}`);
  }

  // Send session ID right away but with a small delay to ensure the connection is ready
  // This helps prevent race conditions in React components that might not be fully mounted yet
  setTimeout(() => {
    // First ensure the connection is still open
    if (ws.readyState === WebSocket.OPEN) {
      const sessionMessage = JSON.stringify({
        type: 'session',
        sessionId: sessionId,
        tenantId: tenantId,
        recovered: isRecoveredSession,
        timestamp: new Date().toISOString(),
        reconnectionCount: isRecoveredSession ? sessionHistory.length : 0,
        mode: simulation === 'true' ? 'simulation' : 'normal',
        reactMode: react === 'true'
      });

      ws.send(sessionMessage);
      console.log(`Sent session ID: ${sessionId}`);

      // Track this in the session data
      if (activeSessions.has(sessionId)) {
        const sessionData = activeSessions.get(sessionId);
        sessionData.lastActivity = new Date();
        sessionData.state = 'connected';
        sessionData.lastMessages.push({
          direction: 'out',
          type: 'session',
          time: new Date()
        });

        // Add connection readiness ping with short interval
        // This helps React components stabilize the connection
        setTimeout(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              type: 'connection_ready',
              timestamp: new Date().toISOString(),
              sessionId: sessionId,
              message: 'Connection is stable and ready for messages'
            }));
            console.log(`Sent connection_ready message for session ${sessionId}`);
          }
        }, 500);
      }
    } else {
      console.warn(`Cannot send session message - WebSocket already closed (state: ${ws.readyState})`);

      // If we detect a connection that closed immediately, log this special case
      console.log(`IMMEDIATE CLOSE DETECTED - Connection closed before session message could be sent`);
      console.log(`This is a strong indicator of React component unmounting right after mounting`);

      // Update session data to reflect this issue
      if (activeSessions.has(sessionId)) {
        const sessionData = activeSessions.get(sessionId);
        sessionData.hadImmediateClose = true;
        sessionData.immediateCloseTime = new Date();
      }
    }
  }, 100); // Small delay to ensure client is ready

  // If this is a recovered session, resend last state
  if (isRecoveredSession && sessionData.lastState) {
    setTimeout(() => {
      try {
        ws.send(JSON.stringify({
          type: 'recovery',
          lastState: sessionData.lastState,
          reconnections: sessionData.reconnections
        }));
        console.log(`Sent recovery state for session ${sessionId}`);
      } catch (error) {
        console.error(`Error sending recovery state: ${error.message}`);
      }
    }, 500);
  } else {
    // Send a welcome message with test transcript - just once
    setTimeout(() => {
      const welcomeMessage = JSON.stringify({
        type: 'transcript',
        text: 'Hello from the ngrok WebSocket test server! Connection is working properly.',
        id: `welcome-${Date.now()}` // Add unique ID
      });
      ws.send(welcomeMessage);
      console.log('Sent welcome transcript message');

      // Send test conversation messages at intervals
      setTimeout(() => {
        ws.send(JSON.stringify({
          type: 'transcript',
          text: 'This is a simulated AI interviewer. I can send transcript messages through WebRTC.',
          id: `msg-${Date.now()}`
        }));
      }, 3000);

      setTimeout(() => {
        ws.send(JSON.stringify({
          type: 'transcript',
          text: 'How do you feel about WebSocket connections through ngrok tunnels?',
          id: `msg-${Date.now()}`
        }));
      }, 6000);
    }, 1000);
  }

  // Handle messages with improved error handling and session tracking
  ws.on('message', (message) => {
    try {
      // Parse message
      const data = JSON.parse(message.toString());

      // Update session activity timestamp and message history
      if (activeSessions.has(sessionId)) {
        const sessionData = activeSessions.get(sessionId);
        sessionData.lastActivity = new Date();

        // Keep the last 10 messages for recovery purposes
        sessionData.lastMessages.push({
          direction: 'in',
          type: data.type,
          time: new Date()
        });

        if (sessionData.lastMessages.length > 10) {
          sessionData.lastMessages.shift();
        }
      }

      // Only log non-ping messages to reduce spam
      if (data.type !== 'ping') {
        console.log(`Received message type: ${data.type}`);
      }

      // Handle message types
      switch (data.type) {
        case 'init':
          // Respond to init with session info
          ws.send(JSON.stringify({
            type: 'session',
            sessionId: sessionId,
            tenantId: tenantId,
            timestamp: new Date().toISOString()
          }));
          console.log('Responded to init message');
          break;

        case 'ping':
          // Respond to ping with detailed status info
          ws.send(JSON.stringify({
            type: 'pong',
            timestamp: new Date().toISOString(),
            sessionId: sessionId,
            connectionCount: wss.clients.size,
            uptime: process.uptime()
          }));
          break;

        case 'sdp_offer':
          console.log('Received SDP offer, sending simulated transcript and SDP answer');

          // First send a transcript message
          ws.send(JSON.stringify({
            type: 'transcript',
            text: 'I received your SDP offer and will respond with a simulated answer.',
            speaker: 'system'
          }));

          // Then send a simplified SDP answer
          setTimeout(() => {
            ws.send(JSON.stringify({
              type: 'sdp_answer',
              answer: {
                type: 'answer',
                sdp: 'v=0\r\no=- 123456789 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=group:BUNDLE 0\r\nm=audio 9 UDP/TLS/RTP/SAVPF 111\r\nc=IN IP4 0.0.0.0\r\na=rtcp:9 IN IP4 0.0.0.0\r\na=ice-ufrag:ngrok\r\na=ice-pwd:simulatedicepassword\r\na=fingerprint:sha-256 00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF\r\na=setup:active\r\na=mid:0\r\na=sendrecv\r\na=rtcp-mux\r\na=rtpmap:111 opus/48000/2\r\na=fmtp:111 minptime=10;useinbandfec=1\r\na=ssrc:123456 cname:simulated-cname\r\n'
              }
            }));
            console.log('Sent simulated SDP answer');

            // Save SDP offer and answer in session state
            if (activeSessions.has(sessionId)) {
              const sessionData = activeSessions.get(sessionId);
              sessionData.lastState = {
                sdpExchangeCompleted: true,
                lastSdpTimestamp: new Date().toISOString()
              };
            }

            // Send another transcript message
            setTimeout(() => {
              ws.send(JSON.stringify({
                type: 'transcript',
                text: 'WebRTC connection simulation successful! This is a simulated interview response.',
                speaker: 'ai'
              }));
              console.log('Sent follow-up transcript message');
            }, 1000);
          }, 500);
          break;

        case 'ice_candidate':
          // Acknowledge ICE candidate with improved response
          ws.send(JSON.stringify({
            type: 'ice_acknowledge',
            success: true,
            timestamp: new Date().toISOString(),
            message: 'ICE candidate received and processed'
          }));
          console.log('Acknowledged ICE candidate');
          break;

        case 'error_report':
          // Handle client error reports
          console.error(`Client reported error: ${data.message || 'Unknown error'}`);
          console.error(`Error details: ${JSON.stringify(data.details || {})}`);

          // Send acknowledgment
          ws.send(JSON.stringify({
            type: 'error_acknowledge',
            errorId: data.errorId || crypto.randomUUID(),
            message: 'Error report received',
            timestamp: new Date().toISOString()
          }));
          break;

        case 'reconnect':
          // Handle explicit reconnection request
          console.log(`Reconnection requested for session ${sessionId}`);

          // Send reconnect acknowledgment
          ws.send(JSON.stringify({
            type: 'reconnect_acknowledge',
            sessionId: sessionId,
            timestamp: new Date().toISOString(),
            message: 'Reconnection request acknowledged'
          }));
          break;

        default:
          console.log(`Unhandled message type: ${data.type}`);

          // Send unknown message type acknowledgment
          ws.send(JSON.stringify({
            type: 'unknown_message',
            originalType: data.type,
            message: 'Unknown message type received',
            timestamp: new Date().toISOString()
          }));
      }
    } catch (error) {
      console.error('Error processing message:', error);

      // Send error response to client
      try {
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Failed to process message: ' + error.message,
          errorId: crypto.randomUUID(),
          timestamp: new Date().toISOString()
        }));
      } catch (sendError) {
        console.error('Failed to send error response:', sendError);
      }
    }
  });

  // Set up enhanced heartbeat mechanism with variable frequency
  // More aggressive at first, then less frequent once stable
  let heartbeatInterval = 2000; // Start with 2-second interval
  let heartbeatCount = 0;
  const maxHeartbeatCount = 5;

  const pingInterval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      // Send both a standard ping and a custom message for clients that might not handle pings
      ws.ping('heartbeat');

      // Also send a proper WebSocket message for clients that don't process raw pings
      if (heartbeatCount < maxHeartbeatCount || heartbeatCount % 5 === 0) {
        try {
          ws.send(JSON.stringify({
            type: 'heartbeat',
            timestamp: new Date().toISOString(),
            count: heartbeatCount,
            sessionId: sessionId
          }));
        } catch (err) {
          console.error(`Failed to send heartbeat message: ${err.message}`);
        }
      }

      heartbeatCount++;

      // After 5 heartbeats, increase the interval to reduce traffic
      if (heartbeatCount === maxHeartbeatCount) {
        console.log(`Increasing heartbeat interval after ${maxHeartbeatCount} beats`);
        clearInterval(pingInterval);
        heartbeatInterval = 15000; // Switch to 15-second interval for long-term

        // Create a new interval with the longer delay
        const newPingInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.ping('heartbeat');

            if (heartbeatCount % 5 === 0) {
              try {
                ws.send(JSON.stringify({
                  type: 'heartbeat',
                  timestamp: new Date().toISOString(),
                  count: heartbeatCount,
                  sessionId: sessionId
                }));
              } catch (err) {
                console.error(`Failed to send heartbeat message: ${err.message}`);
              }
            }

            heartbeatCount++;
          } else {
            clearInterval(newPingInterval);
          }
        }, heartbeatInterval);

        // Update session data
        if (activeSessions.has(sessionId)) {
          const sessionData = activeSessions.get(sessionId);
          sessionData.longTermHeartbeatInterval = newPingInterval;
        }
      }
    } else {
      clearInterval(pingInterval);
    }
  }, heartbeatInterval);

  // Handle disconnection with enhanced session recovery
  ws.on('close', (code, reason) => {
    console.log(`Client disconnected [${new Date().toISOString()}]`);
    console.log(`Close code: ${code}, Reason: ${reason || 'No reason provided'}`);

    // Clear the ping interval
    clearInterval(pingInterval);

    // Set up session recovery
    if (activeSessions.has(sessionId)) {
      const sessionData = activeSessions.get(sessionId);
      sessionData.state = 'disconnected';
      sessionData.lastDisconnect = new Date();
      sessionData.lastCloseCode = code;
      sessionData.lastCloseReason = reason;

      // Special handling for code 1001 (going away) - common during React navigation
      // Extend timeout for these cases as they're likely to reconnect
      const isNavigationClose = code === 1001;
      const recoveryTime = isNavigationClose ? RECOVERY_TIMEOUT * 2 : RECOVERY_TIMEOUT;

      // Don't count navigation closures (1001) toward reconnection limit
      if (isNavigationClose) {
        console.log(`Navigation close detected (code 1001). Not counting toward reconnection limit.`);
        // Don't increment reconnection count for navigation events
        sessionData.reconnections = Math.max(0, sessionData.reconnections - 1);
      }

      // Set up recovery timeout unless max reconnections reached
      if (sessionData.reconnections < MAX_RECONNECT_ATTEMPTS) {
        console.log(`Setting up recovery for session ${sessionId}, timeout: ${recoveryTime}ms`);
        sessionData.recoveryTimeout = setTimeout(() => {
          console.log(`Recovery timeout expired for session ${sessionId}`);
          activeSessions.delete(sessionId);
        }, recoveryTime);
      } else {
        console.log(`Session ${sessionId} exceeded max reconnections, cleaning up`);
        activeSessions.delete(sessionId);
      }
    }
  });

  // Handle connection errors with detailed logging
  ws.on('error', (error) => {
    console.error(`WebSocket connection error for session ${sessionId}:`, error);

    // Track error in session data
    if (activeSessions.has(sessionId)) {
      const sessionData = activeSessions.get(sessionId);
      sessionData.lastError = {
        message: error.message,
        time: new Date().toISOString(),
        stack: error.stack
      };
    }

    // Try to send error notification to client
    try {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'server_error',
          message: 'Internal server error occurred',
          errorId: crypto.randomUUID(),
          timestamp: new Date().toISOString()
        }));
      }
    } catch (sendError) {
      console.error('Failed to send error notification:', sendError);
    }
  });

  // Handle unexpected pong to detect connection issues
  ws.on('pong', (data) => {
    if (activeSessions.has(sessionId)) {
      const sessionData = activeSessions.get(sessionId);
      sessionData.lastPong = new Date();
    }
  });
});

// Enhanced server error handling
wss.on('error', (error) => {
  console.error(`WebSocket server error: ${error.message}`);
  console.error(error.stack);
});

// Log server listening events
wss.on('listening', () => {
  console.log('WebSocket server is listening for connections');
});

// Start HTTP server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server ready! Listening on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} to check server status`);

  // Session management and reporting
  setInterval(() => {
    const clientCount = wss.clients.size;
    const sessionCount = activeSessions.size;

    if (clientCount > 0 || sessionCount > 0) {
      console.log(`=== Server Status [${new Date().toISOString()}] ===`);
      console.log(`Active WebSocket connections: ${clientCount}`);
      console.log(`Active sessions: ${sessionCount}`);

      // Clean up stale sessions and clear any lingering timeouts
      let cleanedSessions = 0;
      const now = new Date();

      for (const [sessionId, sessionData] of activeSessions.entries()) {
        // Session inactive for more than 2 hours
        const inactiveTime = now.getTime() - (sessionData.lastActivity?.getTime() || 0);
        if (inactiveTime > 7200000) { // 2 hours
          // Clear any pending timeouts before removing the session
          if (sessionData.recoveryTimeout) {
            clearTimeout(sessionData.recoveryTimeout);
          }

          if (sessionData.longTermHeartbeatInterval) {
            clearInterval(sessionData.longTermHeartbeatInterval);
          }

          // If there's a websocket, try to close it properly
          if (sessionData.ws && sessionData.ws.readyState === WebSocket.OPEN) {
            try {
              sessionData.ws.close(1000, "Session expired due to inactivity");
            } catch (err) {
              console.error(`Error closing stale WebSocket for session ${sessionId}:`, err.message);
            }
          }

          activeSessions.delete(sessionId);
          cleanedSessions++;
          console.log(`Cleaned up stale session ${sessionId} (inactive for ${Math.floor(inactiveTime/60000)} minutes)`);
        }

        // Log sessions that have had immediate close issues
        if (sessionData.hadImmediateClose) {
          console.log(`Note: Session ${sessionId} had immediate close issue at ${sessionData.immediateCloseTime?.toISOString()}`);
        }
      }

      if (cleanedSessions > 0) {
        console.log(`Cleaned up ${cleanedSessions} stale sessions`);
      }
    }
  }, 300000); // Every 5 minutes
});