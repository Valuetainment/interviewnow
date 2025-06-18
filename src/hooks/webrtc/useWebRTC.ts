import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

import { ConnectionState } from './useConnectionState';
import { useOpenAIConnection } from './useOpenAIConnection';
import { useTranscriptManager } from './useTranscriptManager';
import { supabase } from '@/integrations/supabase/client';

export interface WebRTCConfig {
  simulationMode?: boolean;
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
 * Main hook for WebRTC functionality - simplified to always use direct OpenAI connection
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
  const [openAIConfig, setOpenAIConfig] = useState<WebRTCConfig['openAISettings'] | null>(null);

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

  // Memoize the OpenAI settings to prevent recreation
  const openAISettings = useMemo(() => {
    return openAIConfig || config.openAISettings;
  }, [openAIConfig, config.openAISettings]);

  // Always use direct OpenAI connection with ephemeral tokens
  const openAIConnection = useOpenAIConnection(
    sessionId,
    {
      openAISettings: openAISettings,
      jobDescription: config.jobDescription,
      resume: config.resume,
      disabled: false // Always enabled
    },
    handleConnectionStateChange,
    onTranscriptUpdate
  );
  
  // Store connection in ref to avoid circular dependency
  const connectionRef = useRef(openAIConnection);
  connectionRef.current = openAIConnection;

  // Extracted status properties
  const status: WebRTCStatus = {
    connectionState: internalConnectionState,
    error: error || openAIConnection.error,
    isConnecting: openAIConnection.isConnecting,
    isConnected: openAIConnection.isConnected,
    isDisconnected: internalConnectionState === 'disconnected',
    isError: internalConnectionState === 'error' || 
             internalConnectionState === 'ice_failed' || 
             internalConnectionState === 'connection_failed',
    isReady,
    audioLevel: openAIConnection.audioLevel,
    isRecording: openAIConnection.isRecording
  };

  // Initialize the WebRTC connection
  const initialize = useCallback(async (): Promise<boolean> => {
    try {
      setIsReady(false);
      setError(null);
      
      // Clear any existing transcript data
      clearTranscript();

      console.log('Initializing WebRTC with direct OpenAI connection');
      
      // Debug log the openAI settings
      if (config.openAISettings) {
        console.log('OpenAI settings in useWebRTC:', config.openAISettings);
        console.log('Instructions present:', !!config.openAISettings.instructions);
        console.log('Instructions preview:', config.openAISettings.instructions?.substring(0, 100) + '...');
      }

      // For non-simulation mode, check if we need to call interview-start
      if (!config.simulationMode && sessionId) {
        try {
          const { data: sessionData, error: sessionError } = await supabase
            .from('interview_sessions')
            .select('id, status, tenant_id')
            .eq('id', sessionId)
            .single();

          if (sessionError || !sessionData) {
            console.error('Session query error:', sessionError);
            throw new Error('Invalid session ID');
          }

          console.log('Session data retrieved:', { id: sessionData.id, status: sessionData.status });

          // Call interview-start edge function to initialize session
          const { data: startData, error: startError } = await supabase.functions.invoke('interview-start', {
            body: {
              interview_session_id: sessionId,
              tenant_id: sessionData.tenant_id,
              architecture: 'direct-openai'
            }
          });

          console.log('interview-start response:', { data: startData, error: startError });

          if (startError || !startData?.success) {
            console.error('interview-start failed:', { startError, startData });
            throw new Error(startError?.message || startData?.error || 'Failed to start interview');
          }

          // Use OpenAI config from edge function if provided
          if (startData.openai_api_config) {
            setOpenAIConfig(startData.openai_api_config);
          }
        } catch (err) {
          console.error('Error initializing session:', err);
          setError(err.message || 'Failed to initialize session');
          return false;
        }
      }

      // Initialize the OpenAI connection using ref
      const success = await connectionRef.current.initialize();
      
      if (success) {
        setIsReady(true);
        console.log('WebRTC initialization successful');
      } else {
        setError('Failed to initialize WebRTC connection');
      }
      
      return success;
    } catch (err) {
      console.error('Error in WebRTC initialization:', err);
      setError(err.message || 'Unknown error during initialization');
      return false;
    }
  }, [sessionId, config.simulationMode, config.openAISettings, config.jobDescription, config.resume, clearTranscript]);

  // Cleanup
  const cleanup = useCallback(() => {
    console.log('Cleaning up WebRTC connections');
    
    connectionRef.current.cleanup();
    
    setIsReady(false);
    setInternalConnectionState('disconnected');
    setError(null);
    setOpenAIConfig(null);
  }, []);

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