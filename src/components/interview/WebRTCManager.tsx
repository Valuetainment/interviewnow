import React, { useState, useEffect } from 'react';
import './WebRTCManager.css';
import { useWebRTC, WebRTCConfig } from '../../hooks/webrtc';

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
  }, [sessionId, autoReconnectDisabled, simulationMode, serverUrl]);

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

              {error.includes('simulation parameter') && (
                <button
                  onClick={() => {
                    if (serverUrl && !serverUrl.includes('simulation=true')) {
                      const newUrl = serverUrl + (serverUrl.includes('?') ? '&' : '?') + 'simulation=true';
                      window.location.href = window.location.href.split('?')[0] + '?serverUrl=' + encodeURIComponent(newUrl);
                    } else {
                      window.location.reload();
                    }
                  }}
                  className="action-button"
                >
                  Fix Simulation Parameter
                </button>
              )}
            </div>
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
        .error-message {
          background-color: #f8d7da;
          color: #721c24;
          padding: 12px 16px;
          border-radius: 4px;
          margin-top: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .error-icon {
          margin-right: 8px;
          font-size: 18px;
        }
        .error-actions {
          margin-top: 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .action-button {
          background-color: #0d6efd;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 8px 16px;
          cursor: pointer;
          font-size: 14px;
          transition: background-color 0.2s;
        }
        .action-button:hover {
          background-color: #0b5ed7;
        }
        .error-hint {
          background-color: #fff3cd;
          color: #856404;
          padding: 10px;
          border-radius: 4px;
          margin-top: 8px;
          font-size: 14px;
        }
        .error-hint ul {
          margin: 8px 0 0 0;
          padding-left: 20px;
        }
        .error-hint li {
          margin-bottom: 4px;
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