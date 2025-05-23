import { useState, useEffect, useRef } from 'react';
import { SimpleWebRTCManager, SimpleWebRTCManagerRef } from '../components/interview/SimpleWebRTCManager';

/**
 * A test page for the simplified WebRTC manager without audio visualization
 * This page avoids the infinite loop issues in the full WebRTCManager component
 */
const SimpleWebRTCTest = () => {
  // State for configuration options
  const [serverUrl, setServerUrl] = useState<string>('ws://localhost:3001?simulation=true');
  const [simulationMode, setSimulationMode] = useState<boolean>(true);
  const [openAIMode, setOpenAIMode] = useState<boolean>(false);
  const [openAIKey, setOpenAIKey] = useState<string>('');
  const [sessionId, setSessionId] = useState<string>(`test-${Date.now()}`);

  // Reference to the WebRTC manager component to control it manually
  const managerRef = useRef<SimpleWebRTCManagerRef>(null);
  const [manualConnectionStarted, setManualConnectionStarted] = useState<boolean>(false);

  // State for transcript and connection status
  const [transcript, setTranscript] = useState<string[]>([]);
  const [connectionState, setConnectionState] = useState<string>('disconnected');

  // Function to start the WebRTC connection manually
  const startConnection = () => {
    console.log('Starting WebRTC connection manually');

    if (managerRef.current) {
      console.log('Calling initialize() via ref');
      managerRef.current.initialize()
        .then(success => {
          console.log('Connection initialization result:', success);
          setManualConnectionStarted(true);
        })
        .catch(err => {
          console.error('Failed to initialize connection:', err);
        });
    } else {
      console.error('WebRTC manager ref is not available');
    }
  };

  // Save OpenAI key to localStorage if provided
  useEffect(() => {
    if (openAIKey && openAIMode) {
      localStorage.setItem('openai_key', openAIKey);
    }
  }, [openAIKey, openAIMode]);

  // Load OpenAI key from localStorage on initial load
  useEffect(() => {
    const savedKey = localStorage.getItem('openai_key');
    if (savedKey) {
      setOpenAIKey(savedKey);
    }
  }, []);

  // Handle transcript updates
  const handleTranscriptUpdate = (text: string) => {
    setTranscript(prev => [...prev, text]);
  };

  // Handle connection state changes
  const handleConnectionStateChange = (state: string) => {
    setConnectionState(state);
    console.log(`Connection state changed: ${state}`);

    // Reset manual connection state if disconnected
    if (state === 'disconnected') {
      setManualConnectionStarted(false);
    }
  };

  // Log component mount to verify execution
  useEffect(() => {
    console.log('SimpleWebRTCTest component mounted - connection should be initiated manually');
  }, []);

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
      <h1>Simple WebRTC Test</h1>
      <p>This is a simplified test page for WebRTC that avoids the infinite loop issues in the audio visualization.</p>

      {/* Configuration Panel */}
      <div style={{
        border: '1px solid #ddd',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '20px'
      }}>
        <h2>Configuration</h2>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            Server URL
            <input
              type="text"
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #ddd'
              }}
            />
          </label>
          <small style={{ color: '#666' }}>
            For simulation mode: ws://localhost:3001?simulation=true
          </small>
        </div>

        <div style={{
          display: 'flex',
          gap: '20px',
          marginBottom: '15px'
        }}>
          <label>
            <input
              type="checkbox"
              checked={simulationMode}
              onChange={(e) => {
                setSimulationMode(e.target.checked);
                if (e.target.checked) {
                  setOpenAIMode(false);
                }
              }}
            />
            Simulation Mode
          </label>

          <label>
            <input
              type="checkbox"
              checked={openAIMode}
              onChange={(e) => {
                setOpenAIMode(e.target.checked);
                if (e.target.checked) {
                  setSimulationMode(false);
                }
              }}
            />
            OpenAI Direct Mode
          </label>
        </div>

        {openAIMode && (
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>
              OpenAI API Key
              <input
                type="password"
                value={openAIKey}
                onChange={(e) => setOpenAIKey(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #ddd'
                }}
                placeholder="sk-..."
              />
            </label>
            <small style={{ color: '#666' }}>
              Your API key is stored only in your browser's localStorage.
            </small>
          </div>
        )}

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            Session ID
            <input
              type="text"
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #ddd'
              }}
            />
          </label>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '8px 16px',
              backgroundColor: '#2196f3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Reset &amp; Reload
          </button>

          <button
            onClick={startConnection}
            disabled={manualConnectionStarted || connectionState !== 'disconnected'}
            style={{
              padding: '8px 16px',
              backgroundColor: '#4caf50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: connectionState === 'disconnected' ? 'pointer' : 'not-allowed',
              opacity: (manualConnectionStarted || connectionState !== 'disconnected') ? '0.6' : '1'
            }}
            title={connectionState !== 'disconnected' ? 'Cannot start connection while already connected' : 'Start WebRTC connection manually'}
          >
            Start Connection
          </button>

          {/* Server status check button */}
          <button
            onClick={() => {
              try {
                // Handle URL conversion safely
                let httpUrl = serverUrl;
                // Convert WebSocket protocol to HTTP
                if (serverUrl.startsWith('ws:')) {
                  httpUrl = 'http:' + serverUrl.substring(3);
                } else if (serverUrl.startsWith('wss:')) {
                  httpUrl = 'https:' + serverUrl.substring(4);
                }

                // Extract the base URL without query parameters
                const urlParts = httpUrl.split('?');
                const baseUrl = urlParts[0];

                // Open the WebSocket server status page in a new tab
                window.open(baseUrl, '_blank');
              } catch (error) {
                console.error('Error parsing server URL:', error);
                alert('Invalid server URL format. Please check the URL and try again.');
              }
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: '#ff9800',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
            title="Check if the WebSocket server is running"
          >
            Check Server Status
          </button>

          {/* Add debug connection button for advanced testing */}
          <button
            onClick={() => {
              // Ensure the URL has the simulation parameter
              let debugUrl = serverUrl;
              if (!debugUrl.includes('simulation=')) {
                debugUrl += (debugUrl.includes('?') ? '&' : '?') + 'simulation=true';
              }

              console.log('Attempting direct WebSocket connection via console...');
              console.log(`Run this in your browser console to test direct WebSocket connection:`);
              console.log(`
// WebSocket connection with simulation mode enabled
const socket = new WebSocket('${debugUrl}');

// Connection opened
socket.addEventListener('open', () => {
  console.log('🟢 WebSocket connected!');
  // After connection, send a test ping message
  socket.send(JSON.stringify({type: 'ping'}));
  console.log('Sent: ping message');
});

// Listen for messages
socket.addEventListener('message', (event) => {
  const data = JSON.parse(event.data);
  console.log('📩 Message received:', data);
  console.log('Message type:', data.type);

  // If we receive a session ID, log it
  if (data.type === 'session') {
    console.log('Session ID:', data.sessionId);
  }
});

// Listen for errors
socket.addEventListener('error', (event) => {
  console.error('🔴 WebSocket error occurred:', event);
});

// Listen for disconnection
socket.addEventListener('close', (event) => {
  console.log('WebSocket connection closed');
  console.log('Close code:', event.code);
  console.log('Close reason:', event.reason || 'No reason provided');
});
              `);

              // Also perform a direct connection test for convenience
              try {
                const testSocket = new WebSocket(debugUrl);

                testSocket.onopen = () => {
                  console.log('Test socket connected successfully!');
                  // Send a test ping
                  testSocket.send(JSON.stringify({type: 'ping'}));
                };

                testSocket.onmessage = (event) => {
                  console.log('Test socket received:', JSON.parse(event.data));
                };

                testSocket.onerror = (error) => {
                  console.error('Test socket error:', error);
                };

                alert('Debug connection code copied to console. A test connection has also been initiated. Open developer tools (F12) to view results.');
              } catch (error) {
                console.error('Failed to create test socket:', error);
                alert('Debug connection code copied to console, but test connection failed. Check the URL format and try again.');
              }
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: '#9c27b0',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
            title="Generate WebSocket debug code in console and perform a test connection"
          >
            Debug Connection
          </button>
        </div>

        {/* Connection status message */}
        {manualConnectionStarted && connectionState === 'connecting' && (
          <div style={{
            marginTop: '10px',
            padding: '10px',
            backgroundColor: '#fff3cd',
            color: '#856404',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <div style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              border: '3px solid #ffeeba',
              borderTopColor: '#856404',
              animation: 'spin 1s linear infinite'
            }}></div>
            <span>Connecting to WebSocket server... Please wait.</span>
          </div>
        )}

        {connectionState === 'connected' && (
          <div style={{
            marginTop: '10px',
            padding: '10px',
            backgroundColor: '#d4edda',
            color: '#155724',
            borderRadius: '4px'
          }}>
            <span>✅ Connection established successfully!</span>
          </div>
        )}

        {(connectionState === 'ice_failed' || connectionState === 'connection_failed' || connectionState === 'error') && (
          <div style={{
            marginTop: '10px',
            padding: '10px',
            backgroundColor: '#f8d7da',
            color: '#721c24',
            borderRadius: '4px'
          }}>
            <span>❌ Connection failed. Make sure the WebSocket server is running at {serverUrl}</span>
          </div>
        )}
      </div>
      
      {/* SimpleWebRTCManager Component */}
      <SimpleWebRTCManager
        ref={managerRef}
        sessionId={sessionId}
        onTranscriptUpdate={handleTranscriptUpdate}
        onConnectionStateChange={handleConnectionStateChange}
        serverUrl={serverUrl}
        simulationMode={simulationMode}
        openAIMode={openAIMode}
        openAIKey={openAIKey}
        autoConnect={false} // Disable auto-connection to use manual start button
      />
      
      {/* Transcript Display */}
      <div style={{ 
        border: '1px solid #ddd', 
        borderRadius: '8px', 
        padding: '20px',
        marginTop: '20px',
        backgroundColor: '#f8f9fa'
      }}>
        <h2>Transcript</h2>
        <div style={{ 
          maxHeight: '300px', 
          overflowY: 'auto',
          backgroundColor: 'white',
          padding: '10px',
          borderRadius: '4px',
          border: '1px solid #eee'
        }}>
          {transcript.length > 0 ? (
            transcript.map((text, index) => (
              <div 
                key={index}
                style={{ 
                  marginBottom: '10px',
                  padding: '8px',
                  borderRadius: '4px',
                  backgroundColor: index % 2 === 0 ? '#e3f2fd' : '#fff8e1'
                }}
              >
                {text}
              </div>
            ))
          ) : (
            <div style={{ color: '#666', textAlign: 'center', padding: '20px' }}>
              No transcript entries yet. Connect to begin the interview.
            </div>
          )}
        </div>
      </div>
      
      {/* Connection Timeline */}
      <div style={{
        border: '1px solid #ddd',
        borderRadius: '8px',
        padding: '20px',
        marginTop: '20px'
      }}>
        <h2>Connection Info</h2>
        <div>
          <strong>Current State:</strong> {connectionState}
        </div>
        <div>
          <strong>Session ID:</strong> {sessionId}
        </div>
        <div>
          <strong>Mode:</strong> {openAIMode ? 'OpenAI Direct' : simulationMode ? 'Simulation' : 'Standard'}
        </div>
        <div>
          <strong>Server URL:</strong> {serverUrl}
        </div>
        <div>
          <strong style={{ color: serverUrl.includes('simulation=true') ? 'green' : 'red' }}>
            Simulation Parameter: {serverUrl.includes('simulation=true') ? 'Present ✓' : 'Missing ⚠️'}
          </strong>
          {!serverUrl.includes('simulation=true') && (
            <div style={{ color: 'red', marginTop: '5px' }}>
              Warning: The simulation parameter is required for testing without JWT tokens.
              Add "?simulation=true" to your server URL.
            </div>
          )}
        </div>
        <div>
          <strong>Auto Connect:</strong> {false ? 'Enabled' : 'Disabled (Click Start Connection)'}
        </div>
        <div>
          <strong>WebRTC Manager Status:</strong> {managerRef ? 'Initialized' : 'Not Initialized'}
        </div>
        <div>
          <strong>Manual Connection:</strong> {manualConnectionStarted ? 'Attempted' : 'Not Started'}
        </div>
      </div>

      {/* Debug Panel */}
      <div style={{
        border: '1px solid #ddd',
        borderRadius: '8px',
        padding: '20px',
        marginTop: '20px',
        backgroundColor: '#f8f9fa'
      }}>
        <h2>Debug Instructions</h2>
        <ol style={{
          paddingLeft: '20px',
          lineHeight: '1.6'
        }}>
          <li>
            <strong>Verify WebSocket Server:</strong> Ensure the WebSocket server is running:
            <div style={{
              backgroundColor: '#e9ecef',
              padding: '8px',
              borderRadius: '4px',
              fontFamily: 'monospace',
              marginTop: '5px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              cd fly-interview-hybrid && node simple-server.js
              <button
                onClick={() => {
                  navigator.clipboard.writeText('cd fly-interview-hybrid && node simple-server.js');
                  alert('Command copied to clipboard!');
                }}
                style={{
                  border: 'none',
                  background: '#6c757d',
                  color: 'white',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Copy
              </button>
            </div>
          </li>
          <li>
            <strong>Test Server</strong>: Open a new terminal and run:
            <div style={{
              backgroundColor: '#e9ecef',
              padding: '8px',
              borderRadius: '4px',
              fontFamily: 'monospace',
              marginTop: '5px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              curl http://localhost:3001
              <button
                onClick={() => {
                  navigator.clipboard.writeText('curl http://localhost:3001');
                  alert('Command copied to clipboard!');
                }}
                style={{
                  border: 'none',
                  background: '#6c757d',
                  color: 'white',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Copy
              </button>
            </div>
            <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
              You should see HTML output if the server is running
            </div>
          </li>
          <li>Verify the Server URL includes <code>?simulation=true</code> parameter (added automatically)</li>
          <li>Click the "Start Connection" button</li>
          <li>Check browser console for detailed connection logs (F12 or right-click &gt; Inspect &gt; Console)</li>
          <li>Use the "Debug Connection" button to test the WebSocket directly</li>
        </ol>

        <div style={{
          backgroundColor: '#d4edda',
          color: '#155724',
          padding: '10px 15px',
          borderRadius: '4px',
          marginTop: '15px'
        }}>
          <strong>Quick Fix:</strong> If the connection fails, try these steps:
          <ol style={{ marginTop: '8px', paddingLeft: '20px' }}>
            <li>Verify the server is running with <code>curl http://localhost:3001</code></li>
            <li>Restart the server: Press Ctrl+C in the server terminal, then run <code>node simple-server.js</code> again</li>
            <li>Click "Reset & Reload" to refresh this page</li>
            <li>Try the connection again</li>
          </ol>
        </div>

        <h3 style={{ marginTop: '20px' }}>Common Issues</h3>
        <ul style={{
          paddingLeft: '20px',
          lineHeight: '1.6'
        }}>
          <li><strong>WebSocket server not running</strong> - Make sure the server is started in the fly-interview-hybrid directory</li>
          <li><strong>Missing simulation parameter</strong> - The URL must include <code>?simulation=true</code> for testing</li>
          <li><strong>CORS issues</strong> - Server must allow connections from localhost</li>
          <li><strong>Browser security restrictions</strong> - Some browsers block WebSocket connections in certain contexts</li>
          <li><strong>Multiple instance conflicts</strong> - Close other tabs with active connections</li>
          <li><strong>Network or firewall issues</strong> - Try using Chrome or Edge for best compatibility</li>
        </ul>

        <h3 style={{ marginTop: '20px' }}>Direct WebSocket Test</h3>
        <div style={{
          backgroundColor: '#e9ecef',
          padding: '10px',
          borderRadius: '4px',
          fontFamily: 'monospace',
          fontSize: '14px',
          lineHeight: '1.4',
          overflowX: 'auto',
          marginTop: '5px'
        }}>
          {`
// Test code for browser console
const testSocket = new WebSocket('ws://localhost:3001?simulation=true');
testSocket.onopen = () => {
  console.log('WebSocket connected!');
  testSocket.send(JSON.stringify({type: 'ping'}));
};
testSocket.onmessage = (e) => console.log('Message received:', JSON.parse(e.data));
testSocket.onerror = (e) => console.error('WebSocket error:', e);
          `}
        </div>
        <div style={{ textAlign: 'right', marginTop: '5px' }}>
          <button
            onClick={() => {
              const code = `
// Test code for browser console
const testSocket = new WebSocket('ws://localhost:3001?simulation=true');
testSocket.onopen = () => {
  console.log('WebSocket connected!');
  testSocket.send(JSON.stringify({type: 'ping'}));
};
testSocket.onmessage = (e) => console.log('Message received:', JSON.parse(e.data));
testSocket.onerror = (e) => console.error('WebSocket error:', e);
              `;
              navigator.clipboard.writeText(code.trim());
              alert('Test code copied to clipboard! Paste it in your browser console (F12)');
            }}
            style={{
              border: 'none',
              background: '#007bff',
              color: 'white',
              padding: '5px 10px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Copy Test Code
          </button>
        </div>
      </div>
      {/* Add animation styles */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .connecting-spinner {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 3px solid #f3f3f3;
          border-top: 3px solid #3498db;
          animation: spin 1s linear infinite;
        }

        [style*="animation: spin"] {
          animation: spin 1s linear infinite !important;
        }
      `}} />
    </div>
  );
};

export default SimpleWebRTCTest;