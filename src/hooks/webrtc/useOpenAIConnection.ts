import { useCallback, useRef } from 'react';
import { useWebRTCConnection } from './useWebRTCConnection';
import { ConnectionState } from './useConnectionState';
import { useTranscriptManager } from './useTranscriptManager';
import { supabase, getCurrentTenantId } from '@/integrations/supabase/client';

export interface OpenAIConnectionConfig {
  // Note: We ALWAYS use ephemeral tokens via Supabase edge function
  // Never pass API keys to the browser
  openAISettings?: {
    voice?: string;
    temperature?: number;
    maximumLength?: number;
    instructions?: string;
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
  voice: 'verse',
  temperature: 0.7,
  maximumLength: 5
};

// ⭐ GOLDEN STATE: Audio element management - CRITICAL FOR SUSTAINED CONVERSATION ⭐
// Store audio element reference outside component to persist across renders
// This approach was the KEY FIX that enabled our full interview conversation success.
// Date confirmed working: June 3, 2025
let audioElement: HTMLAudioElement | null = null;

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

  // Track AI response text for avatar sync
  const aiResponseTextRef = useRef<string>('');
  const lastDeltaTimestampRef = useRef<number>(0);

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
    cleanup: cleanupWebRTC,
    connectionState,
    error,
    isConnecting,
    isConnected,
    isDisconnected,
    isError,
    audioLevel,
    isRecording
  } = useWebRTCConnection(
    { 
      simulationMode: false // Explicitly ensure we're not in simulation mode
    },
    onConnectionStateChange,
    // ⭐ GOLDEN STATE: Track handler - CRITICAL AUDIO MANAGEMENT ⭐
    // This function is responsible for handling incoming audio tracks from OpenAI
    // The persistent audio element approach here is what fixed the conversation interruption
    (track, streams) => {
      if (track.kind === 'audio') {
        console.log('Received audio track from OpenAI');
        
        // ⭐ CRITICAL: Create audio element once and reuse it - DO NOT MODIFY ⭐
        // This is the KEY FIX that enables sustained conversation audio
        // Previous broken approach: new Audio() on every track = audio interruption
        // Working approach: persistent audioElement = sustained conversation
        if (!audioElement) {
          console.log('Creating new audio element for OpenAI playback');
          audioElement = new Audio();
          audioElement.autoplay = true;
          audioElement.controls = false;
          audioElement.muted = false;
          // Add to DOM to help with autoplay policies
          audioElement.style.display = 'none';
          document.body.appendChild(audioElement);
          
          // Add event listeners for debugging
          audioElement.addEventListener('loadstart', () => console.log('Audio: Load started'));
          audioElement.addEventListener('canplay', () => console.log('Audio: Can play'));
          audioElement.addEventListener('play', () => console.log('Audio: Play event'));
          audioElement.addEventListener('playing', () => console.log('Audio: Playing'));
          audioElement.addEventListener('pause', () => console.log('Audio: Paused'));
          audioElement.addEventListener('ended', () => console.log('Audio: Ended'));
          audioElement.addEventListener('error', (e) => console.error('Audio error:', e));
        }
        
        // ⭐ CRITICAL: Reuse existing element - DO NOT create new Audio() here ⭐
        console.log('Setting audio stream to element');
        audioElement.srcObject = streams[0];
        
        // Force playback with user interaction handling
        const ensurePlayback = async () => {
          try {
            // Resume audio context for browsers that require it
            if ('AudioContext' in window) {
              const audioContext = new AudioContext();
              if (audioContext.state === 'suspended') {
                console.log('Resuming suspended AudioContext');
                await audioContext.resume();
              }
            }
            
            if (audioElement) {
              console.log('Attempting to play audio...');
              await audioElement.play();
              console.log('Audio playback started successfully');
            }
          } catch (error) {
            console.error('Error playing audio:', error);
            // If autoplay failed, wait for user interaction
            console.log('Autoplay failed, waiting for user interaction...');
            
            const playOnInteraction = async () => {
              try {
                if (audioElement) {
                  await audioElement.play();
                  console.log('Audio playback started after user interaction');
                }
              } catch (retryError) {
                console.error('Audio playback failed even after user interaction:', retryError);
              }
            };
            
            // Add one-time event listeners for user interaction
            document.addEventListener('click', playOnInteraction, { once: true });
            document.addEventListener('keydown', playOnInteraction, { once: true });
            document.addEventListener('touchstart', playOnInteraction, { once: true });
          }
        };
        
        // Start playback immediately
        ensurePlayback();
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
            
            // Add to AI response buffer
            aiResponseTextRef.current += message.text;
            // Don't save individual deltas - wait for done event
          }
          break;

        case 'response.audio_transcript.done':
          // AI response completed - save the accumulated transcript
          console.log('AI response completed, saving transcript');
          if (aiResponseTextRef.current.trim()) {
            saveTranscript(aiResponseTextRef.current, 'ai');
          }
          // Reset for next response
          aiResponseTextRef.current = '';
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
    // Use enhanced instructions from edge function if available, otherwise fallback to default
    const instructions = settings.instructions || 
      `You are an AI technical interviewer conducting an interview for a ${config.jobDescription || 'software engineering position'}.
       The candidate has submitted a resume indicating: ${config.resume || 'they have experience in web development'}.
       Ask challenging but fair technical questions, evaluate their responses,
       and provide constructive feedback. Be conversational but professional.`;
    
    const sessionConfig = {
      type: 'session.update',
      session: {
        instructions: instructions,
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
    console.log('Instructions being used:', instructions);
    console.log('Instructions length:', instructions.length);

    // Start the interview after a short delay
    // The AI will use the instructions from session.update to introduce itself
    setTimeout(() => {
      if (dataChannelRef.current) {
        dataChannelRef.current.send(JSON.stringify({
          type: 'response.create',
          response: {
            modalities: ['text', 'audio']
            // Removed hardcoded instructions - AI will use the personalized greeting from session.update
          }
        }));
        console.log('Started interview with OpenAI');
      }
    }, 1000);
    
    // Warn user before session timeout (ephemeral tokens expire after 1 minute)
    setTimeout(() => {
      if (dataChannelRef.current && dataChannelRef.current.readyState === 'open') {
        console.warn('Session will expire soon - ephemeral token timeout approaching');
        // Send a message to warn the user
        dataChannelRef.current.send(JSON.stringify({
          type: 'response.create',
          response: {
            modalities: ['text', 'audio'],
            instructions: 'We have about 10 seconds left in this session. The connection will need to be refreshed soon. Is there anything else you\'d like to quickly discuss?'
          }
        }));
      }
    }, 50000); // Warn at 50 seconds (10 seconds before timeout)
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
      console.log('OpenAI: Starting WebRTC initialization...');
      await initializeWebRTC();
      console.log('OpenAI: WebRTC initialization completed');

      if (!pcRef.current) {
        throw new Error('Failed to initialize WebRTC connection');
      }

      // Create a data channel for OpenAI control messages
      console.log('Creating data channel for OpenAI events...');
      const dataChannel = pcRef.current.createDataChannel('oai-events');
      dataChannelRef.current = dataChannel;
      console.log('Data channel created, current state:', dataChannel.readyState);

      // Set up data channel event handlers
      dataChannel.onopen = () => {
        console.log('Data channel opened successfully');
        configureOpenAISession();
      };
      dataChannel.onmessage = handleDataChannelMessage;
      dataChannel.onerror = (error) => console.error('Data channel error:', error);
      dataChannel.onclose = () => {
        console.log('Data channel closed');
        // If the data channel closes unexpectedly, it might be due to session timeout
        if (pcRef.current?.connectionState === 'connected') {
          console.error('Data channel closed while connection is still active - possible session timeout');
          // The connection state handlers in useWebRTCConnection will handle the cleanup
        }
      };

      // Create offer
      const offer = await pcRef.current.createOffer();
      await pcRef.current.setLocalDescription(offer);

      console.log('Created local SDP offer');

      // Wait for ICE candidates to be gathered (with timeout)
      await new Promise<void>(resolve => {
        // Set a timeout of 3 seconds for ICE gathering
        const timeout = setTimeout(() => {
          console.log('ICE gathering timeout - proceeding with available candidates');
          resolve();
        }, 3000);
        
        if (pcRef.current?.iceGatheringState === 'complete') {
          clearTimeout(timeout);
          resolve();
        } else if (pcRef.current) {
          pcRef.current.onicegatheringstatechange = () => {
            if (pcRef.current?.iceGatheringState === 'complete') {
              clearTimeout(timeout);
              resolve();
            }
          };
        } else {
          clearTimeout(timeout);
          resolve(); // Resolve anyway to prevent hanging
        }
      });

      console.log('ICE gathering complete');

      let authToken: string;
      let model = 'gpt-4o-realtime-preview-2025-06-03';

      // ALWAYS use Supabase edge function for ephemeral tokens (secure)
      // Never use API key directly in the browser
      console.log('Fetching ephemeral token from Supabase edge function...');
      
      const tokenPayload = {
        model: model,
        voice: settings.voice || 'verse',
        session_id: sessionId,
        tenant_id: await getCurrentTenantId()
      };
      console.log('Token request payload:', tokenPayload);
      
      // Use Supabase edge function
      const { data: tokenData, error: tokenError } = await supabase.functions.invoke('openai-realtime-token', {
        body: tokenPayload
      });

      if (tokenError || !tokenData) {
        throw new Error(`Failed to get ephemeral token: ${tokenError?.message || 'Unknown error'}`);
      }
      
      if (!tokenData.client_secret?.value) {
        throw new Error('Invalid token response from edge function');
      }

      authToken = tokenData.client_secret.value;
      
      // Use the model from the response if provided
      if (tokenData.model) {
        model = tokenData.model;
      }
      
      console.log('Successfully obtained ephemeral token');
      console.log('Token preview (first 20 chars):', authToken.substring(0, 20) + '...');
      console.log('Token length:', authToken.length);

      // Log the connection attempt details
      console.log('Attempting to connect to OpenAI Realtime API...');
      console.log(`Model: ${model}`);
      console.log(`Auth token type: ${config.serverUrl ? 'ephemeral' : 'api_key'}`);
      console.log(`Local SDP offer ready: ${!!pcRef.current.localDescription?.sdp}`);

      // Send offer to OpenAI Realtime API with appropriate auth
      const openAIUrl = `https://api.openai.com/v1/realtime?model=${model}`;
      console.log(`Sending SDP offer to: ${openAIUrl}`);
      
      const response = await fetch(openAIUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/sdp'
        },
        body: pcRef.current.localDescription?.sdp,
        mode: 'cors', // Explicitly set CORS mode
        credentials: 'omit' // Don't send cookies
      });

      console.log(`OpenAI API response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenAI API error response:', errorText);
        throw new Error(`OpenAI API error (${response.status}): ${errorText}`);
      }

      // Get SDP answer from OpenAI - simple approach like Lovable MVP
      console.log('Reading SDP answer from OpenAI response...');
      const sdpAnswer = await response.text();
      console.log('Received SDP answer from OpenAI');
      console.log('SDP answer length:', sdpAnswer.length);
      console.log('SDP answer preview:', sdpAnswer.substring(0, 100) + '...');

      // Set the remote description
      console.log('Setting remote description with OpenAI SDP answer...');
      try {
        await pcRef.current.setRemoteDescription({
          type: 'answer',
          sdp: sdpAnswer
        });
        console.log('Successfully set remote description');
      } catch (sdpError) {
        console.error('Failed to set remote description:', sdpError);
        throw sdpError;
      }

      // Log connection state
      console.log('Current peer connection state:', pcRef.current.connectionState);
      console.log('Current ICE connection state:', pcRef.current.iceConnectionState);
      console.log('Current signaling state:', pcRef.current.signalingState);

      console.log('Direct OpenAI WebRTC connection established successfully');
      
      // Add a listener to monitor connection state changes
      pcRef.current.onconnectionstatechange = () => {
        console.log('Peer connection state changed to:', pcRef.current?.connectionState);
      };
      
      pcRef.current.oniceconnectionstatechange = () => {
        console.log('ICE connection state changed to:', pcRef.current?.iceConnectionState);
      };
      
      return true;
    } catch (error) {
      console.error('Error connecting directly to OpenAI:', error);
      console.error('Error details:', {
        name: (error as Error).name,
        message: (error as Error).message,
        stack: (error as Error).stack
      });
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
      cleanupWebRTC();
      
      // Reset AI response tracking
      aiResponseTextRef.current = '';
      lastDeltaTimestampRef.current = 0;
      
      // Clean up audio element
      if (audioElement) {
        audioElement.pause();
        audioElement.srcObject = null;
        // Remove from DOM if it was added
        if (audioElement.parentNode) {
          audioElement.parentNode.removeChild(audioElement);
        }
        audioElement = null;
      }
    }
  }, [config.disabled, cleanupWebRTC]);

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