import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

interface WebRTCManagerProps {
  sessionId: string;
  onTranscriptUpdate: (text: string) => void;
  onConnectionStateChange: (state: string) => void;
  serverUrl?: string;
}

export const WebRTCManager: React.FC<WebRTCManagerProps> = ({
  sessionId,
  onTranscriptUpdate,
  onConnectionStateChange,
  serverUrl
}) => {
  // Connection state
  const [connectionState, setConnectionState] = useState<string>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isReady, setIsReady] = useState<boolean>(false);
  
  // References
  const wsRef = useRef<WebSocket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const webrtcSessionIdRef = useRef<string | null>(null);
  
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
    } finally {
      setIsConnecting(false);
    }
  }, [sessionId, supabase]);
  
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
      
      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setConnectionState('disconnected');
        onConnectionStateChange('disconnected');
      };
      
    } catch (error) {
      console.error('Error connecting to WebRTC server:', error);
      setError('Failed to connect to WebRTC server');
      setConnectionState('error');
      onConnectionStateChange('error');
    }
  }, [onConnectionStateChange]);
  
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
          }
          break;
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  }, [onTranscriptUpdate]);
  
  // Initialize WebRTC peer connection
  const initializeWebRTC = useCallback(() => {
    try {
      // Create peer connection
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' }
        ]
      });
      
      pcRef.current = pc;
      
      // Set up event handlers
      pc.onicecandidate = (event) => {
        if (event.candidate && wsRef.current) {
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
        } else if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected') {
          setConnectionState('ice_failed');
          onConnectionStateChange('ice_failed');
        }
      };
      
      pc.ontrack = (event) => {
        // In a more complex implementation, this would handle incoming audio/video
        console.log('Track received:', event.track.kind);
      };
      
      // Add audio transceiver for receiving audio
      pc.addTransceiver('audio', { direction: 'recvonly' });
      
      // Create and send SDP offer
      createAndSendOffer();
      
    } catch (error) {
      console.error('Error initializing WebRTC:', error);
      setError('Failed to initialize WebRTC connection');
      setConnectionState('error');
      onConnectionStateChange('error');
    }
  }, [onConnectionStateChange]);
  
  // Create and send SDP offer
  const createAndSendOffer = useCallback(async () => {
    if (!pcRef.current || !wsRef.current) {
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
        offer
      }));
      
    } catch (error) {
      console.error('Error creating and sending offer:', error);
      setError('Failed to create SDP offer');
    }
  }, []);
  
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
    }
  }, []);
  
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
    }
  }, [sessionId, supabase]);
  
  // Clean up resources
  const cleanUp = useCallback(() => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setConnectionState('disconnected');
    onConnectionStateChange('disconnected');
  }, [onConnectionStateChange]);
  
  // Handle component mount/unmount
  useEffect(() => {
    if (sessionId) {
      initializeSession();
    }
    
    return () => {
      cleanUp();
    };
  }, [sessionId, initializeSession, cleanUp]);
  
  return (
    <div className="webrtc-manager">
      <div className="webrtc-status">
        <div className={`status-indicator status-${connectionState}`}></div>
        <span>Connection: {connectionState}</span>
        {error && <div className="error-message">{error}</div>}
      </div>
      
      {isConnecting && (
        <div className="connecting-indicator">
          <span>Connecting to interview session...</span>
        </div>
      )}
      
      {isReady && (
        <div className="controls">
          <button 
            onClick={cleanUp} 
            className="disconnect-button"
            disabled={connectionState === 'disconnected'}
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}; 