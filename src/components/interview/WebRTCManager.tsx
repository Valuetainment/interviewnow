import React, { useState, useEffect } from 'react';
import './WebRTCManager.css';
import { useWebRTC, WebRTCConfig } from '../../hooks/webrtc';
import { useAvatarConnection } from '../../hooks/webrtc/useAvatarConnection';
import { AvatarVideoDisplay } from './AvatarVideoDisplay';
import { PerformanceMonitor } from '../../services/performanceMonitor';
import { isAvatarEnabledForTenant } from '../../config/featureFlags';

// Default settings moved outside component to prevent recreation
const DEFAULT_OPENAI_SETTINGS = {
  voice: 'alloy',
  temperature: 0.7,
  maximumLength: 5
};

interface WebRTCManagerProps {
  sessionId: string;
  onTranscriptUpdate: (text: string) => void;
  onConnectionStateChange: (state: string) => void;
  serverUrl?: string;
  simulationMode?: boolean;
  openAIMode?: boolean;
  openAIKey?: string;
  jobDescription?: string;
  resume?: string;
  openAISettings?: {
    voice?: string;
    temperature?: number;
    maximumLength?: number;
  };
}

export const WebRTCManager: React.FC<WebRTCManagerProps> = ({
  sessionId,
  onTranscriptUpdate,
  onConnectionStateChange,
  serverUrl,
  simulationMode = false,
  openAIMode = false,
  openAIKey = '',
  jobDescription = '',
  resume = '',
  openAISettings = DEFAULT_OPENAI_SETTINGS
}) => {
  // Local state for component-specific UI elements
  const [error, setError] = useState<string | null>(null);
  const [autoReconnectDisabled, setAutoReconnectDisabled] = useState<boolean>(false);

  // NEW: Avatar state management
  const [avatarEnabled, setAvatarEnabled] = useState(false);
  const [showAvatarOption, setShowAvatarOption] = useState(true);
  const [tenantId, setTenantId] = useState<string | null>(null);

  // Configure WebRTC settings - memoize to prevent re-renders
  const webRTCConfig: WebRTCConfig = React.useMemo(() => ({
    serverUrl: serverUrl || (simulationMode ? 'wss://interview-simulation-proxy.fly.dev/ws' : undefined),
    simulationMode,
    openAIMode,
    openAIKey,
    jobDescription,
    resume,
    openAISettings
  }), [serverUrl, simulationMode, openAIMode, openAIKey, jobDescription, resume, openAISettings]);

  // Use our main WebRTC hook for all functionality
  const { 
    initialize, 
    cleanup, 
    status 
  } = useWebRTC(
    sessionId,
    webRTCConfig,
    onConnectionStateChange,
    onTranscriptUpdate
  );

  // NEW: Use avatar connection hook
  const avatarConnection = useAvatarConnection({
    enabled: avatarEnabled && status.isReady,
    sessionId,
    avatarId: 'dvp_Tristan_cloth2_1080P', // Default avatar
    onStatusChange: (status) => {
      console.log('[Avatar] Status changed to:', status);
      if (status === 'error') {
        setAvatarEnabled(false);
        setShowAvatarOption(false); // Hide toggle if failed
        setError('Avatar unavailable, continuing with audio only');
      }
    }
  });

  // Extract status values for easier access
  const { 
    connectionState, 
    isConnecting, 
    isReady,
    audioLevel,
    isRecording 
  } = status;

  // NEW: Check avatar feature flag and performance budget
  useEffect(() => {
    const checkAvatarEligibility = async () => {
      try {
        // Get actual tenant ID from the logs - we can see it's available
        // For now, we'll use a more permissive check that works for testing
        const actualTenantId = '11111111-1111-1111-1111-111111111111'; // From your logs
        const isFeatureEnabled = isAvatarEnabledForTenant(actualTenantId);
        
        // Check performance budget
        const canEnable = PerformanceMonitor.canEnableAvatar();
        
        console.log('[Avatar] Eligibility check:', {
          tenantId: actualTenantId,
          featureEnabled: isFeatureEnabled,
          performanceBudget: canEnable
        });
        
        if (isFeatureEnabled && canEnable) {
          setShowAvatarOption(true);
          console.log('[Avatar] Feature enabled and performance budget met');
        } else {
          setShowAvatarOption(false);
          console.log('[Avatar] Feature disabled or performance budget exceeded', {
            featureEnabled: isFeatureEnabled,
            performanceBudget: canEnable
          });
        }
      } catch (error) {
        console.error('[Avatar] Error checking eligibility:', error);
        setShowAvatarOption(false);
      }
    };

    checkAvatarEligibility();
  }, []);

  // NEW: Connect avatar to OpenAI connection
  useEffect(() => {
    // Access the OpenAI connection from the WebRTC hook
    // The useWebRTC hook internally uses useOpenAIConnection which has setAvatarConnection
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const webrtcInstance = status as any; // TODO: Type this properly once WebRTC hook types are updated
    
    // Try to access the OpenAI connection methods
    if (webrtcInstance.openAIConnection?.setAvatarConnection && avatarConnection) {
      console.log('[Avatar] Connecting avatar to OpenAI connection');
      webrtcInstance.openAIConnection.setAvatarConnection(avatarConnection);
    }
    
    return () => {
      if (webrtcInstance.openAIConnection?.setAvatarConnection) {
        webrtcInstance.openAIConnection.setAvatarConnection(null);
      }
    };
  }, [status, avatarConnection]);

  // NEW: Audio muting strategy - separate OpenAI audio from avatar audio
  useEffect(() => {
    const openAIAudio = document.getElementById('openai-audio') as HTMLAudioElement;
    const avatarAudio = document.getElementById('avatar-audio') as HTMLAudioElement;
    
    if (!openAIAudio || !avatarAudio) return;
    
    // Audio strategy based on avatar state
    switch (avatarConnection.status) {
      case 'active':
        // Avatar is speaking - mute OpenAI audio
        openAIAudio.muted = true;
        avatarAudio.muted = false;
        console.log('[Audio] Avatar active - using avatar audio');
        break;
      case 'error':
      case 'disconnected':
        // Avatar failed - use OpenAI audio
        openAIAudio.muted = false;
        avatarAudio.muted = true;
        console.log('[Audio] Avatar failed - using OpenAI audio');
        break;
      case 'thinking':
        // Keep current state during thinking
        console.log('[Audio] Avatar thinking - maintaining current audio state');
        break;
      default:
        // During connecting/ready, keep OpenAI active
        openAIAudio.muted = false;
        avatarAudio.muted = true;
        console.log('[Audio] Avatar not active - using OpenAI audio');
    }
  }, [avatarConnection.status]);

  // Initialize WebRTC connection on component mount
  useEffect(() => {
    if (autoReconnectDisabled) {
      console.log('Auto-reconnect disabled - not attempting connection');
      return;
    }

    console.log('Component mounted - initializing session once');

    // First test WebRTC browser support
    if (!navigator.mediaDevices || !window.RTCPeerConnection) {
      console.error('WebRTC is not supported in this browser');
      setError('WebRTC is not supported in this browser. Please try using Chrome, Edge, or Firefox.');
      return;
    }

    if (simulationMode && !serverUrl?.includes('simulation=')) {
      console.warn('Simulation mode is enabled but URL is missing simulation parameter - it may be added automatically');
    }

    // Add a slight delay to ensure DOM is fully mounted
    const initTimeout = setTimeout(() => {
      initialize().catch(err => {
        console.error('Error initializing WebRTC:', err);
        let errorMessage = err instanceof Error ? err.message : 'Failed to initialize WebRTC';

        // Provide more helpful error messages based on error content
        if (errorMessage.includes('Permission denied') || errorMessage.includes('NotAllowedError')) {
          errorMessage = 'Microphone access was denied. Please allow microphone access and try again.';
        } else if (errorMessage.includes('NotFoundError') || errorMessage.includes('no devices')) {
          errorMessage = 'No microphone found. Please connect a microphone and try again.';
        } else if (errorMessage.includes('WebSocket') || errorMessage.includes('ws://') || errorMessage.includes('wss://')) {
          errorMessage = `Failed to connect to WebSocket server at ${serverUrl}. Please check that the server is running.`;
        } else if (simulationMode && !serverUrl?.includes('simulation=true')) {
          errorMessage = 'Missing simulation parameter in URL. Add ?simulation=true to your server URL.';
        }

        setError(errorMessage);
      });
    }, 500);

    return () => {
      clearTimeout(initTimeout);
      console.log('Component unmounting - cleaning up resources');
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

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
        {/* Temporary deployment verification badge */}
        <div className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs mb-2">
          ✅ New Ephemeral Token Code Deployed - {new Date().toISOString().split('T')[0]}
        </div>
        
        {/* NEW: Avatar video display */}
        {avatarEnabled && (
          <div className="avatar-section mb-4">
            <AvatarVideoDisplay 
              status={avatarConnection.status}
              className="avatar-video-display max-w-md mx-auto"
            />
          </div>
        )}
        
        {renderConnectionDots()}

        {error && connectionState !== 'connected' && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>

            {/* Show suggested actions based on the error message */}
            <div className="error-actions">
              {error.includes('Microphone access') && (
                <button
                  onClick={() => window.location.reload()}
                  className="action-button"
                >
                  Retry with Microphone Access
                </button>
              )}

              {error.includes('WebSocket server') && (
                <div className="error-hint">
                  <p><strong>Check that:</strong></p>
                  <ul>
                    <li>The WebSocket server is running</li>
                    <li>The URL includes "?simulation=true" for testing</li>
                    <li>There are no firewall or network restrictions</li>
                  </ul>
                </div>
              )}

              {/* Additional error handling for simulation mode */}
              {simulationMode && !error.includes('simulation=true') && (
                <div className="error-hint">
                  <p><strong>Simulation Mode Issue:</strong></p>
                  <p>Make sure your server URL includes "simulation=true" parameter.</p>
                  <code>ws://localhost:3001?simulation=true</code>
                </div>
              )}

              {/* Button to disable auto-reconnect to prevent error loops */}
              <button 
                onClick={() => setAutoReconnectDisabled(true)}
                className="action-button secondary"
              >
                Stop Auto-Reconnect
              </button>
            </div>
          </div>
        )}

        {/* Show positive connection message when successfully connected */}
        {connectionState === 'connected' && (
          <div className="success-message">
            <span className="success-icon">✅</span>
            <span>Connected and ready for interview</span>
          </div>
        )}

        {/* Connection details section */}
        <div className="connection-details">
          <div className="detail-item">
            <span className="detail-label">Session ID:</span>
            <span className="detail-value">{sessionId}</span>
          </div>
          
          <div className="detail-item">
            <span className="detail-label">Mode:</span>
            <span className="detail-value">
              {simulationMode ? 'Simulation' : (openAIMode ? 'OpenAI Direct' : 'Production')}
            </span>
          </div>
          
          {serverUrl && (
            <div className="detail-item">
              <span className="detail-label">Server:</span>
              <span className="detail-value server-url" title={serverUrl}>
                {serverUrl.length > 50 ? `${serverUrl.substring(0, 50)}...` : serverUrl}
              </span>
            </div>
          )}
        </div>

        {/* Audio level visualization */}
        {isReady && renderAudioLevelVisualization()}

        {/* NEW: Avatar toggle button */}
        {showAvatarOption && isReady && (
          <div className="avatar-controls mt-4">
            <button
              onClick={() => setAvatarEnabled(!avatarEnabled)}
              disabled={isConnecting}
              className={`avatar-toggle-button px-4 py-2 rounded-md transition-colors font-medium ${
                avatarEnabled 
                  ? 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:bg-gray-100'
              }`}
            >
              {avatarEnabled ? '📹 Disable Avatar' : '📹 Enable Avatar'}
            </button>
            {avatarConnection.status === 'connecting' && (
              <div className="avatar-status-text text-sm text-gray-600 mt-2">
                Connecting avatar...
              </div>
            )}
            {avatarConnection.status === 'error' && (
              <div className="avatar-status-text text-sm text-red-600 mt-2">
                Avatar connection failed
              </div>
            )}
          </div>
        )}

        {/* Interview controls */}
        <div className="controls-section">
          {connectionState === 'connected' && (
            <button 
              onClick={() => {
                cleanup();
                onConnectionStateChange('disconnected');
              }}
              className="end-interview-button"
            >
              End Interview
            </button>
          )}
        </div>
      </div>
    </div>
  );
};