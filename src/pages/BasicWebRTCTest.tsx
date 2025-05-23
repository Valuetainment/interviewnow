import { useState, useEffect, useRef } from 'react';

export default function BasicWebRTCTest() {
  const [messages, setMessages] = useState<string[]>([]);
  const [connectionState, setConnectionState] = useState<string>('disconnected');
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const socketRef = useRef<WebSocket | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const connect = () => {
    setIsConnecting(true);
    setError(null);
    
    try {
      // Close any existing connection
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      
      // Create a new WebSocket connection
      const socket = new WebSocket('ws://localhost:3001?simulation=true&react=true');
      socketRef.current = socket;
      
      // Connection opened handler
      socket.addEventListener('open', () => {
        console.log('WebSocket connected!');
        setConnectionState('connected');
        setIsConnecting(false);
        setMessages(prev => [...prev, 'Connected to server']);
      });
      
      // Message handler
      socket.addEventListener('message', (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Received message:', data);
          
          // Handle transcript messages specifically
          if (data.type === 'transcript') {
            setMessages(prev => [...prev, `AI: ${data.text}`]);
          } else if (data.type !== 'heartbeat') {
            // Don't log heartbeats to avoid cluttering the UI
            setMessages(prev => [...prev, `Received: ${JSON.stringify(data)}`]);
          }
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      });
      
      // Error handler
      socket.addEventListener('error', (event) => {
        console.error('WebSocket error:', event);
        setConnectionState('error');
        setIsConnecting(false);
        setError('Connection error occurred');
      });
      
      // Close handler
      socket.addEventListener('close', (event) => {
        console.log(`WebSocket closed: Code ${event.code}`);
        setConnectionState('disconnected');
        setIsConnecting(false);
        // Only set error if it wasn't a normal closure
        if (event.code !== 1000) {
          setError(`Connection closed (Code: ${event.code})`);
        }
      });
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      setConnectionState('error');
      setIsConnecting(false);
      setError(`Failed to create connection: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  const disconnect = () => {
    if (socketRef.current) {
      socketRef.current.close(1000, 'User initiated disconnect');
      socketRef.current = null;
    }
  };
  
  const sendPing = () => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      const pingMessage = JSON.stringify({
        type: 'ping',
        timestamp: new Date().toISOString()
      });
      socketRef.current.send(pingMessage);
      setMessages(prev => [...prev, `Sent: Ping message`]);
    } else {
      setError('Cannot send ping: WebSocket not connected');
    }
  };
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        console.log('Component unmounting, closing WebSocket');
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, []);
  
  // Connection status indicator color
  const getStatusColor = () => {
    switch (connectionState) {
      case 'connected': return '#4CAF50'; // Green
      case 'connecting': return '#FF9800'; // Orange
      case 'error': return '#F44336'; // Red
      default: return '#9E9E9E'; // Gray
    }
  };
  
  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Basic WebRTC Test</h1>
      <p>This is a simplified test component that avoids the React infinite update issues.</p>
      
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ 
          width: '12px', 
          height: '12px', 
          borderRadius: '50%', 
          backgroundColor: getStatusColor(),
          marginRight: '8px'
        }}></div>
        <span>Status: {connectionState}</span>
      </div>
      
      {error && (
        <div style={{ 
          backgroundColor: '#FFEBEE', 
          padding: '10px', 
          borderRadius: '4px', 
          color: '#C62828',
          marginBottom: '20px'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={connect}
          disabled={connectionState === 'connected' || isConnecting}
          style={{
            padding: '8px 16px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            marginRight: '8px',
            cursor: connectionState === 'connected' || isConnecting ? 'not-allowed' : 'pointer',
            opacity: connectionState === 'connected' || isConnecting ? 0.7 : 1
          }}
        >
          {isConnecting ? 'Connecting...' : 'Connect'}
        </button>
        
        <button 
          onClick={sendPing}
          disabled={connectionState !== 'connected'}
          style={{
            padding: '8px 16px',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            marginRight: '8px',
            cursor: connectionState !== 'connected' ? 'not-allowed' : 'pointer',
            opacity: connectionState !== 'connected' ? 0.7 : 1
          }}
        >
          Send Ping
        </button>
        
        <button 
          onClick={disconnect}
          disabled={connectionState !== 'connected'}
          style={{
            padding: '8px 16px',
            backgroundColor: '#F44336',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: connectionState !== 'connected' ? 'not-allowed' : 'pointer',
            opacity: connectionState !== 'connected' ? 0.7 : 1
          }}
        >
          Disconnect
        </button>
      </div>
      
      <h3>Messages:</h3>
      <div style={{
        border: '1px solid #E0E0E0',
        borderRadius: '4px',
        padding: '10px',
        maxHeight: '400px',
        overflowY: 'auto',
        backgroundColor: '#F5F5F5'
      }}>
        {messages.length === 0 ? (
          <p style={{ color: '#757575' }}>No messages yet. Click "Connect" to start.</p>
        ) : (
          messages.map((message, index) => (
            <div key={index} style={{
              padding: '8px',
              borderBottom: index < messages.length - 1 ? '1px solid #E0E0E0' : 'none',
              backgroundColor: message.startsWith('AI:') ? '#E8F5E9' : 'white',
              margin: '4px 0',
              borderRadius: '2px'
            }}>
              {message}
            </div>
          ))
        )}
      </div>
    </div>
  );
}