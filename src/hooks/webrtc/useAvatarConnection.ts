/**
 * useAvatarConnection Hook
 * Manages avatar WebRTC connection with Akool/Agora integration
 * Includes retry logic, performance monitoring, and graceful degradation
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import AgoraRTC, { type IAgoraRTCClient, type IRemoteVideoTrack, type IRemoteAudioTrack } from 'agora-rtc-sdk-ng';
import type { AvatarState } from '../../types/avatar';
import { AvatarMessageQueue } from '../../services/avatarMessageQueue';

interface UseAvatarConnectionProps {
  enabled: boolean;
  sessionId: string;
  avatarId?: string;
  onStatusChange?: (status: AvatarState) => void;
}

interface AvatarCredentials {
  agora_app_id: string;
  agora_channel: string;
  agora_token: string;
  agora_uid: number;
}

interface UseAvatarConnectionReturn {
  status: AvatarState;
  messageQueue: AvatarMessageQueue;
  sendToAvatar: (text: string, isFinal?: boolean) => Promise<void>;
  setStatus: (status: AvatarState) => void;
  cleanup: () => void;
  retryConnection: () => Promise<void>;
}

export function useAvatarConnection({
  enabled,
  sessionId,
  avatarId = 'dvp_Tristan_cloth2_1080P',
  onStatusChange
}: UseAvatarConnectionProps): UseAvatarConnectionReturn {
  
  const [status, setStatusState] = useState<AvatarState>('idle');
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const MAX_CONNECTION_ATTEMPTS = 3;
  
  // Refs for persistent state across re-renders
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const credentialsRef = useRef<AvatarCredentials | null>(null);
  const messageQueueRef = useRef(new AvatarMessageQueue());
  const retryCountRef = useRef(0);
  const isConnectingRef = useRef(false);
  const hasFailedRef = useRef(false);

  // TEMPORARY: Direct API test mode
  const USE_DIRECT_API = true; // Toggle this for testing

  /**
   * Set status with external callback notification
   */
  const setStatus = useCallback((newStatus: AvatarState) => {
    console.log(`[Avatar] Status: ${status} -> ${newStatus}`);
    setStatusState(newStatus);
    onStatusChange?.(newStatus);
  }, [status, onStatusChange]);

  /**
   * TEMPORARY: Direct AKOOL API connection for testing
   */
  const connectAvatarDirect = useCallback(async (): Promise<void> => {
    try {
      setStatus('connecting');
      
      // Step 1: Get auth token directly from AKOOL
      console.log('[Avatar Direct] Getting auth token from AKOOL...');
      
      const tokenResponse = await fetch('https://openapi.akool.com/api/open/v3/getToken', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          clientId: 'A7mt90cBGUmh2tOO+eruMg==',
          clientSecret: import.meta.env.VITE_AKOOL_API_KEY || 'sk-f2pyg8v5hqzjwit7x1lk' // From edge function
        })
      });
      
      const tokenData = await tokenResponse.json();
      console.log('[Avatar Direct] Token response:', {
        code: tokenData.code,
        hasToken: !!tokenData.token,
        message: tokenData.message
      });
      
      if (tokenData.code !== 1000 || !tokenData.token) {
        throw new Error(`Failed to get token: ${tokenData.message || 'Unknown error'}`);
      }
      
      // Step 2: Create avatar session
      console.log('[Avatar Direct] Creating avatar session...');
      
      const sessionResponse = await fetch('https://openapi.akool.com/api/open/v4/liveAvatar/session/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokenData.token}`
        },
        body: JSON.stringify({
          avatar_id: avatarId,
          duration: 600 // 10 minutes
        })
      });
      
      const sessionData = await sessionResponse.json();
      console.log('[Avatar Direct] Session response:', {
        success: sessionData.success,
        hasData: !!sessionData.data,
        sessionId: sessionData.data?._id,
        message: sessionData.message
      });
      
      if (!sessionData.success || !sessionData.data) {
        throw new Error(`Session creation failed: ${sessionData.message || 'Unknown error'}`);
      }
      
      // Step 3: Poll for ready state
      console.log('[Avatar Direct] Polling for session ready...');
      let attempts = 0;
      let credentials = null;
      
      while (attempts < 30 && !credentials) {
        const pollResponse = await fetch(`https://openapi.akool.com/api/open/v4/liveAvatar/session/${sessionData.data._id}`, {
          headers: {
            'Authorization': `Bearer ${tokenData.token}`
          }
        });
        
        const pollData = await pollResponse.json();
        
        if (pollData.success && pollData.data.stream_status === 2) {
          credentials = {
            agora_app_id: pollData.data.agora_app_id,
            agora_channel: pollData.data.agora_channel,
            agora_token: pollData.data.agora_token,
            agora_uid: pollData.data.agora_uid
          };
          console.log('[Avatar Direct] Session ready!', credentials);
          break;
        }
        
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      if (!credentials) {
        throw new Error('Session timeout - failed to get ready state');
      }
      
      credentialsRef.current = credentials;
      
      // Step 4: Connect to Agora
      const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      clientRef.current = client;
      
      setupAgoraHandlers(client);
      
      await client.join(
        credentials.agora_app_id,
        credentials.agora_channel,
        credentials.agora_token,
        credentials.agora_uid
      );
      
      setStatus('ready');
      console.log('[Avatar Direct] Successfully connected!');
      
    } catch (error) {
      console.error('[Avatar Direct] Connection failed:', error);
      setStatus('error');
      throw error;
    }
  }, [avatarId, setStatus]);

  /**
   * Setup Agora event handlers for avatar video/audio streams
   */
  const setupAgoraHandlers = useCallback((client: IAgoraRTCClient) => {
    // CRITICAL: Add stream-message handler for Akool avatar responses
    client.on('stream-message', (uid: number | string, message: Uint8Array | string) => {
      console.log('[Avatar] Received stream message from uid:', uid);
      try {
        // Decode message if it's binary
        let decodedMessage = message;
        if (message instanceof Uint8Array) {
          decodedMessage = new TextDecoder().decode(message);
        }
        console.log('[Avatar] Stream message content:', decodedMessage);
        
        // Parse if it's JSON
        if (typeof decodedMessage === 'string' && decodedMessage.startsWith('{')) {
          const parsedMessage = JSON.parse(decodedMessage);
          console.log('[Avatar] Parsed message:', parsedMessage);
          
          // Handle avatar status messages
          if (parsedMessage.type === 'status' || parsedMessage.status) {
            console.log('[Avatar] Avatar status update:', parsedMessage);
          }
        }
      } catch (error) {
        console.error('[Avatar] Error handling stream message:', error);
      }
    });
    
    client.on('user-published', async (user, mediaType) => {
      console.log(`[Avatar] User published ${mediaType}:`, user.uid);
      
      try {
        await client.subscribe(user, mediaType);
        
        if (mediaType === 'video') {
          const remoteVideoTrack = user.videoTrack as IRemoteVideoTrack;
          
          // Play in avatar container
          const container = document.getElementById('avatar-video-container');
          if (container && remoteVideoTrack) {
            remoteVideoTrack.play(container);
            setStatus('active');
            console.log('[Avatar] Video stream connected');
          }
        }
        
        if (mediaType === 'audio') {
          const remoteAudioTrack = user.audioTrack as IRemoteAudioTrack;
          
          // Play in separate audio element for avatar audio
          const avatarAudio = document.getElementById('avatar-audio') as HTMLAudioElement;
          if (avatarAudio && remoteAudioTrack) {
            remoteAudioTrack.play();
            console.log('[Avatar] Audio stream connected');
          }
        }
      } catch (error) {
        console.error('[Avatar] Failed to subscribe to user:', error);
        setStatus('error');
      }
    });

    client.on('user-unpublished', (user, mediaType) => {
      console.log(`[Avatar] User unpublished ${mediaType}:`, user.uid);
      if (status === 'active') {
        setStatus('ready');
      }
    });

    client.on('user-left', (user) => {
      console.log('[Avatar] User left:', user.uid);
      setStatus('disconnected');
    });

    // Add performance monitoring
    client.on('network-quality', (stats) => {
      const quality = stats.downlinkNetworkQuality;
      console.log('[Avatar] Network quality:', quality);
      
      if (quality <= 2 && status === 'active') { // Poor quality
        setStatus('degraded');
        console.warn('[Avatar] Poor network quality, entering degraded mode');
      }
    });

    client.on('connection-state-change', (curState, revState) => {
      console.log(`[Avatar] Connection state: ${revState} -> ${curState}`);
      
      if (curState === 'DISCONNECTED' || curState === 'DISCONNECTING') {
        setStatus('disconnected');
      }
    });

    client.on('exception', (event) => {
      console.error('[Avatar] Client exception:', event);
      setStatus('error');
    });
  }, [status, setStatus]);

  /**
   * Connect to avatar with retry logic (3 attempts with exponential backoff)
   */
  const connectAvatar = useCallback(async (retries = 3): Promise<void> => {
    if (isConnectingRef.current) return;
    isConnectingRef.current = true;

    try {
      setStatus('connecting');
      
      // Create Akool session via our Supabase edge function
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://gypnutyegqxelvsqjedu.supabase.co';
      
      // Get the user's session token for proper authentication
      const { supabase } = await import('../../integrations/supabase/client');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No authenticated session found');
      }
      
      // Try multiple avatar IDs in case one is busy
      // These are common AKOOL avatar IDs - the edge function will also suggest alternatives
      const avatarIdsToTry = [
        avatarId,
        'dvp_Tristan_cloth2_1080P',
        'dvp_josh_1080P',
        'dvp_anna_1080P',
        'dvp_lily_1080P'
      ].filter(Boolean); // Remove any undefined values

      let lastError: Error | null = null;
      let credentials: AvatarCredentials | null = null;

      // Try each avatar ID until one works
      for (const currentAvatarId of avatarIdsToTry) {
        try {
          console.log(`[Avatar] Trying avatar: ${currentAvatarId}`);
          console.log('[Avatar] Creating session via edge function:', `${supabaseUrl}/functions/v1/avatar-session`);
          console.log('[Avatar] Session ID:', sessionId, 'Avatar ID:', currentAvatarId);
          
          const response = await fetch(`${supabaseUrl}/functions/v1/avatar-session`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}` // Use the user's actual JWT token
            },
            body: JSON.stringify({ sessionId, avatarId: currentAvatarId })
          });
          
          console.log('[Avatar] Edge function response status:', response.status);
          
          // Get response text first for debugging
          const responseText = await response.text();
          console.log('[Avatar] Edge function raw response:', responseText);
          
          if (!response.ok) {
            let errorDetail = '';
            try {
              const errorData = JSON.parse(responseText);
              errorDetail = errorData.error || errorData.message || responseText;
              console.error('[Avatar] Edge function error parsed:', errorData);
              
              // Check if it's a "busy avatar" error
              if (errorDetail.includes('busy') || errorDetail.includes('1215')) {
                console.log(`[Avatar] Avatar ${currentAvatarId} is busy, trying next...`);
                
                // Check if the error message includes available avatars
                const availableMatch = errorDetail.match(/Available avatars: (.+)/);
                if (availableMatch) {
                  const suggestedAvatars = availableMatch[1].split(', ');
                  console.log('[Avatar] Server suggested available avatars:', suggestedAvatars);
                  
                  // Add suggested avatars to our list if not already there
                  for (const suggested of suggestedAvatars) {
                    if (!avatarIdsToTry.includes(suggested)) {
                      avatarIdsToTry.push(suggested);
                    }
                  }
                }
                
                lastError = new Error(`Avatar ${currentAvatarId} is busy`);
                continue; // Try next avatar
              }
            } catch {
              errorDetail = responseText;
              console.error('[Avatar] Could not parse error response:', responseText);
            }
            
            if (response.status === 405) {
              throw new Error(`Method not allowed - check edge function deployment. Details: ${errorDetail}`);
            }
            if (response.status === 429) {
              throw new Error('Avatar limit reached');
            }
            if (response.status === 402) {
              throw new Error('Avatar quota exceeded');
            }
            throw new Error(`Avatar session creation failed (${response.status}): ${errorDetail}`);
          }
          
          // Parse successful response
          try {
            const data = JSON.parse(responseText);
            console.log('[Avatar] Edge function success data:', data);
            credentials = data.credentials;
            credentialsRef.current = credentials;
            break; // Success! Exit the loop
          } catch (error) {
            console.error('[Avatar] Failed to parse success response:', error);
            throw new Error(`Invalid response format: ${responseText}`);
          }
          
        } catch (error) {
          console.error(`[Avatar] Failed with avatar ${currentAvatarId}:`, error);
          lastError = error as Error;
          
          // If it's not a busy error, don't try other avatars
          const errorMessage = (error as Error).message;
          if (!errorMessage.includes('busy') && !errorMessage.includes('1215')) {
            throw error;
          }
          // Continue to next avatar for busy errors
        }
      }

      if (!credentials) {
        throw lastError || new Error('All avatars are busy. Please try again later.');
      }
      
      // Initialize Agora client
      const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      clientRef.current = client;
      
      // Setup event handlers before joining
      setupAgoraHandlers(client);
      
      // Join Agora channel
      await client.join(
        credentials.agora_app_id,
        credentials.agora_channel,
        credentials.agora_token,
        credentials.agora_uid
      );
      
      setStatus('ready');
      retryCountRef.current = 0; // Reset retry count on success
      
    } catch (error) {
      console.error('[Avatar] Connection failed:', error);
      
      if (retries > 0) {
        const backoffDelay = 1000 * (4 - retries); // Exponential backoff: 1s, 2s, 3s
        console.log(`[Avatar] Retrying in ${backoffDelay}ms (${retries} attempts left)`);
        
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
        retryCountRef.current++;
        return connectAvatar(retries - 1);
      }
      
      setStatus('error');
      throw error;
    } finally {
      isConnectingRef.current = false;
    }
  }, [sessionId, avatarId, setStatus, setupAgoraHandlers]);

  /**
   * Send text to avatar with message queue handling
   */
  const sendToAvatar = useCallback(async (text: string, isFinal: boolean = false) => {
    if (!clientRef.current || status !== 'active') {
      console.warn('[Avatar] Cannot send message, client not active');
      return;
    }

    try {
      // Cast to ExtendedRTCClient to access sendStreamMessage
      const extendedClient = clientRef.current as IAgoraRTCClient & { sendStreamMessage: (message: string | Uint8Array) => Promise<void> }; // Type assertion needed for hidden Agora method
      await messageQueueRef.current.sendMessage(extendedClient, text, isFinal);
    } catch (error) {
      console.error('[Avatar] Failed to send message:', error);
      throw error;
    }
  }, [status]);

  /**
   * Cleanup avatar connection and resources
   */
  const cleanup = useCallback(async () => {
    console.log('[Avatar] Cleaning up connection');
    
    // Clear message queue
    messageQueueRef.current.cleanup();
    
    // Leave Agora channel and cleanup client
    if (clientRef.current) {
      try {
        await clientRef.current.leave();
        clientRef.current.removeAllListeners();
      } catch (error) {
        console.error('[Avatar] Cleanup error:', error);
      }
      clientRef.current = null;
    }
    
    // Reset state
    credentialsRef.current = null;
    retryCountRef.current = 0;
    isConnectingRef.current = false;
    setStatus('idle');
  }, [setStatus]);

  /**
   * Retry connection manually
   */
  const retryConnection = useCallback(async () => {
    await cleanup();
    if (enabled) {
      await connectAvatar();
    }
  }, [enabled, connectAvatar, cleanup]);

  // Effect to handle connection lifecycle
  useEffect(() => {
    console.log('[Avatar] Effect triggered:', { 
      enabled, 
      status, 
      connectionAttempts, 
      hasFailedRef: hasFailedRef.current 
    });
    
    // Only try to connect if:
    // 1. Avatar is enabled
    // 2. Status is idle (not already connecting)
    // 3. We haven't exceeded max attempts
    // 4. We haven't already marked this as failed
    if (enabled && status === 'idle' && connectionAttempts < MAX_CONNECTION_ATTEMPTS && !hasFailedRef.current) {
      console.log('[Avatar] Starting connection attempt', connectionAttempts + 1);
      setConnectionAttempts(prev => prev + 1);
      
      connectAvatar().catch(error => {
        console.error('[Avatar] Initial connection failed:', error);
        hasFailedRef.current = true; // Mark as failed to prevent infinite retries
      });
    } else if (!enabled && status !== 'idle') {
      // Reset when disabled
      cleanup();
      setConnectionAttempts(0);
      hasFailedRef.current = false;
    }
  }, [enabled, status, connectionAttempts, connectAvatar, cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);



  return {
    status,
    messageQueue: messageQueueRef.current,
    sendToAvatar,
    setStatus,
    cleanup,
    retryConnection
  };
} 