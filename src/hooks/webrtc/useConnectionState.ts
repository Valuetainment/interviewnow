import { useState, useCallback } from 'react';

export type ConnectionState = 
  | 'disconnected'   // Initial state or intentional disconnect
  | 'connecting'     // Attempting to connect
  | 'ws_connected'   // WebSocket connected, WebRTC not yet established
  | 'connected'      // Fully connected
  | 'ice_disconnected' // ICE connection temporarily lost
  | 'ice_failed'     // ICE connection failed
  | 'connection_failed' // Connection failed 
  | 'error';         // Error state

export interface ConnectionStateHandlers {
  setConnectionState: (state: ConnectionState) => void;
  connectionState: ConnectionState;
  error: string | null;
  setError: (error: string | null) => void;
  isConnecting: boolean;
  setIsConnecting: (isConnecting: boolean) => void;
  isConnected: boolean;
  isDisconnected: boolean;
  isError: boolean;
}

/**
 * Hook for managing WebRTC connection state
 */
export function useConnectionState(
  onConnectionStateChange?: (state: ConnectionState) => void
): ConnectionStateHandlers {
  const [connectionState, setConnectionStateInternal] = useState<ConnectionState>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);

  // Wrapper for setConnectionState to also call the external handler
  const setConnectionState = useCallback((state: ConnectionState) => {
    setConnectionStateInternal(state);
    if (onConnectionStateChange) {
      onConnectionStateChange(state);
    }
  }, [onConnectionStateChange]);

  // Derived connection states
  const isConnected = connectionState === 'connected';
  const isDisconnected = connectionState === 'disconnected';
  const isError = connectionState === 'error' || 
                  connectionState === 'ice_failed' || 
                  connectionState === 'connection_failed';
  
  return {
    connectionState,
    setConnectionState,
    error,
    setError,
    isConnecting,
    setIsConnecting,
    isConnected,
    isDisconnected,
    isError
  };
}