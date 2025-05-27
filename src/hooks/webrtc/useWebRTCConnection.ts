import { useRef, useCallback, useEffect } from 'react';
import { useConnectionState, ConnectionState } from './useConnectionState';
import { useRetry } from './useRetry';
import { useAudioVisualization } from './useAudioVisualization';

export interface WebRTCConfig {
  iceServers?: RTCIceServer[];
  simulationMode?: boolean;
}

export interface WebRTCConnectionHandlers {
  pcRef: React.MutableRefObject<RTCPeerConnection | null>;
  streamRef: React.MutableRefObject<MediaStream | null>;
  dataChannelRef: React.MutableRefObject<RTCDataChannel | null>;
  createOffer: () => Promise<RTCSessionDescriptionInit | null>;
  handleAnswer: (answer: RTCSessionDescriptionInit) => Promise<void>;
  addIceCandidate: (candidate: RTCIceCandidate) => Promise<void>;
  initialize: () => Promise<boolean>;
  cleanup: () => void;
  setupAudioCapture: () => Promise<boolean>;
  connectionState: ConnectionState;
  error: string | null;
  isConnecting: boolean;
  isConnected: boolean;
  isDisconnected: boolean;
  isError: boolean;
  audioLevel: number;
  isRecording: boolean;
  visualizationData: number[];
}

const DEFAULT_ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' }
];

/**
 * Hook for managing WebRTC peer connection
 */
export function useWebRTCConnection(
  config: WebRTCConfig = {},
  onConnectionStateChange?: (state: ConnectionState) => void,
  onTrack?: (track: MediaStreamTrack, streams: ReadonlyArray<MediaStream>) => void
): WebRTCConnectionHandlers {
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

  const {
    audioLevel,
    isRecording,
    visualizationData,
    startVisualization,
    stopVisualization
  } = useAudioVisualization();

  // References
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);

  // Clean up WebRTC resources
  const cleanup = useCallback(() => {
    console.log('Cleaning up WebRTC connection...');

    // Stop audio visualization
    stopVisualization();

    // Stop media stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Close peer connection
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }

    // Reset connection state
    setConnectionState('disconnected');
  }, [stopVisualization, setConnectionState]);

  // Set up microphone access and audio capture
  const setupAudioCapture = useCallback(async (): Promise<boolean> => {
    try {
      if (config.simulationMode) {
        console.log('Simulation mode - skipping audio capture');
        return true;
      }

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      // Store the stream
      streamRef.current = stream;

      // Set up audio visualization
      startVisualization(stream);

      // Add audio tracks to peer connection if it exists
      if (pcRef.current) {
        stream.getAudioTracks().forEach(track => {
          pcRef.current?.addTrack(track, stream);
        });
      }

      return true;
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setError('Could not access microphone. Please ensure microphone permissions are granted.');
      return false;
    }
  }, [config.simulationMode, startVisualization, setError]);

  // Create an SDP offer
  const createOffer = useCallback(async (): Promise<RTCSessionDescriptionInit | null> => {
    if (!pcRef.current) {
      console.error('Cannot create offer: Peer connection not initialized');
      return null;
    }

    try {
      // Create offer
      const offer = await pcRef.current.createOffer();

      // Set local description
      await pcRef.current.setLocalDescription(offer);

      // Return the offer
      return pcRef.current.localDescription as RTCSessionDescriptionInit;
    } catch (error) {
      console.error('Error creating offer:', error);
      setError('Failed to create SDP offer');
      
      if (!hasExceededMaxRetries) {
        scheduleRetry(() => createOffer());
      }
      
      return null;
    }
  }, [setError, hasExceededMaxRetries, scheduleRetry]);

  // Handle an SDP answer
  const handleAnswer = useCallback(async (answer: RTCSessionDescriptionInit): Promise<void> => {
    if (!pcRef.current) {
      console.error('Cannot handle answer: Peer connection not initialized');
      return;
    }

    try {
      // Set remote description
      await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
      console.log('Remote description set successfully');
    } catch (error) {
      console.error('Error handling SDP answer:', error);
      setError('Failed to process SDP answer');

      if (!hasExceededMaxRetries) {
        scheduleRetry(() => initialize());
      }
    }
  }, [setError, hasExceededMaxRetries, scheduleRetry]);

  // Add ICE candidate
  const addIceCandidate = useCallback(async (candidate: RTCIceCandidate): Promise<void> => {
    if (!pcRef.current) {
      console.error('Cannot add ICE candidate: Peer connection not initialized');
      return;
    }

    try {
      await pcRef.current.addIceCandidate(candidate);
    } catch (error) {
      console.error('Error adding ICE candidate:', error);
    }
  }, []);

  // Initialize WebRTC peer connection
  const initialize = useCallback(async (): Promise<boolean> => {
    try {
      // Clean up any existing connection
      cleanup();
      
      setIsConnecting(true);
      setError(null);
      setConnectionState('connecting');

      // Create peer connection
      const pc = new RTCPeerConnection({
        iceServers: config.iceServers || DEFAULT_ICE_SERVERS
      });

      pcRef.current = pc;

      // Set up ice candidate event handler
      pc.onicecandidate = (event) => {
        // Handled by parent component which will forward ICE candidates
        console.log('ICE candidate generated:', event.candidate);
      };

      // ICE connection state change handler
      pc.oniceconnectionstatechange = () => {
        console.log('ICE connection state:', pc.iceConnectionState);

        if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
          setConnectionState('connected');
          resetRetryCount();
        } else if (pc.iceConnectionState === 'failed') {
          setConnectionState('ice_failed');

          // Attempt recovery by restarting ICE
          console.log('ICE connection failed, attempting recovery...');
          try {
            pc.restartIce();
          } catch (error) {
            console.error('Failed to restart ICE:', error);
            if (!hasExceededMaxRetries) {
              scheduleRetry(() => initialize());
            }
          }
        } else if (pc.iceConnectionState === 'disconnected') {
          setConnectionState('ice_disconnected');

          // Wait briefly to see if connection recovers on its own
          setTimeout(() => {
            if (pcRef.current && pcRef.current.iceConnectionState === 'disconnected') {
              // Still disconnected, attempt recovery
              if (!hasExceededMaxRetries) {
                scheduleRetry(() => initialize());
              }
            }
          }, 5000);
        }
      };

      // Connection state change handler
      pc.onconnectionstatechange = () => {
        console.log('Connection state:', pc.connectionState);

        if (pc.connectionState === 'failed') {
          setConnectionState('connection_failed');
          
          if (!hasExceededMaxRetries) {
            scheduleRetry(() => initialize());
          }
        }
      };

      // Track handler
      pc.ontrack = (event) => {
        console.log('Track received:', event.track.kind);
        
        if (onTrack) {
          onTrack(event.track, event.streams);
        }
      };

      // If we have an existing audio stream, add it to the new connection
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          pc.addTrack(track, streamRef.current!);
        });
      } else if (!config.simulationMode) {
        // Set up audio capture if not in simulation mode
        await setupAudioCapture();
      } else {
        // In simulation mode, just add a receiver for audio
        pc.addTransceiver('audio', { direction: 'recvonly' });
      }

      setIsConnecting(false);
      console.log('WebRTC connection initialized successfully');
      return true;
    } catch (error) {
      console.error('Error initializing WebRTC connection:', error);
      setError(`Failed to initialize WebRTC connection: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setConnectionState('error');
      setIsConnecting(false);
      
      if (!hasExceededMaxRetries) {
        scheduleRetry(() => initialize());
      }
      
      return false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    // cleanup removed - only called at start, doesn't need to trigger re-creation
    setIsConnecting, 
    setError, 
    setConnectionState, 
    config.iceServers, 
    config.simulationMode,
    setupAudioCapture,
    onTrack,
    hasExceededMaxRetries,
    scheduleRetry,
    resetRetryCount
  ]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    pcRef,
    streamRef,
    dataChannelRef,
    createOffer,
    handleAnswer,
    addIceCandidate,
    initialize,
    cleanup,
    setupAudioCapture,
    connectionState,
    error,
    isConnecting,
    isConnected,
    isDisconnected,
    isError,
    audioLevel,
    isRecording,
    visualizationData
  };
}