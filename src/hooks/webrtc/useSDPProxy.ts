import { useCallback, useRef } from 'react';
import { useWebSocketConnection } from './useWebSocketConnection';
import { useWebRTCConnection } from './useWebRTCConnection';
import { ConnectionState } from './useConnectionState';
import { useTranscriptManager } from './useTranscriptManager';
import { SupabaseClient } from '@supabase/supabase-js';
import { supabase as defaultSupabaseClient } from '@/integrations/supabase/client';

export interface SDPProxyConfig {
  serverUrl: string;
  simulationMode?: boolean;
  supabaseClient?: SupabaseClient;
  disabled?: boolean;
  openAISettings?: {
    voice?: string;
    model?: string;
    instructions?: string;
  };
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
  setServerUrl: (url: string) => void;
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
  // Store the server URL in a ref so we can update it
  const serverUrlRef = useRef<string>(config.serverUrl);
  const isInitializingRef = useRef<boolean>(false);
  const ephemeralKeyRef = useRef<string | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  
  // Use provided Supabase client or default
  const supabase = config.supabaseClient || defaultSupabaseClient;

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

  // Generate ephemeral key from Fly.io proxy
  const generateEphemeralKey = useCallback(async () => {
    if (!serverUrlRef.current || !sessionIdRef.current) {
      throw new Error('Server URL and session ID are required');
    }
    
    try {
      // Extract base URL from WebSocket URL
      const baseUrl = serverUrlRef.current
        .replace('wss://', 'https://')
        .replace('ws://', 'http://')
        .replace(/\/ws.*$/, ''); // Remove WebSocket path
      
      const response = await fetch(`${baseUrl}/api/generate-ephemeral-key`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId: sessionIdRef.current,
          voice: config.openAISettings?.voice || 'alloy',
          model: config.openAISettings?.model || 'gpt-4o-realtime-preview-2024-12-17'
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate ephemeral key');
      }
      
      const data = await response.json();
      ephemeralKeyRef.current = data.client_secret;
      
      console.log('Ephemeral key generated successfully');
      return data.client_secret;
    } catch (error) {
      console.error('Error generating ephemeral key:', error);
      throw error;
    }
  }, [config.openAISettings]);

  // Handle WebSocket messages
  const handleWebSocketMessage = useCallback((message: any) => {
    try {
      switch (message.type) {
        case 'session':
          console.log('Received session message with ID:', message.sessionId);
          sessionIdRef.current = message.sessionId;

          // Now that we have the session ID, send init message
          sendWebSocketMessage({
            type: 'init',
            sessionId: sessionIdRef.current,
            simulationMode: config.simulationMode,
            client: 'webrtc-hooks',
            timestamp: new Date().toISOString()
          });

          // For simulation mode, we can just mark as connected
          if (config.simulationMode) {
            console.log('Simulation mode - marking connection as established');
            // Send a ping right away to keep connection alive
            sendWebSocketMessage({
              type: 'ping',
              timestamp: new Date().toISOString(),
              keepAlive: true
            });

            // Then mark as connected
            setTimeout(() => {
              if (onConnectionStateChange) {
                onConnectionStateChange('connected');
              }
            }, 500);
          } else {
            // Production mode - session message received, generate ephemeral key then create offer
            console.log('Production mode - session established, generating ephemeral key');
            generateEphemeralKey()
              .then(() => {
                console.log('Ephemeral key generated, creating SDP offer');
                return createAndSendOffer();
              })
              .catch(error => {
                console.error('Failed to generate ephemeral key or create offer:', error);
              });
          }
          break;

        case 'pong':
          // Handle server pong responses to keep connection alive
          console.log('Received pong from server:',
            message.timestamp ? new Date(message.timestamp).toLocaleTimeString() : 'no timestamp');
          // No need to do anything, this just confirms the connection is alive
          break;

        case 'sdp_answer':
          // Process SDP answer
          if (pcRef.current && message.answer) {
            console.log('Received SDP answer from server');
            handleAnswer(message.answer);
          }
          break;

        case 'ice_candidate':
          // Process ICE candidate from server
          if (pcRef.current && message.candidate) {
            console.log('Received ICE candidate from server');
            addIceCandidate(new RTCIceCandidate(message.candidate));
          }
          break;

        case 'transcript':
          // Process transcript update
          if (message.text) {
            console.log('TRANSCRIPT RECEIVED:', message.text);

            const speaker = message.speaker || 'unknown';
            saveTranscript(message.text, speaker);

            // Send a ping back to keep the connection alive
            sendWebSocketMessage({
              type: 'ping',
              timestamp: new Date().toISOString(),
              responseToTranscript: true
            });
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
            handleDataChannelMessage(message.dataChannel);
          }
          break;
        
        case 'ice_status':
          // OpenAI handles ICE automatically
          console.log('ICE status:', message.message);
          break;

        case 'error':
          console.error('Error from server:', message.message);
          break;
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  }, [config.simulationMode, onConnectionStateChange, pcRef, handleAnswer, addIceCandidate, saveTranscript, sendWebSocketMessage, generateEphemeralKey, createAndSendOffer]);

  // Handle data channel messages from OpenAI
  const handleDataChannelMessage = useCallback((event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data);
      console.log('OpenAI data channel event:', data.type);
      
      switch (data.type) {
        case 'response.audio_transcript.done':
          // Final transcript
          if (data.transcript) {
            saveTranscript(data.transcript, 'ai');
          }
          break;
          
        case 'response.audio_transcript.delta':
          // Incremental transcript
          if (data.delta) {
            saveTranscript(data.delta, 'ai');
          }
          break;
          
        case 'conversation.item.input_audio_transcription.completed':
          // User's speech transcript
          if (data.transcript) {
            saveTranscript(data.transcript, 'candidate');
          }
          break;
          
        case 'response.done':
          // Response completed
          console.log('OpenAI response completed');
          break;
          
        case 'error':
          console.error('OpenAI error:', data.error);
          break;
          
        default:
          console.log('Unhandled OpenAI event:', data.type);
      }
    } catch (error) {
      console.error('Error parsing data channel message:', error);
    }
  }, [saveTranscript]);

  // Create and send SDP offer to server
  const createAndSendOffer = useCallback(async () => {
    if (!pcRef.current || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.error('Cannot create offer: Peer connection or WebSocket not initialized');
      return false;
    }

    try {
      // Create data channel for OpenAI events (must be done before creating offer)
      if (!dataChannelRef.current) {
        const dc = pcRef.current.createDataChannel('oai-events', {
          ordered: true
        });
        
        dc.onopen = () => {
          console.log('OpenAI data channel opened');
          
          // Send initial configuration
          if (config.openAISettings?.instructions) {
            dc.send(JSON.stringify({
              type: 'session.update',
              session: {
                instructions: config.openAISettings.instructions,
                voice: config.openAISettings.voice || 'alloy',
                input_audio_transcription: {
                  model: 'whisper-1'
                },
                turn_detection: {
                  type: 'server_vad',
                  threshold: 0.5,
                  prefix_padding_ms: 300,
                  silence_duration_ms: 800
                }
              }
            }));
          }
        };
        
        dc.onmessage = handleDataChannelMessage;
        dc.onerror = (error) => console.error('Data channel error:', error);
        dc.onclose = () => console.log('Data channel closed');
        
        dataChannelRef.current = dc;
      }
      
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
  }, [pcRef, wsRef, createOffer, sendWebSocketMessage, config.openAISettings, handleDataChannelMessage]);

  // Initialize WebRTC session
  const initializeSession = useCallback(async (): Promise<boolean> => {
    // If disabled, don't initialize
    if (config.disabled) {
      console.log('SDPProxy is disabled, skipping initialization');
      return false;
    }

    if (isInitializingRef.current) {
      console.log('Already initializing - skipping duplicate initialization');
      return false;
    }

    isInitializingRef.current = true;

    try {
      // Check if we have a valid server URL
      if (!serverUrlRef.current && !config.simulationMode) {
        console.error('Server URL not provided. Cannot initialize without a valid WebRTC server URL.');
        isInitializingRef.current = false;
        return false;
      }
      
      // For simulation mode, bypass normal initialization
      if (config.simulationMode) {
        const simulationServerUrl = serverUrlRef.current || config.serverUrl;
        await connectWebSocket(simulationServerUrl);
        
        // In simulation mode, wait for session message to send init
        // The init message will be sent in handleWebSocketMessage when 'session' is received
        return true;
      }
      
      // Normal mode - initialize both WebSocket and WebRTC
      const wsConnected = await connectWebSocket(serverUrlRef.current);
      
      if (!wsConnected) {
        throw new Error('Failed to connect to WebSocket server');
      }
      
      // Initialize WebRTC peer connection
      const rtcInitialized = await initializeWebRTC();
      
      if (!rtcInitialized) {
        throw new Error('Failed to initialize WebRTC connection');
      }
      
      // Init message and SDP offer will be sent in handleWebSocketMessage when 'session' is received
      
      isInitializingRef.current = false;
      return true;
    } catch (error) {
      console.error('Error initializing session:', error);
      isInitializingRef.current = false;
      return false;
    } finally {
      isInitializingRef.current = false;
    }
  }, [
    config.disabled,
    config.simulationMode, 
    config.serverUrl, 
    connectWebSocket, 
    wsRef, 
    sendWebSocketMessage,
    initializeWebRTC
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
    if (!config.disabled && !isInitializingRef.current) {
      // Clean up data channel
      if (dataChannelRef.current) {
        dataChannelRef.current.close();
        dataChannelRef.current = null;
      }
      
      cleanupWebRTC();
      disconnectWebSocket();
      
      // Clear refs
      ephemeralKeyRef.current = null;
      sessionIdRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Add method to update server URL
  const setServerUrl = useCallback((url: string) => {
    console.log(`Updating SDP proxy server URL to: ${url}`);
    serverUrlRef.current = url;
  }, []);

  return {
    initialize: initializeSession,
    cleanup,
    connectionState: config.disabled ? 'disconnected' : connectionState,
    error: config.disabled ? null : error,
    isConnecting: config.disabled ? false : isRtcConnecting,
    isConnected: config.disabled ? false : (isRtcConnected && isWsConnected),
    audioLevel: config.disabled ? 0 : audioLevel,
    isRecording: config.disabled ? false : isRecording,
    setServerUrl
  };
}