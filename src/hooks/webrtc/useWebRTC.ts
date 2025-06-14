import { useState, useEffect, useCallback, useMemo } from 'react';

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
    instructions?: string;
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
  const [hybridServerUrl, setHybridServerUrl] = useState<string | null>(null);
  const [useHybridMode, setUseHybridMode] = useState(false);
  const [architectureDetermined, setArchitectureDetermined] = useState(false);
  const [hasStartedInitialization, setHasStartedInitialization] = useState(false);
  const [hybridOpenAIConfig, setHybridOpenAIConfig] = useState<WebRTCConfig['openAISettings'] | null>(null);

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
  const useDirectOpenAI = (config.openAIMode && config.openAIKey) || useHybridMode;
  
  // Use the appropriate connection implementation
  const openAIConnection = useOpenAIConnection(
    sessionId,
    {
      openAIKey: config.openAIKey,
      serverUrl: useHybridMode ? hybridServerUrl || undefined : config.serverUrl, // Use hybrid server URL when in hybrid mode
      // Use hybrid config from edge function if available, otherwise fall back to config from props
      openAISettings: useHybridMode && hybridOpenAIConfig ? hybridOpenAIConfig : config.openAISettings,
      jobDescription: config.jobDescription,
      resume: config.resume,
      // Disable until architecture is determined (unless explicitly in OpenAI mode)
      disabled: config.openAIMode ? !config.openAIKey : (!architectureDetermined || !useDirectOpenAI)
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
      supabaseClient: supabase,
      // Disable until architecture is determined AND we're not using direct OpenAI
      disabled: Boolean(config.openAIMode) || Boolean(!architectureDetermined) || Boolean(useDirectOpenAI)
    },
    handleConnectionStateChange,
    onTranscriptUpdate
  );

  // Get the current connection implementation
  const activeConnection = useMemo(
    () => useDirectOpenAI ? openAIConnection : sdpProxyConnection,
    [useDirectOpenAI, openAIConnection, sdpProxyConnection]
  );

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
      
      // For simulation or direct OpenAI mode, architecture is already determined
      if (config.simulationMode || config.openAIMode) {
        setArchitectureDetermined(true);
      }

      console.log(`Initializing WebRTC in ${useDirectOpenAI ? (useHybridMode ? 'Hybrid' : 'Direct OpenAI') : config.simulationMode ? 'Simulation' : 'SDP Proxy'} mode`);
      
      // Debug log the openAI settings
      if (config.openAISettings) {
        console.log('OpenAI settings in useWebRTC:', config.openAISettings);
        console.log('Instructions present:', !!config.openAISettings.instructions);
        console.log('Instructions preview:', config.openAISettings.instructions?.substring(0, 100) + '...');
      }

      // Get tenant ID for the current user if not in simulation or OpenAI mode
      if (!config.simulationMode && !useDirectOpenAI && !architectureDetermined) {
        try {
          const { data: tenantData, error: tenantError } = await supabase
            .from('users')
            .select('tenant_id')
            .eq('id', (await supabase.auth.getUser()).data.user?.id)
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

          // Check if we're using hybrid architecture with ephemeral tokens
          if (data.architecture === 'hybrid' && data.webrtc_server_url) {
            console.log(`Using hybrid architecture with ephemeral tokens`);
            console.log(`Server URL for tokens: ${data.webrtc_server_url}`);
            console.log(`[DEPLOYMENT VERIFICATION] New code deployed at ${new Date().toISOString()}`);
            
            // Log the OpenAI config from edge function
            if (data.openai_api_config) {
              console.log('OpenAI config from edge function:', data.openai_api_config);
              console.log('Instructions present in response:', !!data.openai_api_config.instructions);
              
              // Store the OpenAI config from edge function for hybrid mode
              setHybridOpenAIConfig(data.openai_api_config);
            }
            
            // Switch to hybrid mode using OpenAI connection with ephemeral tokens
            setHybridServerUrl(data.webrtc_server_url);
            setUseHybridMode(true);
            setArchitectureDetermined(true);
          } else if (data.webrtc_server_url) {
            // Original SDP proxy mode
            console.log(`Using server URL from edge function: ${data.webrtc_server_url}`);
            console.log(`Using VM with per-session isolation for interview ${sessionId}`);
            
            // Update the SDP proxy connection with the correct server URL
            sdpProxyConnection.setServerUrl(data.webrtc_server_url);
            setArchitectureDetermined(true);
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
      
      // Initialize the active connection if architecture has been determined
      if (architectureDetermined || config.simulationMode || config.openAIMode) {
        console.log('Architecture determined, initializing connection');
        // Initialize the active connection
        const success = await activeConnection.initialize();
        
        if (success) {
          setIsReady(true);
          return true;
        } else {
          setError('Failed to initialize WebRTC connection');
          return false;
        }
      } else {
        // Architecture will be determined by useEffect
        console.log('Waiting for architecture to be determined');
        return true;
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
    useHybridMode,
    hybridServerUrl,
    supabase,
    clearTranscript,
    sdpProxyConnection,
    activeConnection,
    architectureDetermined
  ]);

  // Clean up resources
  const cleanup = useCallback(() => {
    console.log('Cleaning up WebRTC resources');
    activeConnection.cleanup();
    setIsReady(false);
    setInternalConnectionState('disconnected');
    setError(null);
    setHasStartedInitialization(false);
    // Reset architecture state so a new interview can properly initialize
    setArchitectureDetermined(false);
    setUseHybridMode(false);
    setHybridServerUrl(null);
    setHybridOpenAIConfig(null);
  }, [activeConnection]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Initialize connection after architecture is determined
  useEffect(() => {
    if (architectureDetermined && !hasStartedInitialization && !isReady && !error) {
      console.log('Architecture determined, initializing connection automatically');
      setHasStartedInitialization(true);
      // Create an async function to call initialize
      const doInitialize = async () => {
        await initialize();
      };
      doInitialize();
    }
  }, [architectureDetermined]); // Only depend on architectureDetermined to avoid infinite loops

  return {
    initialize,
    cleanup,
    status
  };
}