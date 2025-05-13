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
    }

    // Start new interval
    heartbeatIntervalRef.current = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        sendMessage({ type: 'ping', timestamp: new Date().toISOString() });
      } else {
        // Stop heartbeat if connection is closed
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
          heartbeatIntervalRef.current = null;
        }
      }
    }, wsConfig.heartbeatInterval);
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

    console.log(`Attempting to connect to WebSocket server at: ${url}`);
    setConnectionState('connecting');
    setIsConnecting(true);

    try {
      // Close any existing connection
      disconnect();

      // Create new WebSocket connection
      console.log(`Creating new WebSocket connection to ${url}`);
      const ws = new WebSocket(url);
      wsRef.current = ws;

      // Set up connection promise
      const connectionPromise = new Promise<boolean>((resolve, reject) => {
        const openTimeout = setTimeout(() => {
          reject(new Error('WebSocket connection timeout'));
        }, 10000); // 10 second timeout

        // Connection opened
        ws.onopen = () => {
          clearTimeout(openTimeout);
          console.log('WebSocket successfully connected to:', url);
          setConnectionState('ws_connected');
          setIsConnecting(false);
          resetRetryCount();

          // Start heartbeat
          startHeartbeat();

          // Send initialization message for simulation mode
          if (wsConfig.simulationMode) {
            console.log('WebSocket in simulation mode - sending simplified init');
            sendMessage({
              type: 'init',
              sessionId: 'simulation-session',
              simulationMode: true,
              client: 'test-client',
              timestamp: new Date().toISOString()
            });
          }

          resolve(true);
        };

        // Connection error
        ws.onerror = (error) => {
          clearTimeout(openTimeout);
          console.error('WebSocket error:', error);
          setError(`WebSocket connection error to ${url}. Check if the server is running on this address.`);
          setConnectionState('error');
          setIsConnecting(false);

          if (!hasExceededMaxRetries) {
            scheduleRetry(() => connect(url));
          }

          reject(error);
        };

        // Connection closed
        ws.onclose = (event) => {
          clearTimeout(openTimeout);
          console.log(`WebSocket disconnected (code: ${event.code}, reason: ${event.reason})`);
          setConnectionState('disconnected');

          // Try to reconnect if not closed intentionally (code 1000) and we haven't exceeded the retry limit
          if (event.code !== 1000 && !hasExceededMaxRetries) {
            console.log(`WebSocket closed unexpectedly, will retry`);
            scheduleRetry(() => connect(url));
          }

          if (event.code !== 1000 && !connectionState.includes('connected')) {
            reject(new Error(`WebSocket closed with code ${event.code}: ${event.reason}`));
          }
        };
      });

      // Set message handler
      ws.onmessage = handleWebSocketMessage;

      // Wait for connection to complete
      await connectionPromise;
      return true;
    } catch (error) {
      console.error('Error connecting to WebSocket server:', error);
      setError(`Failed to connect to WebSocket server: ${error instanceof Error ? error.message : 'Unknown error'}`);
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