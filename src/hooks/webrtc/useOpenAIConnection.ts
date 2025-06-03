import { useCallback } from 'react';
import { useWebRTCConnection } from './useWebRTCConnection';
import { ConnectionState } from './useConnectionState';
import { useTranscriptManager } from './useTranscriptManager';

export interface OpenAIConnectionConfig {
  openAIKey?: string; // Now optional - only used if serverUrl is not provided
  serverUrl?: string; // URL to fetch ephemeral token from
  openAISettings?: {
    voice?: string;
    temperature?: number;
    maximumLength?: number;
  };
  jobDescription?: string;
  resume?: string;
  disabled?: boolean;
}

export interface OpenAIConnectionHandlers {
  initialize: () => Promise<boolean>;
  cleanup: () => void;
  connectionState: ConnectionState;
  error: string | null;
  isConnecting: boolean;
  isConnected: boolean;
  audioLevel: number;
  isRecording: boolean;
}

const DEFAULT_SETTINGS = {
  voice: 'alloy',
  temperature: 0.7,
  maximumLength: 5
};

/**
 * Hook for managing direct OpenAI WebRTC connections
 */
export function useOpenAIConnection(
  sessionId: string,
  config: OpenAIConnectionConfig,
  onConnectionStateChange?: (state: ConnectionState) => void,
  onTranscriptUpdate?: (text: string) => void
): OpenAIConnectionHandlers {
  // Settings with defaults
  const settings = {
    ...DEFAULT_SETTINGS,
    ...(config.openAISettings || {})
  };

  // Use the transcript manager
  const { saveTranscript } = useTranscriptManager({
    sessionId,
    onTranscriptUpdate
  });

  // Use WebRTC connection with audio handling
  const {
    pcRef,
    dataChannelRef,
    initialize: initializeWebRTC,
    cleanup,
    connectionState,
    error,
    isConnecting,
    isConnected,
    isDisconnected,
    isError,
    audioLevel,
    isRecording
  } = useWebRTCConnection(
    {}, // Use default config
    onConnectionStateChange,
    // Handle incoming tracks
    (track, streams) => {
      if (track.kind === 'audio') {
        console.log('Received audio track from OpenAI');
        const audioElement = new Audio();
        audioElement.srcObject = streams[0];
        audioElement.play().catch(error => console.error('Error playing audio:', error));
      }
    }
  );

  // Handle incoming data channel messages from OpenAI
  const handleDataChannelMessage = useCallback((event: MessageEvent) => {
    try {
      const message = JSON.parse(event.data);
      console.log('Received OpenAI data channel message type:', message.type);

      // Handle different message types
      switch (message.type) {
        case 'conversation.item.input_audio_transcription.completed':
          // Process user speech transcript
          if (message.transcript) {
            console.log('User transcript:', message.transcript);
            saveTranscript(message.transcript, 'candidate');
          }
          break;

        case 'response.audio_transcript.delta':
          // Process AI speech transcript
          if (message.text && message.text.trim()) {
            console.log('AI transcript delta:', message.text);
            saveTranscript(message.text, 'ai');
          }
          break;

        case 'response.function_call_arguments.done':
          // Handle function call completion if we added functions
          console.log('Function call completed:', message.name);
          break;
      }
    } catch (error) {
      console.error('Error parsing data channel message:', error);
    }
  }, [saveTranscript]);

  // Configure the OpenAI session
  const configureOpenAISession = useCallback(() => {
    if (!dataChannelRef.current) return;

    console.log('OpenAI data channel open - sending session configuration');

    // Configure the interview session
    const sessionConfig = {
      type: 'session.update',
      session: {
        instructions: `You are an AI technical interviewer conducting an interview for a ${config.jobDescription || 'software engineering position'}.
                     The candidate has submitted a resume indicating: ${config.resume || 'they have experience in web development'}.
                     Ask challenging but fair technical questions, evaluate their responses,
                     and provide constructive feedback. Be conversational but professional.`,
        voice: settings.voice,
        temperature: settings.temperature,
        input_audio_transcription: { model: 'whisper-1' },
        turn_detection: {
          type: 'server_vad',
          threshold: 0.5,
          silence_duration_ms: 800,
          create_response: true,
          interrupt_response: true
        }
      }
    };

    // Send configuration
    dataChannelRef.current.send(JSON.stringify(sessionConfig));
    console.log('Sent session configuration to OpenAI');

    // Start the interview after a short delay
    setTimeout(() => {
      if (dataChannelRef.current) {
        dataChannelRef.current.send(JSON.stringify({
          type: 'response.create',
          response: {
            modalities: ['text', 'audio'],
            instructions: 'Introduce yourself as an AI interviewer for a technical position, and ask the candidate to introduce themselves and their background in software development.'
          }
        }));
        console.log('Started interview with OpenAI');
      }
    }, 1000);
  }, [config.jobDescription, config.resume, settings]);

  // Initialize direct OpenAI connection
  const initialize = useCallback(async (): Promise<boolean> => {
    // If disabled, don't initialize
    if (config.disabled) {
      console.log('OpenAIConnection is disabled, skipping initialization');
      return false;
    }

    // Check if we have a server URL for ephemeral tokens or an API key
    if (!config.serverUrl && !config.openAIKey) {
      console.error('Either serverUrl (for ephemeral tokens) or openAIKey is required');
      return false;
    }

    try {
      // Initialize WebRTC
      await initializeWebRTC();

      if (!pcRef.current) {
        throw new Error('Failed to initialize WebRTC connection');
      }

      // Create a data channel for OpenAI control messages
      const dataChannel = pcRef.current.createDataChannel('oai-events');
      dataChannelRef.current = dataChannel;

      // Set up data channel event handlers
      dataChannel.onopen = configureOpenAISession;
      dataChannel.onmessage = handleDataChannelMessage;
      dataChannel.onerror = (error) => console.error('Data channel error:', error);
      dataChannel.onclose = () => console.log('Data channel closed');

      // Create offer
      const offer = await pcRef.current.createOffer();
      await pcRef.current.setLocalDescription(offer);

      console.log('Created local SDP offer');

      // Wait for ICE candidates to be gathered
      await new Promise<void>(resolve => {
        if (pcRef.current?.iceGatheringState === 'complete') {
          resolve();
        } else if (pcRef.current) {
          pcRef.current.onicegatheringstatechange = () => {
            if (pcRef.current?.iceGatheringState === 'complete') {
              resolve();
            }
          };
        } else {
          resolve(); // Resolve anyway to prevent hanging
        }
      });

      console.log('ICE gathering complete');

      let authToken: string;
      let model = 'gpt-4o-realtime-preview-2024-12-17';

      // If we have a server URL, fetch ephemeral token
      if (config.serverUrl) {
        console.log('Fetching ephemeral token from server...');
        
        // Extract base URL from WebSocket URL (remove protocol and query params)
        let baseUrl = config.serverUrl;
        if (baseUrl.startsWith('wss://') || baseUrl.startsWith('ws://')) {
          baseUrl = baseUrl.replace(/^wss?:\/\//, 'https://');
        }
        // Remove query parameters
        const urlParts = baseUrl.split('?');
        baseUrl = urlParts[0];
        
        console.log(`Fetching token from: ${baseUrl}/api/realtime/sessions`);
        
        const tokenResponse = await fetch(`${baseUrl}/api/realtime/sessions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: model,
            voice: settings.voice || 'alloy'
          })
        });

        if (!tokenResponse.ok) {
          const errorText = await tokenResponse.text();
          throw new Error(`Failed to get ephemeral token (${tokenResponse.status}): ${errorText}`);
        }

        const tokenData = await tokenResponse.json();
        
        if (!tokenData.client_secret?.value) {
          throw new Error('Invalid token response from server');
        }

        authToken = tokenData.client_secret.value;
        
        // Use the model from the response if provided
        if (tokenData.model) {
          model = tokenData.model;
        }
        
        console.log('Successfully obtained ephemeral token');
      } else {
        // Fallback to direct API key (not recommended for production)
        console.warn('Using API key directly - this is not recommended for production');
        authToken = config.openAIKey!;
      }

      // Send offer to OpenAI Realtime API with appropriate auth
      const response = await fetch(`https://api.openai.com/v1/realtime?model=${model}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/sdp'
        },
        body: pcRef.current.localDescription?.sdp
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI API error (${response.status}): ${errorText}`);
      }

      // Get SDP answer from OpenAI
      const sdpAnswer = await response.text();
      console.log('Received SDP answer from OpenAI');

      // Set the remote description
      await pcRef.current.setRemoteDescription({
        type: 'answer',
        sdp: sdpAnswer
      });

      console.log('Direct OpenAI WebRTC connection established successfully');
      return true;
    } catch (error) {
      console.error('Error connecting directly to OpenAI:', error);
      return false;
    }
  }, [
    config.disabled,
    config.openAIKey,
    config.serverUrl,
    settings.voice,
    initializeWebRTC,
    configureOpenAISession,
    handleDataChannelMessage
  ]);

  // Wrap cleanup to check disabled
  const wrappedCleanup = useCallback(() => {
    if (!config.disabled) {
      cleanup();
    }
  }, [config.disabled, cleanup]);

  return {
    initialize,
    cleanup: wrappedCleanup,
    connectionState: config.disabled ? 'disconnected' : connectionState,
    error: config.disabled ? null : error,
    isConnecting: config.disabled ? false : isConnecting,
    isConnected: config.disabled ? false : isConnected,
    audioLevel: config.disabled ? 0 : audioLevel,
    isRecording: config.disabled ? false : isRecording
  };
}