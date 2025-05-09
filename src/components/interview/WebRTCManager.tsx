import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import './WebRTCManager.css';

// Constants for reconnection strategy
const INITIAL_RETRY_DELAY = 1000; // 1 second
const MAX_RETRY_DELAY = 30000; // 30 seconds
const RETRY_BACKOFF_FACTOR = 1.5;
const MAX_RETRIES = 10;

interface WebRTCManagerProps {
  sessionId: string;
  onTranscriptUpdate: (text: string) => void;
  onConnectionStateChange: (state: string) => void;
  serverUrl?: string;
  simulationMode?: boolean;
}

export const WebRTCManager: React.FC<WebRTCManagerProps> = ({
  sessionId,
  onTranscriptUpdate,
  onConnectionStateChange,
  serverUrl,
  simulationMode = false
}) => {
  // Connection state
  const [connectionState, setConnectionState] = useState<string>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isReady, setIsReady] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [isRecording, setIsRecording] = useState<boolean>(false);

  // References
  const wsRef = useRef<WebSocket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const webrtcSessionIdRef = useRef<string | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  );

  // Initialize interview session and get WebRTC details
  const initializeSession = useCallback(async () => {
    try {
      setIsConnecting(true);
      setError(null);

      if (simulationMode) {
        // In simulation mode, bypass server call and use provided URL or mock one
        const mockUrl = serverUrl || 'wss://interview-simulation-proxy.fly.dev/ws';
        webrtcSessionIdRef.current = `sim-${sessionId}`;
        await connectWebRTC(mockUrl);
        setIsReady(true);
        return;
      }

      // Get tenant ID for the current user
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
          tenant_id: tenantData.tenant_id
        })
      });

      if (functionError) {
        throw new Error(`Failed to initialize interview: ${functionError.message}`);
      }

      if (!data.success) {
        throw new Error(data.error || 'Unknown error initializing interview');
      }

      // Store WebRTC session ID
      webrtcSessionIdRef.current = data.webrtc_session_id;

      // Update interview session status in database
      const { error: updateError } = await supabase
        .from('interview_sessions')
        .update({ status: 'in_progress' })
        .eq('id', sessionId);

      if (updateError) {
        console.error('Failed to update interview status:', updateError);
      }

      // Connect to WebRTC server
      await connectWebRTC(data.webrtc_server_url);

      setIsReady(true);

    } catch (error) {
      console.error('Error initializing interview session:', error);
      setError(error.message || 'Failed to initialize interview session');

      // Try to reconnect with exponential backoff
      scheduleRetry(() => initializeSession());
    } finally {
      setIsConnecting(false);
    }
  }, [sessionId, supabase, simulationMode, serverUrl]);

  // Schedule retry with exponential backoff
  const scheduleRetry = useCallback((callback: () => void) => {
    if (retryCount >= MAX_RETRIES) {
      console.error(`Reached maximum retry attempts (${MAX_RETRIES}). Giving up.`);
      setError(`Connection failed after ${MAX_RETRIES} attempts. Please try again later.`);
      return;
    }

    // Calculate delay with exponential backoff
    const delay = Math.min(
      INITIAL_RETRY_DELAY * Math.pow(RETRY_BACKOFF_FACTOR, retryCount),
      MAX_RETRY_DELAY
    );

    console.log(`Scheduling retry in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`);

    // Clear any existing timeout
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }

    // Schedule retry
    retryTimeoutRef.current = setTimeout(() => {
      setRetryCount(prev => prev + 1);
      callback();
    }, delay);
  }, [retryCount]);

  // Connect to WebRTC server
  const connectWebRTC = useCallback(async (url: string) => {
    if (!url) {
      setError('No WebRTC server URL provided');
      return;
    }

    try {
      // Create WebSocket connection
      const ws = new WebSocket(url);
      wsRef.current = ws;

      // Set up event handlers
      ws.onopen = () => {
        console.log('WebSocket connected');
        setConnectionState('ws_connected');
        onConnectionStateChange('ws_connected');

        // Reset retry count on successful connection
        setRetryCount(0);

        // If in simulation mode, send initialization message
        if (simulationMode) {
          ws.send(JSON.stringify({
            type: 'init',
            sessionId: sessionId,
            simulationMode: true
          }));
        }
      };

      ws.onmessage = (event) => {
        handleWebSocketMessage(event);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setError('WebSocket connection error');
        setConnectionState('error');
        onConnectionStateChange('error');
      };

      ws.onclose = (event) => {
        console.log(`WebSocket disconnected (code: ${event.code}, reason: ${event.reason})`);
        setConnectionState('disconnected');
        onConnectionStateChange('disconnected');

        // Try to reconnect if not closed intentionally
        if (event.code !== 1000) {
          scheduleRetry(() => connectWebRTC(url));
        }
      };

    } catch (error) {
      console.error('Error connecting to WebRTC server:', error);
      setError('Failed to connect to WebRTC server');
      setConnectionState('error');
      onConnectionStateChange('error');

      // Try to reconnect
      scheduleRetry(() => connectWebRTC(url));
    }
  }, [onConnectionStateChange, scheduleRetry, sessionId, simulationMode]);

  // Handle WebSocket messages
  const handleWebSocketMessage = useCallback((event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case 'session':
          // Store server-assigned session ID
          sessionIdRef.current = data.sessionId;

          // Initialize WebRTC peer connection
          initializeWebRTC();
          break;

        case 'sdp_answer':
          // Process SDP answer
          if (pcRef.current) {
            handleSdpAnswer(data.answer);
          }
          break;

        case 'ice_candidate':
          // Process ICE candidate from server
          if (pcRef.current && data.candidate) {
            pcRef.current.addIceCandidate(new RTCIceCandidate(data.candidate))
              .catch(error => console.error('Error adding ICE candidate:', error));
          }
          break;

        case 'ice_acknowledge':
          // ICE candidate was acknowledged
          console.log('ICE candidate acknowledged');
          break;

        case 'error':
          console.error('Error from server:', data.message);
          setError(data.message);
          break;

        case 'transcript':
          // Process transcript update
          if (data.text) {
            onTranscriptUpdate(data.text);

            // Save transcript to database if not in simulation mode
            if (!simulationMode) {
              saveTranscript(data.text);
            }
          }
          break;

        case 'ping':
          // Respond to ping with pong to keep connection alive
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'pong' }));
          }
          break;
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  }, [onTranscriptUpdate, saveTranscript, simulationMode]);

  // Initialize WebRTC peer connection
  const initializeWebRTC = useCallback(async () => {
    try {
      // Ensure any existing connection is closed
      if (pcRef.current) {
        pcRef.current.close();
      }

      // Create peer connection
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' }
        ]
      });

      pcRef.current = pc;

      // Set up event handlers
      pc.onicecandidate = (event) => {
        if (event.candidate && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          // Send ICE candidate to server
          wsRef.current.send(JSON.stringify({
            type: 'ice_candidate',
            candidate: event.candidate
          }));
        }
      };

      pc.oniceconnectionstatechange = () => {
        console.log('ICE connection state:', pc.iceConnectionState);

        if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
          setConnectionState('connected');
          onConnectionStateChange('connected');

          // Reset retry count on successful connection
          setRetryCount(0);
        } else if (pc.iceConnectionState === 'failed') {
          setConnectionState('ice_failed');
          onConnectionStateChange('ice_failed');

          // Attempt recovery by restarting ICE
          console.log('ICE connection failed, attempting recovery...');
          try {
            pc.restartIce();
          } catch (error) {
            console.error('Failed to restart ICE:', error);

            // If restart fails, recreate the connection
            scheduleRetry(() => initializeWebRTC());
          }
        } else if (pc.iceConnectionState === 'disconnected') {
          setConnectionState('ice_disconnected');
          onConnectionStateChange('ice_disconnected');

          // Wait briefly to see if connection recovers on its own
          setTimeout(() => {
            if (pcRef.current && pcRef.current.iceConnectionState === 'disconnected') {
              // Still disconnected, attempt recovery
              scheduleRetry(() => initializeWebRTC());
            }
          }, 5000);
        }
      };

      pc.onconnectionstatechange = () => {
        console.log('Connection state:', pc.connectionState);

        if (pc.connectionState === 'failed') {
          setConnectionState('connection_failed');
          onConnectionStateChange('connection_failed');

          // Attempt connection recovery
          scheduleRetry(() => initializeWebRTC());
        }
      };

      pc.ontrack = (event) => {
        console.log('Track received:', event.track.kind);

        // Handle incoming audio track
        if (event.track.kind === 'audio') {
          const audioElement = new Audio();
          audioElement.srcObject = event.streams[0];
          audioElement.play().catch(error => console.error('Error playing audio:', error));
        }
      };

      // Set up audio capture if not in simulation mode
      if (!simulationMode) {
        try {
          // Request microphone access
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          mediaStreamRef.current = stream;

          // Add audio track to peer connection
          stream.getAudioTracks().forEach(track => {
            pc.addTrack(track, stream);
            setIsRecording(true);
          });

          // Set up audio visualization
          setupAudioVisualization(stream);
        } catch (error) {
          console.error('Error accessing microphone:', error);
          setError('Could not access microphone. Please ensure microphone permissions are granted.');

          // In simulation mode or if microphone access fails, still continue with receive-only
          pc.addTransceiver('audio', { direction: 'recvonly' });
        }
      } else {
        // In simulation mode, just add a receiver for audio
        pc.addTransceiver('audio', { direction: 'recvonly' });
      }

      // Create and send SDP offer
      await createAndSendOffer();

    } catch (error) {
      console.error('Error initializing WebRTC:', error);
      setError('Failed to initialize WebRTC connection');
      setConnectionState('error');
      onConnectionStateChange('error');

      // Attempt recovery
      scheduleRetry(() => initializeWebRTC());
    }
  }, [onConnectionStateChange, createAndSendOffer, scheduleRetry, simulationMode]);

  // Set up audio visualization
  const setupAudioVisualization = useCallback((stream: MediaStream) => {
    try {
      // Clean up existing audio context if any
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }

      // Create audio context and analyzer
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;

      // Connect stream to analyzer
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      // Store references
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      // Start visualization loop
      startVisualization();
    } catch (error) {
      console.error('Error setting up audio visualization:', error);
    }
  }, []);

  // Start audio visualization loop
  const startVisualization = useCallback(() => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);

    const updateVisualization = () => {
      if (!analyserRef.current) return;

      analyserRef.current.getByteFrequencyData(dataArray);

      // Calculate average level
      let sum = 0;
      dataArray.forEach(value => sum += value);
      const average = sum / dataArray.length;

      // Scale to 0-100 range
      const scaledLevel = Math.min(Math.round(average / 256 * 100), 100);
      setAudioLevel(scaledLevel);

      // Schedule next frame
      animationFrameRef.current = requestAnimationFrame(updateVisualization);
    };

    // Start the loop
    animationFrameRef.current = requestAnimationFrame(updateVisualization);
  }, []);

  // Stop audio visualization
  const stopVisualization = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close().catch(error => console.error('Error closing audio context:', error));
      audioContextRef.current = null;
    }

    analyserRef.current = null;
    setAudioLevel(0);
  }, []);

  // Create and send SDP offer
  const createAndSendOffer = useCallback(async () => {
    if (!pcRef.current || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.error('Cannot create offer: Peer connection or WebSocket not initialized');
      return;
    }

    try {
      // Create offer
      const offer = await pcRef.current.createOffer();

      // Set local description
      await pcRef.current.setLocalDescription(offer);

      // Send offer to server
      wsRef.current.send(JSON.stringify({
        type: 'sdp_offer',
        offer: pcRef.current.localDescription
      }));

    } catch (error) {
      console.error('Error creating and sending offer:', error);
      setError('Failed to create SDP offer');

      // Try again after a delay
      scheduleRetry(() => createAndSendOffer());
    }
  }, [scheduleRetry]);

  // Handle SDP answer
  const handleSdpAnswer = useCallback(async (answer: RTCSessionDescriptionInit) => {
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

      // Try again by recreating the connection
      scheduleRetry(() => initializeWebRTC());
    }
  }, [scheduleRetry, initializeWebRTC]);

  // Save transcript entry to database
  const saveTranscript = useCallback(async (text: string) => {
    if (!text.trim() || !sessionId) return;

    try {
      // Call transcript Edge Function to save the entry
      await supabase.functions.invoke('interview-transcript', {
        body: JSON.stringify({
          interview_session_id: sessionId,
          text,
          timestamp: new Date().toISOString()
        })
      });

    } catch (error) {
      console.error('Error saving transcript:', error);
      // We don't retry here as this shouldn't block the interview
    }
  }, [sessionId, supabase]);

  // Send a heartbeat to keep the connection alive
  useEffect(() => {
    if (!wsRef.current || connectionState !== 'ws_connected' && connectionState !== 'connected') {
      return;
    }

    const interval = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [connectionState]);

  // Clean up resources
  const cleanUp = useCallback(() => {
    console.log('Cleaning up WebRTC resources...');

    // Stop audio visualization
    stopVisualization();

    // Stop media stream
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    // Close peer connection
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }

    // Close WebSocket
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    // Clear any pending retries
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    setIsRecording(false);
    setConnectionState('disconnected');
    onConnectionStateChange('disconnected');
  }, [onConnectionStateChange, stopVisualization]);

  // Handle component mount/unmount
  useEffect(() => {
    if (sessionId) {
      initializeSession();
    }

    return () => {
      cleanUp();
    };
  }, [sessionId, initializeSession, cleanUp]);

  // Render connection indicator dots based on state
  const renderConnectionDots = () => {
    const states = {
      'disconnected': { color: 'red', label: 'Disconnected' },
      'connecting': { color: 'yellow', label: 'Connecting...' },
      'ws_connected': { color: 'yellow', label: 'WebSocket Connected' },
      'connected': { color: 'green', label: 'Connected' },
      'ice_disconnected': { color: 'orange', label: 'Reconnecting...' },
      'ice_failed': { color: 'red', label: 'Connection Failed' },
      'connection_failed': { color: 'red', label: 'Connection Failed' },
      'error': { color: 'red', label: 'Error' }
    };

    const state = states[connectionState as keyof typeof states] || states.disconnected;

    return (
      <div className="connection-indicators">
        <div className={`connection-dot ${state.color}`}></div>
        <span className="connection-label">{state.label}</span>
        {retryCount > 0 && (
          <span className="retry-count">Retry {retryCount}/{MAX_RETRIES}</span>
        )}
      </div>
    );
  };

  // Generate audio level visualization bars
  const renderAudioLevelVisualization = () => {
    const bars = [];
    const numBars = 10;

    // Calculate how many bars should be active based on audio level
    const activeBars = Math.ceil((audioLevel / 100) * numBars);

    for (let i = 0; i < numBars; i++) {
      bars.push(
        <div
          key={i}
          className={`audio-level-bar ${i < activeBars ? 'active' : ''}`}
          style={{
            height: `${(i + 1) * 10}%`,
            opacity: i < activeBars ? 1 : 0.3
          }}
        />
      );
    }

    return (
      <div className="audio-level-container">
        <div className="audio-level-bars">
          {bars}
        </div>
        <div className="audio-level-label">
          {isRecording ? 'Microphone Active' : 'Microphone Inactive'}
        </div>
      </div>
    );
  };

  return (
    <div className="webrtc-manager">
      <div className="webrtc-status">
        {renderConnectionDots()}

        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}
      </div>

      {isConnecting && (
        <div className="connecting-indicator">
          <div className="connecting-spinner"></div>
          <span>Connecting to interview session...</span>
        </div>
      )}

      {isRecording && renderAudioLevelVisualization()}

      <div className="controls">
        <button
          onClick={cleanUp}
          className="disconnect-button"
          disabled={connectionState === 'disconnected'}
        >
          End Interview
        </button>

        {connectionState === 'ice_failed' || connectionState === 'connection_failed' || connectionState === 'error' ? (
          <button
            onClick={() => initializeWebRTC()}
            className="reconnect-button"
          >
            Retry Connection
          </button>
        ) : null}
      </div>

      {simulationMode && (
        <div className="simulation-badge">
          SIMULATION MODE
        </div>
      )}
    </div>
  );
}; 