import { useState, useEffect, forwardRef, useImperativeHandle, useRef } from 'react';
import { useWebRTC, WebRTCConfig } from '../../hooks/webrtc';

interface SimpleWebRTCManagerProps {
  sessionId: string;
  onTranscriptUpdate: (text: string) => void;
  onConnectionStateChange: (state: string) => void;
  serverUrl?: string;
  simulationMode?: boolean;
  openAIMode?: boolean;
  openAIKey?: string;
  autoConnect?: boolean; // New property to control automatic connection
}

// Export interface for the ref to expose methods to parent
export interface SimpleWebRTCManagerRef {
  initialize: () => Promise<boolean>;
  cleanup: () => void;
}

/**
 * A simplified WebRTCManager component without audio visualization
 * This component is used for testing the WebRTC connection without
 * the risk of infinite loops from audio visualization.
 */
export const SimpleWebRTCManager = forwardRef<SimpleWebRTCManagerRef, SimpleWebRTCManagerProps>(({
  sessionId,
  onTranscriptUpdate,
  onConnectionStateChange,
  serverUrl,
  simulationMode = false,
  openAIMode = false,
  openAIKey = '',
  autoConnect = true // Default to true for backward compatibility
}, ref) => {
  // Local state for component-specific UI elements
  const [error, setError] = useState<string | null>(null);
  const [autoReconnectDisabled, setAutoReconnectDisabled] = useState<boolean>(false);

  // Create a stable component ID for debugging across renders
  const componentIdRef = useRef<string>(`webrtc-${new Date().getTime()}-${Math.random().toString(36).substring(2, 9)}`);

  // Reference to track error boundary status
  const hasErroredRef = useRef<boolean>(false);

  // Simple error boundary implementation via try/catch
  try {
    if (hasErroredRef.current) {
      console.log(`[${componentIdRef.current}] Component previously errored, resetting error state`);
      hasErroredRef.current = false;
    }

  // Configure WebRTC settings with React-specific optimizations
  const webRTCConfig: WebRTCConfig = {
    // Ensure simulation parameter is correctly added to the URL if not already there
    // Also add react=true parameter to enable React-specific optimizations
    serverUrl: serverUrl
      ? (
          // Handle existing parameters in the URL
          serverUrl.includes('simulation=')
            ? (
                // Add react=true if not already there
                serverUrl.includes('react=')
                  ? serverUrl
                  : `${serverUrl}&react=true`
              )
            : `${serverUrl}${serverUrl.includes('?') ? '&' : '?'}simulation=true&react=true`
        )
      : (simulationMode ? 'ws://localhost:3001?simulation=true&react=true' : undefined),
    simulationMode,
    openAIMode,
    openAIKey
  };

  // Log the configured server URL to make debugging easier
  console.log('WebRTC configured with serverUrl:', webRTCConfig.serverUrl);
  console.log('Simulation mode is:', simulationMode);

  // Use our main WebRTC hook for all functionality but disable the audio visualization
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

  // Expose methods to parent component via ref
  useImperativeHandle(ref, () => ({
    initialize: async () => {
      console.log('Initialize method called via ref');
      try {
        const success = await initialize();
        if (!success) {
          setError('Failed to initialize WebRTC connection');
        }
        return success;
      } catch (err) {
        console.error('Error initializing WebRTC:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize WebRTC');
        return false;
      }
    },
    cleanup
  }));

  // Extract status values for easier access
  const {
    connectionState,
    isConnecting,
    isConnected
  } = status;

  // Initialize WebRTC connection on component mount if autoConnect is true
  useEffect(() => {
    const componentId = `webrtc-${new Date().getTime()}-${Math.random().toString(36).substring(2, 9)}`;
    console.log(`[${componentId}] SimpleWebRTCManager effect running`);
    console.log(`[${componentId}] Component params: sessionId=${sessionId}, autoConnect=${autoConnect}, serverUrl=${webRTCConfig.serverUrl}`);

    // Store effect mount time for lifecycle debugging
    const mountTime = new Date();
    console.log(`[${componentId}] Component mounted at ${mountTime.toISOString()}`);

    // Skip initialization if auto-connect is disabled
    if (!autoConnect) {
      console.log(`[${componentId}] Auto-connect is disabled - waiting for manual connection`);
      return () => {
        // No cleanup needed since we didn't initialize
        const unmountTime = new Date();
        const mountDuration = unmountTime.getTime() - mountTime.getTime();
        console.log(`[${componentId}] Component effect cleanup after ${mountDuration}ms - no connection to clean up`);
      };
    }

    if (autoReconnectDisabled) {
      console.log(`[${componentId}] Auto-reconnect disabled - not attempting connection`);
      return () => {
        // No cleanup needed
        const unmountTime = new Date();
        const mountDuration = unmountTime.getTime() - mountTime.getTime();
        console.log(`[${componentId}] Component effect cleanup after ${mountDuration}ms - auto-reconnect disabled`);
      };
    }

    console.log(`[${componentId}] SimpleWebRTCManager mounted - initializing session`);
    console.log(`[${componentId}] Using serverUrl: ${webRTCConfig.serverUrl}`);
    console.log(`[${componentId}] React optimizations enabled: ${webRTCConfig.serverUrl?.includes('react=true')}`);

    // Store whether initialization has completed
    let initialized = false;
    let shouldCleanup = false;

    // Track mounting state to prevent state updates after unmount
    let isMounted = true;

    // Add a slight delay to ensure DOM is fully mounted and parent component is stable
    const initTimeout = setTimeout(() => {
      if (isMounted) {
        console.log(`[${componentId}] Calling initialize() now after ${new Date().getTime() - mountTime.getTime()}ms delay`);

        initialize().then(success => {
          console.log(`[${componentId}] Initialization result: ${success}`);
          initialized = success;

          if (success) {
            console.log(`[${componentId}] Connection successfully initialized with sessionId=${sessionId}`);
          }

          // If component was unmounted during initialization but we got here anyway,
          // we should clean up immediately
          if (!isMounted && initialized) {
            console.log(`[${componentId}] Component was unmounted during initialization - cleaning up`);
            cleanup();
          }
        }).catch(err => {
          console.error(`[${componentId}] Error initializing WebRTC:`, err);
          if (isMounted) {
            setError(err instanceof Error ? err.message : 'Failed to initialize WebRTC');
          }
        });
      } else {
        console.log(`[${componentId}] Component unmounted before initialization could start - skipping`);
      }
    }, 500);

    return () => {
      const unmountTime = new Date();
      const mountDuration = unmountTime.getTime() - mountTime.getTime();
      console.log(`[${componentId}] Component unmounting after ${mountDuration}ms - proper cleanup sequence`);
      isMounted = false;
      clearTimeout(initTimeout);

      // Don't cleanup immediately on unmount if we're in a navigation/re-render
      // This prevents the WebSocket from continuously connecting/disconnecting
      const delayTimeout = 1500; // Extend to 1.5 seconds

      console.log(`[${componentId}] Delaying cleanup by ${delayTimeout}ms to avoid unnecessary reconnections`);
      setTimeout(() => {
        if (mountDuration < 3000) {
          console.log(`[${componentId}] Detected short component lifecycle (${mountDuration}ms) - likely a React re-render`);
          console.log(`[${componentId}] Skipping cleanup to prevent connection churn`);
          return;
        }

        console.log(`[${componentId}] Delayed cleanup executing after ${delayTimeout}ms`);
        if (!shouldCleanup) {
          console.log(`[${componentId}] Cleaning up resources after delay`);
          cleanup();
        } else {
          console.log(`[${componentId}] Cleanup already handled elsewhere`);
        }
      }, delayTimeout);
    };
  }, [sessionId, initialize, cleanup, autoReconnectDisabled, serverUrl, simulationMode, autoConnect]);

  // Render connection indicator based on state
  const getConnectionColor = () => {
    switch (connectionState) {
      case 'connected': return '#4caf50'; // Green
      case 'connecting':
      case 'ws_connected': return '#ff9800'; // Orange
      case 'ice_disconnected': return '#ff9800'; // Orange
      case 'ice_failed':
      case 'connection_failed':
      case 'error': return '#f44336'; // Red
      default: return '#9e9e9e'; // Gray
    }
  };

  // Complete the try block from above
  return (
    <div style={{
      padding: '20px',
      border: '1px solid #ddd',
      borderRadius: '8px',
      margin: '10px 0'
    }}>
      <h3>Simple WebRTC Manager</h3>
      
      {/* Connection Status */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center',
        marginBottom: '10px'
      }}>
        <div style={{ 
          width: '12px', 
          height: '12px', 
          borderRadius: '50%',
          backgroundColor: getConnectionColor(),
          marginRight: '8px'
        }}></div>
        <span>{connectionState}</span>
      </div>

      {/* Error Message */}
      {error && !isConnected && (
        <div style={{
          backgroundColor: '#ffebee',
          color: '#c62828',
          padding: '10px',
          borderRadius: '4px',
          marginBottom: '10px'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Ready to Connect Message */}
      {connectionState === 'disconnected' && !autoConnect && !isConnecting && (
        <div style={{
          backgroundColor: '#e3f2fd',
          color: '#0d47a1',
          padding: '10px',
          borderRadius: '4px',
          marginBottom: '10px'
        }}>
          <strong>Ready to connect:</strong> Click the "Start Connection" button at the top of the page to begin the WebRTC session.
        </div>
      )}

      {/* Success Message */}
      {isConnected && (
        <div style={{
          backgroundColor: '#e8f5e9',
          color: '#2e7d32',
          padding: '10px',
          borderRadius: '4px',
          marginBottom: '10px'
        }}>
          WebSocket connection successful! Receiving transcript data.
        </div>
      )}

      {/* Loading Indicator */}
      {isConnecting && (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center',
          marginBottom: '10px'
        }}>
          <div style={{ 
            width: '20px', 
            height: '20px', 
            border: '3px solid #f3f3f3',
            borderTop: '3px solid #3498db',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginRight: '10px'
          }}></div>
          <span>Connecting to interview session...</span>
        </div>
      )}

      {/* Controls */}
      <div style={{ marginTop: '20px' }}>
        {/* Add Connect button when disconnected and autoConnect is disabled */}
        {connectionState === 'disconnected' && !autoConnect && (
          <button
            onClick={() => {
              console.log('Connect button clicked in SimpleWebRTCManager');
              initialize().catch(err => {
                console.error('Error initializing WebRTC:', err);
                setError(err instanceof Error ? err.message : 'Failed to initialize WebRTC');
              });
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: '#4caf50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginRight: '10px'
            }}
          >
            Connect
          </button>
        )}

        <button
          onClick={cleanup}
          style={{
            padding: '8px 16px',
            backgroundColor: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '10px',
            opacity: connectionState === 'disconnected' && autoConnect ? '0.5' : '1'
          }}
          disabled={connectionState === 'disconnected' && autoConnect}
        >
          End Interview
        </button>

        {(connectionState === 'ice_failed' || connectionState === 'connection_failed' || connectionState === 'error') && (
          <>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '8px 16px',
                backgroundColor: '#2196f3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginRight: '10px'
              }}
            >
              Reload Page
            </button>
            <button
              onClick={() => setAutoReconnectDisabled(true)}
              style={{
                padding: '8px 16px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Stop Reconnecting
            </button>
          </>
        )}
      </div>

      {/* Mode Indicators */}
      <div style={{
        display: 'flex',
        justifyContent: 'flex-end',
        marginTop: '20px'
      }}>
        {simulationMode && (
          <div style={{
            backgroundColor: '#ffc107',
            color: '#212529',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '10px',
            fontWeight: 'bold',
            marginLeft: '10px'
          }}>
            SIMULATION MODE
          </div>
        )}

        {openAIMode && (
          <div style={{
            backgroundColor: '#10a37f',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '10px',
            fontWeight: 'bold',
            marginLeft: '10px'
          }}>
            DIRECT OPENAI CONNECTION
          </div>
        )}

        {/* React optimization indicator */}
        {webRTCConfig.serverUrl?.includes('react=true') && (
          <div style={{
            backgroundColor: '#61dafb', /* React blue */
            color: '#282c34',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '10px',
            fontWeight: 'bold',
            marginLeft: '10px'
          }}>
            REACT OPTIMIZED
          </div>
        )}
      </div>

      {/* Add inline CSS for the spinner animation */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}} />
    </div>
  );

  // Error boundary catch block
  } catch (err) {
    // Mark component as errored
    hasErroredRef.current = true;

    // Log the error
    console.error(`[${componentIdRef.current}] Error in SimpleWebRTCManager:`, err);

    // Return error fallback UI
    return (
      <div style={{
        padding: '20px',
        border: '1px solid #f44336',
        borderRadius: '8px',
        margin: '10px 0',
        backgroundColor: '#ffebee'
      }}>
        <h3 style={{ color: '#d32f2f' }}>WebRTC Connection Error</h3>

        <div style={{
          backgroundColor: '#ffffff',
          padding: '15px',
          borderRadius: '4px',
          marginBottom: '15px',
          border: '1px solid #f44336'
        }}>
          <p><strong>Something went wrong in the WebRTC Manager.</strong></p>
          <p style={{ fontFamily: 'monospace', wordBreak: 'break-word' }}>
            {err instanceof Error ? err.message : 'Unknown error occurred'}
          </p>
          {err instanceof Error && err.stack && (
            <details>
              <summary style={{ cursor: 'pointer', marginTop: '10px' }}>Error Details</summary>
              <pre style={{
                backgroundColor: '#f5f5f5',
                padding: '10px',
                overflow: 'auto',
                marginTop: '10px',
                fontSize: '12px'
              }}>
                {err.stack}
              </pre>
            </details>
          )}
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '15px'
        }}>
          <button
            onClick={() => {
              // Reset error state
              hasErroredRef.current = false;
              // Force a re-render
              setError(null);
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: '#2196f3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Try Again
          </button>

          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '8px 16px',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }
});