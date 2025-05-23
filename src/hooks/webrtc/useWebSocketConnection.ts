import { useRef, useCallback, useEffect } from 'react';
import { useConnectionState, ConnectionState } from './useConnectionState';
import { useRetry } from './useRetry';

export interface WebSocketConfig {
  heartbeatInterval?: number;
  simulationMode?: boolean;
}

export interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

export interface WebSocketConnectionHandlers {
  wsRef: React.MutableRefObject<WebSocket | null>;
  connect: (url: string) => Promise<boolean>;
  disconnect: () => void;
  sendMessage: (message: WebSocketMessage) => boolean;
  connectionState: ConnectionState;
  error: string | null;
  isConnecting: boolean;
  isConnected: boolean;
  isDisconnected: boolean;
  isError: boolean;
}

const DEFAULT_CONFIG: WebSocketConfig = {
  heartbeatInterval: 15000, // 15 seconds
  simulationMode: false
};

/**
 * Hook for managing WebSocket connection
 */
export function useWebSocketConnection(
  config: Partial<WebSocketConfig> = {},
  onConnectionStateChange?: (state: ConnectionState) => void,
  onMessage?: (message: WebSocketMessage) => void
): WebSocketConnectionHandlers {
  // Merge provided config with defaults
  const wsConfig: WebSocketConfig = {
    ...DEFAULT_CONFIG,
    ...config
  };

  // State management hooks
  const {
    connectionState,
    setConnectionState,
    error,
    setError,
    isConnecting,
    setIsConnecting,
    isConnected,
    isDisconnected,
    isError
  } = useConnectionState(onConnectionStateChange);

  const {
    retryCount,
    scheduleRetry,
    resetRetryCount,
    hasExceededMaxRetries
  } = useRetry();

  // References
  const wsRef = useRef<WebSocket | null>(null);
  const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clean up WebSocket resources
  const disconnect = useCallback(() => {
    console.log('Cleaning up WebSocket connection...');

    // Clear heartbeat interval
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }

    // Close WebSocket with clean code
    if (wsRef.current) {
      // Use a clean 1000 code to prevent reconnection attempts
      wsRef.current.close(1000, "Intentional disconnect");
      wsRef.current = null;
    }

    // Reset connection state
    setConnectionState('disconnected');
  }, [setConnectionState]);

  // Send a message over the WebSocket
  const sendMessage = useCallback((message: WebSocketMessage): boolean => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.error('Cannot send message: WebSocket not connected');
      return false;
    }

    try {
      wsRef.current.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('Error sending WebSocket message:', error);
      return false;
    }
  }, []);

  // Start heartbeat to keep connection alive
  const startHeartbeat = useCallback(() => {
    // Clear any existing interval
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }

    // Make the heartbeat more frequent - every 5 seconds instead of 15
    const heartbeatInterval = Math.min(wsConfig.heartbeatInterval || 15000, 5000);
    console.log(`Starting WebSocket heartbeat with interval: ${heartbeatInterval}ms`);

    // Start new interval
    heartbeatIntervalRef.current = setInterval(() => {
      if (wsRef.current) {
        if (wsRef.current.readyState === WebSocket.OPEN) {
          console.log('Sending heartbeat ping...');
          const pingSuccess = sendMessage({
            type: 'ping',
            timestamp: new Date().toISOString(),
            keepAlive: true  // Add flag to indicate this is a keep-alive message
          });
          console.log('Heartbeat ping sent:', pingSuccess);
        } else {
          console.log(`WebSocket not open, current state: ${wsRef.current.readyState}`);
          // If connection is closing or closed, try to reconnect
          if (wsRef.current.readyState >= 2) { // CLOSING or CLOSED
            console.log('WebSocket is closing or closed - stopping heartbeat');
            if (heartbeatIntervalRef.current) {
              clearInterval(heartbeatIntervalRef.current);
              heartbeatIntervalRef.current = null;
            }
          }
        }
      } else {
        // Stop heartbeat if websocket ref is null
        console.log('WebSocket reference is null - stopping heartbeat');
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
          heartbeatIntervalRef.current = null;
        }
      }
    }, heartbeatInterval);

    // Send an immediate ping to establish communication
    setTimeout(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        console.log('Sending immediate ping after connection...');
        sendMessage({
          type: 'ping',
          timestamp: new Date().toISOString(),
          initialPing: true
        });
      }
    }, 100); // Send right after connection
  }, [wsConfig.heartbeatInterval, sendMessage]);

  // Handle incoming WebSocket messages
  const handleWebSocketMessage = useCallback((event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data);

      // Skip logging for heartbeat messages to reduce console noise
      if (data.type !== 'ping' && data.type !== 'pong') {
        console.log('WebSocket message received:', data.type);
      }

      // Handle ping messages automatically
      if (data.type === 'ping') {
        sendMessage({ type: 'pong', timestamp: new Date().toISOString() });
      }

      // Forward message to handler if provided
      if (onMessage) {
        onMessage(data);
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  }, [onMessage, sendMessage]);

  // Connect to WebSocket server
  const connect = useCallback(async (url: string): Promise<boolean> => {
    if (!url) {
      setError('No WebSocket server URL provided');
      return false;
    }

    // Ensure simulation parameter is present for testing
    if (wsConfig.simulationMode && !url.includes('simulation=')) {
      console.warn('Adding simulation=true parameter to WebSocket URL');
      url += (url.includes('?') ? '&' : '?') + 'simulation=true';
    }

    console.log(`Attempting to connect to WebSocket server at: ${url}`);
    setConnectionState('connecting');
    setIsConnecting(true);
    setError(null); // Clear any previous errors

    try {
      // Close any existing connection
      disconnect();

      // Added delay to ensure previous cleanup completes
      await new Promise(resolve => setTimeout(resolve, 100));

      // Create new WebSocket connection with detailed logging
      console.log(`Creating new WebSocket connection to ${url}`);

      let ws: WebSocket;
      try {
        ws = new WebSocket(url);
        console.log('WebSocket constructor executed successfully');
      } catch (wsError) {
        console.error('Failed to create WebSocket instance:', wsError);
        throw new Error(`Failed to create WebSocket: ${wsError instanceof Error ? wsError.message : 'Unknown error'}`);
      }

      wsRef.current = ws;

      // Debug WebSocket connection status
      console.log(`Initial WebSocket readyState: ${ws.readyState}`);
      console.log('CONNECTING=0, OPEN=1, CLOSING=2, CLOSED=3');

      // Set up connection promise
      const connectionPromise = new Promise<boolean>((resolve, reject) => {
        // Add generous timeout for connection
        const openTimeout = setTimeout(() => {
          console.error(`WebSocket connection timeout after 10 seconds`);
          reject(new Error('WebSocket connection timeout after 10 seconds'));
        }, 10000); // 10 second timeout

        // Connection opened
        ws.onopen = () => {
          clearTimeout(openTimeout);
          console.log('🟢 WebSocket successfully connected to:', url);
          console.log(`WebSocket readyState after connection: ${ws.readyState}`);
          setConnectionState('ws_connected');
          setIsConnecting(false);
          resetRetryCount();

          // Start heartbeat
          startHeartbeat();

          // Send initialization message for simulation mode
          if (wsConfig.simulationMode) {
            console.log('WebSocket in simulation mode - sending simplified init');

            const initSuccess = sendMessage({
              type: 'init',
              sessionId: 'simulation-session',
              simulationMode: true,
              client: 'test-client',
              timestamp: new Date().toISOString()
            });

            console.log('Init message sent successfully:', initSuccess);

            // Also send a ping to test the connection
            setTimeout(() => {
              if (wsRef.current?.readyState === WebSocket.OPEN) {
                console.log('Sending test ping message');
                sendMessage({ type: 'ping', timestamp: new Date().toISOString() });
              }
            }, 500);
          }

          resolve(true);
        };

        // Connection error
        ws.onerror = (error) => {
          clearTimeout(openTimeout);
          console.error('🔴 WebSocket error:', error);

          // Extract more detailed error info if available
          let errorMessage = 'WebSocket connection error';
          if (error && (error as any).message) {
            errorMessage = (error as any).message;
          }

          setError(`WebSocket connection error to ${url}. Check if the server is running on this address. Error: ${errorMessage}`);
          setConnectionState('error');
          setIsConnecting(false);

          if (!hasExceededMaxRetries) {
            console.log(`Will retry connection in ${Math.pow(2, retryCount)} seconds`);
            scheduleRetry(() => connect(url));
          }

          reject(error);
        };

        // Connection closed
        ws.onclose = (event) => {
          clearTimeout(openTimeout);
          console.log(`WebSocket disconnected (code: ${event.code}, reason: ${event.reason || 'No reason provided'})`);
          setConnectionState('disconnected');

          // Log additional context for debugging
          console.log(`Close event wasClean: ${event.wasClean}`);

          // Try to reconnect if not closed intentionally (code 1000) and we haven't exceeded the retry limit
          if (event.code !== 1000 && !hasExceededMaxRetries) {
            console.log(`WebSocket closed unexpectedly with code ${event.code}, will retry`);
            scheduleRetry(() => connect(url));
          }

          if (event.code !== 1000 && !connectionState.includes('connected')) {
            reject(new Error(`WebSocket closed with code ${event.code}: ${event.reason || 'Connection closed'}`));
          }
        };
      });

      // Set message handler
      ws.onmessage = handleWebSocketMessage;

      // Wait for connection to complete
      console.log('Waiting for WebSocket connection to complete...');
      await connectionPromise;
      console.log('WebSocket connection established successfully');
      return true;
    } catch (error) {
      console.error('Error connecting to WebSocket server:', error);
      // Provide more specific error message based on the error type
      let errorMessage = 'Unknown error';

      if (error instanceof Error) {
        errorMessage = error.message;
        // Add more context for specific error types
        if (errorMessage.includes('timeout')) {
          errorMessage = `Connection timed out. Server at ${url} is not responding.`;
        } else if (errorMessage.includes('Failed to construct')) {
          errorMessage = `Invalid WebSocket URL format: ${url}`;
        }
      }

      setError(`Failed to connect to WebSocket server: ${errorMessage}`);
      setConnectionState('error');
      setIsConnecting(false);
      return false;
    }
  }, [
    disconnect, 
    setConnectionState, 
    setIsConnecting, 
    setError, 
    startHeartbeat, 
    sendMessage, 
    handleWebSocketMessage,
    wsConfig.simulationMode,
    resetRetryCount,
    hasExceededMaxRetries,
    scheduleRetry,
    connectionState
  ]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    wsRef,
    connect,
    disconnect,
    sendMessage,
    connectionState,
    error,
    isConnecting,
    isConnected,
    isDisconnected,
    isError
  };
}