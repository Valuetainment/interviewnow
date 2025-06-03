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

// Store audio element reference outside component to persist across renders
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
    {}, // Use default config
    onConnectionStateChange,
    // Handle incoming tracks
    (track, streams) => {
      if (track.kind === 'audio') {
        console.log('Received audio track from OpenAI');
        
        // Clean up any existing audio element
        if (audioElement) {
          audioElement.pause();
          audioElement.srcObject = null;
        }
        
        // Create or reuse audio element
        if (!audioElement) {
          audioElement = new Audio();
          // Set properties to minimize latency
          audioElement.autoplay = true;
          audioElement.preload = 'none';
          // Disable any audio processing that might add latency
          const audioWithHint = audioElement as HTMLAudioElement & { latencyHint?: string };
          if ('latencyHint' in audioWithHint) {
            audioWithHint.latencyHint = 'interactive';
          }
          // Add to DOM to help with autoplay policies
          audioElement.style.display = 'none';
          document.body.appendChild(audioElement);
        }
        
        // Set the stream
        audioElement.srcObject = streams[0];
        
        // Force immediate playback with multiple attempts
        const playAudio = async () => {
          try {
            // Ensure audio context is resumed (for browsers that require it)
            if ('AudioContext' in window) {
              const audioContext = new AudioContext();
              if (audioContext.state === 'suspended') {
                await audioContext.resume();
              }
            }
            
            await audioElement?.play();
            console.log('Audio playback started successfully');
          } catch (error) {
            console.error('Error playing audio:', error);
            // Retry after a short delay
            setTimeout(playAudio, 100);
          }
        };
        
        // Start playback immediately
        playAudio();
        
        // Also ensure playback on any user interaction
        const ensurePlayback = () => {
          if (audioElement && audioElement.paused) {
            playAudio();
          }
        };
        
        document.addEventListener('click', ensurePlayback, { once: true });
        document.addEventListener('keydown', ensurePlayback, { once: true });
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
      await initializeWebRTC();

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
        
        const tokenPayload = {
          model: model,
          voice: settings.voice || 'alloy'
        };
        console.log('Token request payload:', tokenPayload);
        
        const tokenResponse = await fetch(`${baseUrl}/api/realtime/sessions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(tokenPayload)
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
        console.log('Token preview (first 20 chars):', authToken.substring(0, 20) + '...');
        console.log('Token length:', authToken.length);
      } else {
        // Fallback to direct API key (not recommended for production)
        console.warn('Using API key directly - this is not recommended for production');
        authToken = config.openAIKey!;
      }

      // Log the connection attempt details
      console.log('Attempting to connect to OpenAI Realtime API...');
      console.log(`Model: ${model}`);
      console.log(`Auth token type: ${config.serverUrl ? 'ephemeral' : 'api_key'}`);
      console.log(`Local SDP offer ready: ${!!pcRef.current.localDescription?.sdp}`);

      // Send offer to OpenAI Realtime API with appropriate auth
      const openAIUrl = `https://api.openai.com/v1/realtime?model=${model}`;
      console.log(`Sending SDP offer to: ${openAIUrl}`);
      
      // Create AbortController for timeout
      const abortController = new AbortController();
      const fetchTimeout = setTimeout(() => {
        console.log('Aborting fetch after 10 seconds...');
        abortController.abort();
      }, 10000); // 10 second total timeout for the entire fetch operation
      
      const response = await fetch(openAIUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/sdp'
        },
        body: pcRef.current.localDescription?.sdp,
        mode: 'cors', // Explicitly set CORS mode
        credentials: 'omit', // Don't send cookies
        signal: abortController.signal // Add abort signal
      });
      
      // Clear the fetch timeout
      clearTimeout(fetchTimeout);

      console.log(`OpenAI API response status: ${response.status}`);
      console.log('Response headers:', {
        'content-type': response.headers.get('content-type'),
        'content-length': response.headers.get('content-length'),
        'access-control-allow-origin': response.headers.get('access-control-allow-origin'),
      });
      
      // Check if response is complete
      console.log('Response object details:', {
        bodyUsed: response.bodyUsed,
        ok: response.ok,
        redirected: response.redirected,
        type: response.type,
        url: response.url
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenAI API error response:', errorText);
        throw new Error(`OpenAI API error (${response.status}): ${errorText}`);
      }

      // Get SDP answer from OpenAI with timeout
      console.log('Reading SDP answer from OpenAI response...');
      console.log('About to call response.text() - this is where it might hang');
      
      let sdpAnswer: string;
      try {
        // Add timeout for reading response
        console.log('Creating text promise...');
        const textPromise = response.text();
        console.log('Text promise created');
        
        console.log('Creating timeout promise...');
        const timeoutPromise = new Promise<never>((_, reject) => {
          console.log('Setting timeout for 5 seconds...');
          const timeoutId = setTimeout(() => {
            console.log('TIMEOUT FIRED - rejecting promise');
            reject(new Error('Timeout reading OpenAI response after 5 seconds'));
          }, 5000);
          console.log('Timeout set with ID:', timeoutId);
        });
        console.log('Timeout promise created');
        
        console.log('Starting Promise.race...');
        sdpAnswer = await Promise.race([textPromise, timeoutPromise]);
        console.log('Promise.race completed successfully');
        console.log('Successfully read response.text()');
        console.log('Received SDP answer from OpenAI');
      } catch (readError) {
        console.error('Error reading OpenAI response:', readError);
        console.error('Full error object:', readError);
        console.error('Response headers:', response.headers);
        console.error('Response status:', response.status);
        console.error('Response statusText:', response.statusText);
        
        // Try reading as stream if text() fails
        try {
          console.log('Trying to read response as stream...');
          if (!response.body) {
            throw new Error('Response body is null');
          }
          
          const reader = response.body.getReader();
          const chunks: Uint8Array[] = [];
          let done = false;
          
          // Read with timeout
          const readTimeout = setTimeout(() => {
            reader.cancel();
            done = true;
          }, 3000);
          
          while (!done) {
            const { value, done: streamDone } = await reader.read();
            if (streamDone || !value) {
              done = true;
              clearTimeout(readTimeout);
            } else {
              chunks.push(value);
              console.log(`Read chunk of size: ${value.length}`);
            }
          }
          
          clearTimeout(readTimeout);
          
          // Combine chunks and decode
          const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
          console.log(`Total response size: ${totalLength} bytes`);
          
          const combined = new Uint8Array(totalLength);
          let offset = 0;
          for (const chunk of chunks) {
            combined.set(chunk, offset);
            offset += chunk.length;
          }
          
          sdpAnswer = new TextDecoder().decode(combined);
          console.log('Successfully read response as stream');
        } catch (streamError) {
          console.error('Stream reading also failed:', streamError);
          
          // Last resort - try cloning
          try {
            console.log('Trying to clone and read response...');
            const clonedResponse = response.clone();
            const blob = await clonedResponse.blob();
            console.log('Response blob size:', blob.size);
            sdpAnswer = await blob.text();
          } catch (altError) {
            console.error('Alternative read also failed:', altError);
            
            // Final fallback - try XMLHttpRequest
            console.log('Trying XMLHttpRequest as final fallback...');
            try {
              sdpAnswer = await new Promise<string>((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open('POST', openAIUrl);
                xhr.setRequestHeader('Authorization', `Bearer ${authToken}`);
                xhr.setRequestHeader('Content-Type', 'application/sdp');
                xhr.timeout = 5000; // 5 second timeout
                
                xhr.onload = () => {
                  console.log('XHR status:', xhr.status);
                  console.log('XHR response length:', xhr.responseText.length);
                  if (xhr.status === 201 || xhr.status === 200) {
                    resolve(xhr.responseText);
                  } else {
                    reject(new Error(`XHR failed with status ${xhr.status}`));
                  }
                };
                
                xhr.onerror = () => reject(new Error('XHR network error'));
                xhr.ontimeout = () => reject(new Error('XHR timeout'));
                
                console.log('Sending XHR request...');
                xhr.send(pcRef.current.localDescription?.sdp);
              });
              
              console.log('Successfully read response via XMLHttpRequest');
            } catch (xhrError) {
              console.error('XMLHttpRequest also failed:', xhrError);
              throw new Error('Failed to read SDP answer from OpenAI response');
            }
          }
        }
      }
      
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