import { useState, useEffect, useCallback } from 'react';
import { ConnectionState } from './useConnectionState';
import { useSDPProxy } from './useSDPProxy';
import { useOpenAIConnection } from './useOpenAIConnection';
import { useTranscriptManager } from './useTranscriptManager';
import { supabase } from '@/integrations/supabase/client';

export interface WebRTCConfig {
  serverUrl?: string;
  simulationMode?: boolean;
  openAIMode?: boolean;
  openAIKey?: string;
  jobDescription?: string;
  resume?: string;
  openAISettings?: {
    voice?: string;
    temperature?: number;
    maximumLength?: number;
  };
}

export interface WebRTCStatus {
  connectionState: ConnectionState;
  error: string | null;
  isConnecting: boolean;
  isConnected: boolean;
  isDisconnected: boolean;
  isError: boolean;
  isReady: boolean;
  audioLevel: number;
  isRecording: boolean;
}

export interface WebRTCHandlers {
  initialize: () => Promise<boolean>;
  cleanup: () => void;
  status: WebRTCStatus;
}

/**
 * Main hook for WebRTC functionality that orchestrates all the specialized hooks
 */
export function useWebRTC(
  sessionId: string,
  config: WebRTCConfig = {},
  onConnectionStateChange?: (state: ConnectionState) => void,
  onTranscriptUpdate?: (text: string) => void
): WebRTCHandlers {
  // State
  const [isReady, setIsReady] = useState(false);
  const [internalConnectionState, setInternalConnectionState] = useState<ConnectionState>('disconnected');
  const [error, setError] = useState<string | null>(null);

  // Use transcript manager
  const { clearTranscript } = useTranscriptManager({
    sessionId,
    onTranscriptUpdate,
    supabaseClient: supabase
  });

  // Connection state change handler
  const handleConnectionStateChange = useCallback((state: ConnectionState) => {
    setInternalConnectionState(state);
    
    if (onConnectionStateChange) {
      onConnectionStateChange(state);
    }
  }, [onConnectionStateChange]);

  // Determine which connection implementation to use
  const useDirectOpenAI = config.openAIMode && config.openAIKey;
  
  // Use the appropriate connection implementation
  const openAIConnection = useOpenAIConnection(
    sessionId,
    {
      openAIKey: config.openAIKey || '',
      openAISettings: config.openAISettings,
      jobDescription: config.jobDescription,
      resume: config.resume
    },
    handleConnectionStateChange,
    onTranscriptUpdate
  );
  
  const sdpProxyConnection = useSDPProxy(
    sessionId,
    {
      // SECURITY FIX: Don't use the hardcoded URL if we're in a real session (non-simulation)
      // This avoids the dependency on the suspended service
      serverUrl: config.simulationMode 
        ? (config.serverUrl || 'wss://interview-sdp-proxy.fly.dev/ws')
        : (config.serverUrl || ''), // Will be populated from edge function response
      simulationMode: config.simulationMode,
      supabaseClient: supabase
    },
    handleConnectionStateChange,
    onTranscriptUpdate
  );

  // Get the current connection implementation
  const activeConnection = useDirectOpenAI ? openAIConnection : sdpProxyConnection;

  // Extracted status properties
  const status: WebRTCStatus = {
    connectionState: internalConnectionState,
    error: error || activeConnection.error,
    isConnecting: activeConnection.isConnecting,
    isConnected: activeConnection.isConnected,
    isDisconnected: internalConnectionState === 'disconnected',
    isError: internalConnectionState === 'error' || 
             internalConnectionState === 'ice_failed' || 
             internalConnectionState === 'connection_failed',
    isReady,
    audioLevel: activeConnection.audioLevel,
    isRecording: activeConnection.isRecording
  };

  // Initialize the WebRTC connection
  const initialize = useCallback(async (): Promise<boolean> => {
    try {
      setIsReady(false);
      setError(null);
      
      // Clear any existing transcript data
      clearTranscript();

      // Check if OpenAI direct mode is requested but key is missing
      if (config.openAIMode && !config.openAIKey) {
        throw new Error('OpenAI API key is required for direct OpenAI mode');
      }

      console.log(`Initializing WebRTC in ${useDirectOpenAI ? 'Direct OpenAI' : config.simulationMode ? 'Simulation' : 'SDP Proxy'} mode`);

      // Get tenant ID for the current user if not in simulation or OpenAI mode
      if (!config.simulationMode && !useDirectOpenAI) {
        try {
          const { data: tenantData, error: tenantError } = await supabase
            .from('tenant_users')
            .select('tenant_id')
            .single();

          if (tenantError) {
            throw new Error('Failed to get tenant ID');
          }

          // Call interview-start Edge Function to initialize WebRTC session
          const { data, error: functionError } = await supabase.functions.invoke('interview-start', {
            body: JSON.stringify({
              interview_session_id: sessionId,
              tenant_id: tenantData.tenant_id,
              // Default to hybrid architecture unless explicitly set otherwise
              architecture: 'hybrid'
            })
          });

          if (functionError) {
            throw new Error(`Failed to initialize interview: ${functionError.message}`);
          }

          if (!data.success) {
            throw new Error(data.error || 'Unknown error initializing interview');
          }

          // Use the server URL provided by the edge function
          if (data.webrtc_server_url) {
            console.log(`Using server URL from edge function: ${data.webrtc_server_url}`);
            console.log(`Using VM with per-session isolation for interview ${sessionId}`);
            
            // Update the SDP proxy connection with the correct server URL
            sdpProxyConnection.setServerUrl(data.webrtc_server_url);
          } else {
            throw new Error('Missing WebRTC server URL from edge function');
          }

          // Update interview session status in database
          const { error: updateError } = await supabase
            .from('interview_sessions')
            .update({ status: 'in_progress' })
            .eq('id', sessionId);

          if (updateError) {
            console.error('Failed to update interview status:', updateError);
          }
        } catch (error) {
          console.error('Error initializing interview session:', error);
          setError(error instanceof Error ? error.message : 'Failed to initialize interview session');
          return false;
        }
      }

      // Initialize the active connection
      const success = await activeConnection.initialize();
      
      if (success) {
        setIsReady(true);
        return true;
      } else {
        setError('Failed to initialize WebRTC connection');
        return false;
      }
    } catch (error) {
      console.error('Error initializing WebRTC:', error);
      setError(error instanceof Error ? error.message : 'Unknown error initializing WebRTC');
      return false;
    }
  }, [
    sessionId,
    config.openAIMode,
    config.openAIKey,
    config.simulationMode,
    useDirectOpenAI,
    supabase,
    activeConnection,
    clearTranscript,
    sdpProxyConnection
  ]);

  // Clean up resources
  const cleanup = useCallback(() => {
    console.log('Cleaning up WebRTC resources');
    activeConnection.cleanup();
    setIsReady(false);
    setInternalConnectionState('disconnected');
    setError(null);
  }, [activeConnection]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    initialize,
    cleanup,
    status
  };
}