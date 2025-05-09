import { useState, useEffect } from 'react';
import { WebRTCManager } from '../components/interview/WebRTCManager';
import { TranscriptPanel } from '../components/interview/TranscriptPanel';

// Test page for WebRTC functionality without any auth requirements
const InterviewTestSimple: React.FC = () => {
  const [transcript, setTranscript] = useState<string>('');
  const [connectionState, setConnectionState] = useState<string>('disconnected');
  const [interviewId, setInterviewId] = useState<string>('test-' + Date.now().toString());
  const [simulationMode, setSimulationMode] = useState<boolean>(true);
  const [serverUrl, setServerUrl] = useState<string>('wss://interview-simulation-proxy.fly.dev/ws');
  
  // Handle transcript updates
  const handleTranscriptUpdate = (text: string) => {
    if (!text.trim()) return;
    
    setTranscript(prev => {
      if (!prev) return text;
      return `${prev} ${text}`;
    });
  };
  
  // Handle connection state changes
  const handleConnectionStateChange = (state: string) => {
    setConnectionState(state);
    console.log('Connection state changed:', state);
  };
  
  return (
    <div className="interview-test-page">
      <div className="test-header">
        <h1>WebRTC Test Page</h1>
        <div className="test-controls">
          <div className="test-control-group">
            <label>
              <input 
                type="checkbox" 
                checked={simulationMode} 
                onChange={e => setSimulationMode(e.target.checked)} 
              />
              Simulation Mode
            </label>
          </div>
          
          <div className="test-control-group">
            <label>Server URL:</label>
            <input 
              type="text" 
              value={serverUrl} 
              onChange={e => setServerUrl(e.target.value)}
              disabled={!simulationMode}
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
        
        <div className="connection-status">
          <span>Connection: {connectionState}</span>
        </div>
      </div>
      
      <div className="test-main">
        <div className="test-left-panel">
          <WebRTCManager
            sessionId={interviewId}
            onTranscriptUpdate={handleTranscriptUpdate}
            onConnectionStateChange={handleConnectionStateChange}
            serverUrl={serverUrl}
            simulationMode={simulationMode}
          />
          
          <div className="test-info">
            <h3>Test Information</h3>
            <p>This page tests the WebRTC functionality in simulation mode.</p>
            <p>It connects to a simulation server that returns mock transcription data.</p>
            <p>Current Session ID: {interviewId}</p>
          </div>
        </div>
        
        <div className="test-right-panel">
          <TranscriptPanel
            transcript={transcript}
            interviewId={interviewId}
          />
        </div>
      </div>
      
      <style jsx>{`
        .interview-test-page {
          display: flex;
          flex-direction: column;
          height: 100vh;
          padding: 1rem;
        }
        
        .test-header {
          margin-bottom: 1rem;
        }
        
        .test-controls {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          margin-bottom: 1rem;
        }
        
        .test-control-group {
          display: flex;
          flex-direction: column;
        }
        
        .test-main {
          display: flex;
          flex: 1;
          gap: 1rem;
        }
        
        .test-left-panel {
          width: 40%;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        
        .test-right-panel {
          width: 60%;
        }
        
        .test-info {
          background-color: #f5f5f5;
          padding: 1rem;
          border-radius: 4px;
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
      `}</style>
    </div>
  );
};

export default InterviewTestSimple;