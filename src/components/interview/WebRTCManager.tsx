import { useState, useEffect } from 'react';
import './WebRTCManager.css';
import { useWebRTC, WebRTCConfig } from '../../hooks/webrtc';

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
  openAISettings = {
    voice: 'alloy',
    temperature: 0.7,
    maximumLength: 5
  }
}) => {
  // Local state for component-specific UI elements
  const [error, setError] = useState<string | null>(null);
  const [autoReconnectDisabled, setAutoReconnectDisabled] = useState<boolean>(false);

  // Configure WebRTC settings
  const webRTCConfig: WebRTCConfig = {
    serverUrl: serverUrl || (simulationMode ? 'wss://interview-simulation-proxy.fly.dev/ws' : undefined),
    simulationMode,
    openAIMode,
    openAIKey,
    jobDescription,
    resume,
    openAISettings
  };

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

  // Extract status values for easier access
  const { 
    connectionState, 
    isConnecting, 
    isReady,
    audioLevel,
    isRecording 
  } = status;

  // Initialize WebRTC connection on component mount
  useEffect(() => {
    if (autoReconnectDisabled) {
      console.log('Auto-reconnect disabled - not attempting connection');
      return;
    }

    console.log('Component mounted - initializing session once');
    
    // Add a slight delay to ensure DOM is fully mounted
    const initTimeout = setTimeout(() => {
      initialize().catch(err => {
        console.error('Error initializing WebRTC:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize WebRTC');
      });
    }, 500);

    return () => {
      clearTimeout(initTimeout);
      console.log('Component unmounting - cleaning up resources');
      cleanup();
    };
  }, [sessionId, initialize, cleanup, autoReconnectDisabled]);

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
        {renderConnectionDots()}

        {error && connectionState !== 'connected' && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {connectionState === 'connected' && (
          <div className="success-message">
            <span className="success-icon">✅</span>
            <span>WebSocket connection successful! Receiving transcript data.</span>
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
          onClick={cleanup}
          className="disconnect-button"
          disabled={connectionState === 'disconnected'}
        >
          End Interview
        </button>

        {connectionState === 'ice_failed' || connectionState === 'connection_failed' || connectionState === 'error' ? (
          <>
            <button
              onClick={() => window.location.reload()}
              className="reconnect-button"
            >
              Reload Page
            </button>
            <button
              onClick={() => setAutoReconnectDisabled(true)}
              className="reconnect-button"
              style={{ backgroundColor: '#dc3545' }}
            >
              Stop Reconnecting
            </button>
          </>
        ) : null}

        {autoReconnectDisabled && (
          <div className="reconnect-disabled-notice">
            Auto-reconnect disabled. Reload page to try again.
          </div>
        )}
      </div>

      {simulationMode && (
        <div className="simulation-badge">
          SIMULATION MODE
        </div>
      )}

      {openAIMode && (
        <div className="openai-badge">
          DIRECT OPENAI CONNECTION
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .success-message {
          background-color: #d4edda;
          color: #155724;
          padding: 8px 12px;
          border-radius: 4px;
          margin-top: 8px;
          display: flex;
          align-items: center;
        }
        .success-icon {
          margin-right: 8px;
          font-size: 18px;
        }
        .simulation-badge {
          position: absolute;
          top: 10px;
          right: 10px;
          background-color: #ffc107;
          color: #212529;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: bold;
        }
        .openai-badge {
          position: absolute;
          top: 10px;
          right: 10px;
          background-color: #10a37f;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: bold;
        }
      `}} />
    </div>
  );
};