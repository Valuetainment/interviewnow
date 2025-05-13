import { useCallback } from 'react';
import { useWebSocketConnection } from './useWebSocketConnection';
import { useWebRTCConnection } from './useWebRTCConnection';
import { ConnectionState } from './useConnectionState';
import { useTranscriptManager } from './useTranscriptManager';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface SDPProxyConfig {
  serverUrl: string;
  simulationMode?: boolean;
  supabaseClient?: SupabaseClient;
}

export interface SDPProxyHandlers {
  initialize: () => Promise<boolean>;
  cleanup: () => void;
  connectionState: ConnectionState;
  error: string | null;
  isConnecting: boolean;
  isConnected: boolean;
  audioLevel: number;
  isRecording: boolean;
}

/**
 * Hook for managing WebRTC connections through an SDP proxy
 */
export function useSDPProxy(
  sessionId: string,
  config: SDPProxyConfig,
  onConnectionStateChange?: (state: ConnectionState) => void,
  onTranscriptUpdate?: (text: string) => void
): SDPProxyHandlers {
  // Create or use provided Supabase client
  const supabase = config.supabaseClient || createClient(
    import.meta.env.VITE_SUPABASE_URL || '',
    import.meta.env.VITE_SUPABASE_ANON_KEY || ''
  );

  // Use transcript manager
  const { saveTranscript } = useTranscriptManager({
    sessionId,
    onTranscriptUpdate,
    supabaseClient: supabase
  });

  // Use WebSocket connection
  const {
    wsRef,
    connect: connectWebSocket,
    disconnect: disconnectWebSocket,
    sendMessage: sendWebSocketMessage,
    connectionState: wsConnectionState,
    error: wsError,
    isConnected: isWsConnected
  } = useWebSocketConnection(
    {
      simulationMode: config.simulationMode,
      heartbeatInterval: 15000 // 15 seconds
    },
    // Pass connection state changes to parent
    (state) => {
      if (onConnectionStateChange && state !== 'connected') {
        onConnectionStateChange(state);
      }
    },
    // Handle WebSocket messages
    (message) => handleWebSocketMessage(message)
  );

  // Use WebRTC connection
  const {
    pcRef,
    createOffer,
    handleAnswer,
    addIceCandidate,
    initialize: initializeWebRTC,
    cleanup: cleanupWebRTC,
    connectionState: rtcConnectionState,
    error: rtcError,
    isConnecting: isRtcConnecting,
    isConnected: isRtcConnected,
    audioLevel,
    isRecording
  } = useWebRTCConnection(
    {
      simulationMode: config.simulationMode
    },
    // Pass connection state changes to parent
    (state) => {
      if (onConnectionStateChange && state === 'connected') {
        onConnectionStateChange(state);
      }
    },
    // Handle incoming tracks
    (track, streams) => {
      if (track.kind === 'audio') {
        console.log('Received audio track from proxy');
        const audioElement = new Audio();
        audioElement.srcObject = streams[0];
        audioElement.play().catch(error => console.error('Error playing audio:', error));
      }
    }
  );

  // Handle WebSocket messages
  const handleWebSocketMessage = useCallback((message: any) => {
    try {
      switch (message.type) {
        case 'session':
          console.log('Received session message with ID:', message.sessionId);
          
          // For simulation mode, we can just mark as connected
          if (config.simulationMode) {
            setTimeout(() => {
              if (onConnectionStateChange) {
                onConnectionStateChange('connected');
              }
            }, 500);
          }
          break;

        case 'sdp_answer':
          // Process SDP answer
          if (pcRef.current && message.answer) {
            handleAnswer(message.answer);
          }
          break;

        case 'ice_candidate':
          // Process ICE candidate from server
          if (pcRef.current && message.candidate) {
            addIceCandidate(new RTCIceCandidate(message.candidate));
          }
          break;

        case 'transcript':
          // Process transcript update
          if (message.text) {
            console.log('TRANSCRIPT RECEIVED:', message.text);
            
            const speaker = message.speaker || 'unknown';
            saveTranscript(message.text, speaker);
          }
          break;

        // OpenAI WebRTC specific messages
        case 'conversation.item.input_audio_transcription.completed':
          // Process user speech transcript
          if (message.transcript) {
            saveTranscript(message.transcript, 'candidate');
          }
          break;

        case 'response.audio_transcript.delta':
          // Process AI speech transcript
          if (message.text && message.text.trim()) {
            saveTranscript(message.text, 'ai');
          }
          break;

        case 'dataChannel':
          // Handle DataChannel message (for hybrid architecture)
          if (message.dataChannel) {
            console.log('Received dataChannel message:', message.dataChannel);
          }
          break;

        case 'error':
          console.error('Error from server:', message.message);
          break;
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  }, [config.simulationMode, onConnectionStateChange, pcRef, handleAnswer, addIceCandidate, saveTranscript]);

  // Create and send SDP offer to server
  const createAndSendOffer = useCallback(async () => {
    if (!pcRef.current || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.error('Cannot create offer: Peer connection or WebSocket not initialized');
      return false;
    }

    try {
      // Create offer
      const offer = await createOffer();
      
      if (!offer) {
        throw new Error('Failed to create offer');
      }

      // Send offer to server
      sendWebSocketMessage({
        type: 'sdp_offer',
        offer: offer
      });
      
      return true;
    } catch (error) {
      console.error('Error creating and sending offer:', error);
      return false;
    }
  }, [pcRef, wsRef, createOffer, sendWebSocketMessage]);

  // Initialize WebRTC session
  const initializeSession = useCallback(async (): Promise<boolean> => {
    try {
      // For simulation mode, bypass normal initialization
      if (config.simulationMode) {
        await connectWebSocket(config.serverUrl);
        
        // In simulation mode, send init message and bypass WebRTC
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          sendWebSocketMessage({
            type: 'init',
            sessionId,
            simulationMode: true,
            client: 'webrtc-hooks',
            timestamp: new Date().toISOString()
          });
          
          // Skip WebRTC initialization in simulation mode
          return true;
        }
        
        return false;
      }
      
      // Normal mode - initialize both WebSocket and WebRTC
      const wsConnected = await connectWebSocket(config.serverUrl);
      
      if (!wsConnected) {
        throw new Error('Failed to connect to WebSocket server');
      }
      
      // Initialize WebRTC peer connection
      const rtcInitialized = await initializeWebRTC();
      
      if (!rtcInitialized) {
        throw new Error('Failed to initialize WebRTC connection');
      }
      
      // Send initialization message
      sendWebSocketMessage({
        type: 'init',
        sessionId,
        simulationMode: false
      });
      
      // Create and send SDP offer
      const offerSent = await createAndSendOffer();
      
      if (!offerSent) {
        throw new Error('Failed to send SDP offer');
      }
      
      return true;
    } catch (error) {
      console.error('Error initializing session:', error);
      return false;
    }
  }, [
    config.simulationMode, 
    config.serverUrl, 
    sessionId, 
    connectWebSocket, 
    wsRef, 
    sendWebSocketMessage,
    initializeWebRTC,
    createAndSendOffer
  ]);

  // Set up ICE candidate event handler for sending candidates to server
  useCallback(() => {
    if (pcRef.current) {
      pcRef.current.onicecandidate = (event) => {
        if (event.candidate && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          // Send ICE candidate to server
          sendWebSocketMessage({
            type: 'ice_candidate',
            candidate: event.candidate
          });
        }
      };
    }
  }, [pcRef, wsRef, sendWebSocketMessage]);

  // Get combined connection state
  const connectionState: ConnectionState = 
    isRtcConnected ? 'connected' : 
    isWsConnected ? 'ws_connected' : 
    rtcConnectionState;
  
  // Get combined error
  const error = rtcError || wsError;

  // Clean up resources
  const cleanup = useCallback(() => {
    cleanupWebRTC();
    disconnectWebSocket();
  }, [cleanupWebRTC, disconnectWebSocket]);

  return {
    initialize: initializeSession,
    cleanup,
    connectionState,
    error,
    isConnecting: isRtcConnecting,
    isConnected: isRtcConnected && isWsConnected,
    audioLevel,
    isRecording
  };
}