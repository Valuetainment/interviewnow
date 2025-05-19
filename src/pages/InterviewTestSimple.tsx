import { useState, useEffect, useRef } from 'react';
import { WebRTCManager } from '../components/interview/WebRTCManager';
import { TranscriptPanel } from '../components/interview/TranscriptPanel';
import { ConnectionState } from '../hooks/webrtc/useConnectionState';

// Test page for WebRTC functionality using the hybrid architecture approach
const InterviewTestSimple: React.FC = () => {
  const [transcript, setTranscript] = useState<string>('');
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [interviewId, setInterviewId] = useState<string>('test-' + Date.now().toString());
  const [openAIKey, setOpenAIKey] = useState<string>('');
  const [jobDescription, setJobDescription] = useState<string>('Software Engineering Position');
  const [resume, setResume] = useState<string>('Experienced developer with React, TypeScript and WebRTC skills');
  const [voice, setVoice] = useState<string>('alloy');
  const [temperature, setTemperature] = useState<number>(0.7);
  const [recordSession, setRecordSession] = useState<boolean>(false);
  const [sessionLogs, setSessionLogs] = useState<Array<{timestamp: string; event: string; data?: any}>>([]);
  const [showDebugInfo, setShowDebugInfo] = useState<boolean>(false);

  // For simulation mode only - can be toggled for local development without OpenAI API key
  const [simulationMode, setSimulationMode] = useState<boolean>(false);
  const [serverUrl, setServerUrl] = useState<string>('wss://4d5fb0d8191c.ngrok.app');

  // Transcript data ref for recording
  const transcriptRef = useRef<string>('');

  // Load OpenAI key from local storage on component mount
  useEffect(() => {
    const savedKey = localStorage.getItem('openai_api_key');
    if (savedKey) {
      setOpenAIKey(savedKey);
    }

    // Add session start log
    addSessionLog('Session started');
  }, []);

  // Save OpenAI key to local storage when changed
  useEffect(() => {
    if (openAIKey) {
      localStorage.setItem('openai_api_key', openAIKey);
    }
  }, [openAIKey]);

  // Keep transcript ref in sync
  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  // Handle transcript updates
  const handleTranscriptUpdate = (text: string) => {
    if (!text.trim()) return;

    setTranscript(prev => {
      if (!prev) return text;
      return `${prev} ${text}`;
    });

    // Log transcript updates
    addSessionLog('Transcript update', { text });
  };

  // Handle connection state changes
  const handleConnectionStateChange = (state: ConnectionState) => {
    setConnectionState(state);
    console.log('Connection state changed:', state);

    // Log connection state changes
    addSessionLog('Connection state changed', { state });
  };

  // Toggle simulation mode (for development without OpenAI API)
  const toggleSimulationMode = () => {
    setSimulationMode(!simulationMode);
    addSessionLog(`Simulation mode ${!simulationMode ? 'enabled' : 'disabled'}`);
  };

  // Add a log entry to session logs
  const addSessionLog = (event: string, data?: any) => {
    setSessionLogs(prev => [
      ...prev,
      {
        timestamp: new Date().toISOString(),
        event,
        data
      }
    ]);
  };

  // Save session recording
  const saveSessionRecording = () => {
    const sessionData = {
      id: interviewId,
      timestamp: new Date().toISOString(),
      transcript: transcriptRef.current,
      logs: sessionLogs,
      config: {
        simulationMode,
        serverUrl: simulationMode ? serverUrl : null,
        jobDescription,
        resume,
        voice,
        temperature
      }
    };

    // Convert to JSON and create download link
    const dataStr = JSON.stringify(sessionData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

    const exportFileDefaultName = `interview-session-${interviewId}-${new Date().toISOString()}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();

    addSessionLog('Session recording saved');
  };

  // Get color class for connection state
  const getConnectionStateColor = (state: ConnectionState): string => {
    switch (state) {
      case 'connected':
        return 'connection-state-connected';
      case 'connecting':
      case 'ws_connected':
        return 'connection-state-connecting';
      case 'disconnected':
        return 'connection-state-disconnected';
      case 'ice_disconnected':
        return 'connection-state-ice-disconnected';
      case 'ice_failed':
      case 'connection_failed':
      case 'error':
        return 'connection-state-error';
      default:
        return 'connection-state-unknown';
    }
  };

  return (
    <div className="interview-test-page">
      <div className="test-header">
        <h1>WebRTC Test Page <span className="version-badge">Hybrid Architecture</span></h1>

        <div className="test-actions">
          <div className="mode-selector">
            <button
              className={`mode-btn ${simulationMode ? 'active' : ''}`}
              onClick={toggleSimulationMode}
              title="Toggle simulation mode for development without OpenAI API key"
            >
              Simulation Mode: {simulationMode ? 'ON' : 'OFF'}
            </button>
          </div>

          <div className="debug-controls">
            <button
              className={`debug-btn ${recordSession ? 'active' : ''}`}
              onClick={() => setRecordSession(!recordSession)}
            >
              {recordSession ? 'Stop Recording' : 'Start Recording'}
            </button>

            {recordSession && (
              <button
                className="save-btn"
                onClick={saveSessionRecording}
              >
                Save Session
              </button>
            )}

            <button
              className={`debug-btn ${showDebugInfo ? 'active' : ''}`}
              onClick={() => setShowDebugInfo(!showDebugInfo)}
            >
              {showDebugInfo ? 'Hide Debug Info' : 'Show Debug Info'}
            </button>
          </div>
        </div>

        <div className="connection-indicator-wrapper">
          <div className={`connection-indicator ${getConnectionStateColor(connectionState)}`}>
            <div className="indicator-dot"></div>
            <span className="indicator-label">
              Connection: <strong>{connectionState}</strong>
            </span>
          </div>
        </div>

        <div className="test-controls">
          {simulationMode && (
            <>
              <div className="test-control-group">
                <label>Simulation Server URL:</label>
                <input
                  type="text"
                  value={serverUrl}
                  onChange={e => setServerUrl(e.target.value)}
                />
              </div>
            </>
          )}

          {!simulationMode && (
            <>
              <div className="test-control-group">
                <label>OpenAI API Key:</label>
                <input
                  type="password"
                  value={openAIKey}
                  onChange={e => setOpenAIKey(e.target.value)}
                  placeholder="sk-..."
                />
              </div>
            </>
          )}

          <div className="test-control-group">
            <label>Job Description:</label>
            <input
              type="text"
              value={jobDescription}
              onChange={e => setJobDescription(e.target.value)}
            />
          </div>

          <div className="test-control-group">
            <label>Candidate Resume:</label>
            <input
              type="text"
              value={resume}
              onChange={e => setResume(e.target.value)}
            />
          </div>

          <div className="test-control-group">
            <label>Voice:</label>
            <select value={voice} onChange={e => setVoice(e.target.value)}>
              <option value="alloy">Alloy</option>
              <option value="echo">Echo</option>
              <option value="fable">Fable</option>
              <option value="onyx">Onyx</option>
              <option value="nova">Nova</option>
              <option value="shimmer">Shimmer</option>
            </select>
          </div>

          <div className="test-control-group">
            <label>Temperature: {temperature}</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={temperature}
              onChange={e => setTemperature(parseFloat(e.target.value))}
            />
          </div>

          <div className="test-control-group">
            <label>Session ID:</label>
            <input
              type="text"
              value={interviewId}
              onChange={e => setInterviewId(e.target.value)}
            />
          </div>

          <div className="test-control-group">
            <button
              onClick={() => setInterviewId('test-' + Date.now().toString())}
              className="new-session-btn"
            >
              Generate New Session
            </button>
          </div>
        </div>
      </div>

      <div className="test-main">
        <div className="test-left-panel">
          <WebRTCManager
            sessionId={interviewId}
            onTranscriptUpdate={handleTranscriptUpdate}
            onConnectionStateChange={handleConnectionStateChange}
            serverUrl={simulationMode ? serverUrl : undefined}
            simulationMode={simulationMode}
            openAIMode={!simulationMode}
            openAIKey={openAIKey}
            jobDescription={jobDescription}
            resume={resume}
            openAISettings={{
              voice,
              temperature,
              maximumLength: 5
            }}
          />

          <div className="test-info">
            <h3>Test Information</h3>
            {simulationMode ? (
              <>
                <p>Running in <strong>Simulation Mode</strong> - using local WebSocket server.</p>
                <p>This mode allows testing without an OpenAI API key. Transcription is simulated.</p>
                <p>Current Session ID: {interviewId}</p>
                <p className="note"><strong>Note:</strong> Simulation mode is for development only and does not reflect production behavior.</p>
              </>
            ) : (
              <>
                <p>Running in <strong>Direct OpenAI Mode</strong> - Hybrid Architecture.</p>
                <p>This establishes a direct WebRTC connection to OpenAI's Realtime API.</p>
                <p>Your API key is stored locally and never sent to our servers.</p>
                <p>Current Session ID: {interviewId}</p>
              </>
            )}
          </div>

          {showDebugInfo && (
            <div className="debug-panel">
              <h3>Debug Information</h3>
              <div className="debug-section">
                <h4>Session Configuration</h4>
                <pre>
                  {JSON.stringify({
                    sessionId: interviewId,
                    mode: simulationMode ? 'simulation' : 'openai_direct',
                    serverUrl: simulationMode ? serverUrl : null,
                    openAISettings: {
                      voice,
                      temperature,
                      maximumLength: 5
                    }
                  }, null, 2)}
                </pre>
              </div>

              <div className="debug-section">
                <h4>Connection State Timeline</h4>
                <div className="timeline">
                  {sessionLogs
                    .filter(log => log.event === 'Connection state changed')
                    .map((log, index) => (
                      <div key={index} className="timeline-item">
                        <div className="timeline-time">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </div>
                        <div className={`timeline-state ${getConnectionStateColor(log.data?.state)}`}>
                          {log.data?.state}
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              <div className="debug-section">
                <h4>Session Logs ({sessionLogs.length} entries)</h4>
                <div className="log-entries">
                  {sessionLogs.map((log, index) => (
                    <div key={index} className="log-entry">
                      <div className="log-time">{new Date(log.timestamp).toLocaleTimeString()}</div>
                      <div className="log-event">{log.event}</div>
                      {log.data && (
                        <pre className="log-data">{JSON.stringify(log.data, null, 2)}</pre>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="test-right-panel">
          <TranscriptPanel
            transcript={transcript}
            interviewId={interviewId}
          />
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .interview-test-page {
          display: flex;
          flex-direction: column;
          height: 100vh;
          padding: 1rem;
        }

        .test-header {
          margin-bottom: 1rem;
        }

        .version-badge {
          background-color: #6200ea;
          color: white;
          font-size: 0.8rem;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          margin-left: 0.5rem;
          vertical-align: middle;
        }

        .test-actions {
          display: flex;
          justify-content: space-between;
          margin-bottom: 1rem;
        }

        .mode-selector {
          display: flex;
          gap: 1rem;
        }

        .debug-controls {
          display: flex;
          gap: 0.5rem;
        }

        .mode-btn, .debug-btn, .save-btn {
          padding: 0.5rem 1.5rem;
          background-color: #f0f0f0;
          border: 1px solid #ccc;
          border-radius: 4px;
          cursor: pointer;
          font-weight: bold;
        }

        .mode-btn.active {
          background-color: #007bff;
          color: white;
          border-color: #0062cc;
        }

        .debug-btn.active {
          background-color: #6c757d;
          color: white;
          border-color: #5a6268;
        }

        .save-btn {
          background-color: #28a745;
          color: white;
          border-color: #28a745;
        }

        .connection-indicator-wrapper {
          margin-bottom: 1rem;
        }

        .connection-indicator {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          border-radius: 4px;
          background-color: #f8f9fa;
          margin-bottom: 0.5rem;
        }

        .indicator-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background-color: #ccc;
        }

        .connection-state-connected {
          background-color: #d4edda;
          color: #155724;
        }

        .connection-state-connected .indicator-dot {
          background-color: #28a745;
        }

        .connection-state-connecting {
          background-color: #fff3cd;
          color: #856404;
        }

        .connection-state-connecting .indicator-dot {
          background-color: #ffc107;
        }

        .connection-state-disconnected {
          background-color: #f8f9fa;
          color: #6c757d;
        }

        .connection-state-disconnected .indicator-dot {
          background-color: #6c757d;
        }

        .connection-state-ice-disconnected {
          background-color: #ffe5d0;
          color: #fd7e14;
        }

        .connection-state-ice-disconnected .indicator-dot {
          background-color: #fd7e14;
        }

        .connection-state-error {
          background-color: #f8d7da;
          color: #721c24;
        }

        .connection-state-error .indicator-dot {
          background-color: #dc3545;
        }

        .test-controls {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          margin-bottom: 1rem;
          padding: 1rem;
          background-color: #f8f9fa;
          border-radius: 4px;
        }

        .test-control-group {
          display: flex;
          flex-direction: column;
          min-width: 200px;
        }

        .test-control-group input,
        .test-control-group select {
          padding: 0.5rem;
          border: 1px solid #ccc;
          border-radius: 4px;
        }

        .test-main {
          display: flex;
          flex: 1;
          gap: 1rem;
          overflow: hidden;
        }

        .test-left-panel {
          width: 40%;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          overflow-y: auto;
        }

        .test-right-panel {
          width: 60%;
          overflow-y: auto;
        }

        .test-info {
          background-color: #f5f5f5;
          padding: 1rem;
          border-radius: 4px;
        }

        .debug-panel {
          background-color: #212529;
          color: #f8f9fa;
          padding: 1rem;
          border-radius: 4px;
          margin-top: 1rem;
          overflow-y: auto;
        }

        .debug-section {
          margin-bottom: 1.5rem;
        }

        .debug-section h4 {
          border-bottom: 1px solid #495057;
          padding-bottom: 0.5rem;
          margin-bottom: 1rem;
        }

        .timeline {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .timeline-item {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .timeline-time {
          font-family: monospace;
          width: 100px;
        }

        .timeline-state {
          padding: 0.25rem 0.5rem;
          border-radius: 3px;
          font-size: 0.9rem;
        }

        .log-entries {
          max-height: 400px;
          overflow-y: auto;
          background-color: #2c3034;
          border-radius: 4px;
          padding: 0.5rem;
        }

        .log-entry {
          border-bottom: 1px solid #495057;
          padding: 0.5rem 0;
        }

        .log-time {
          font-family: monospace;
          font-size: 0.8rem;
          color: #6c757d;
        }

        .log-event {
          font-weight: bold;
          margin: 0.25rem 0;
        }

        .log-data {
          font-family: monospace;
          font-size: 0.8rem;
          background-color: #343a40;
          padding: 0.5rem;
          border-radius: 3px;
          margin-top: 0.25rem;
          max-height: 100px;
          overflow-y: auto;
        }

        .new-session-btn {
          padding: 0.5rem 1rem;
          background-color: #007bff;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        .new-session-btn:hover {
          background-color: #0069d9;
        }

        pre {
          font-family: monospace;
          background-color: #343a40;
          padding: 0.5rem;
          border-radius: 3px;
          overflow-x: auto;
          max-height: 200px;
          margin: 0;
        }
      `}} />
    </div>
  );
};

export default InterviewTestSimple;