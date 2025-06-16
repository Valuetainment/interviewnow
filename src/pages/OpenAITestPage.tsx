import { useState, useEffect, useRef, useCallback } from 'react';
// Using direct imports from components folder, but implementing standalone functionality
import { WebRTCManager } from '../components/interview/WebRTCManager';
import { TranscriptPanel } from '../components/interview/TranscriptPanel';

// Test environment banner component
const TestEnvironmentBanner = () => (
  <div className="test-environment-banner">
    <span className="banner-icon">⚠️</span>
    <span className="banner-text">OPENAI DIRECT TEST ENVIRONMENT - FOR TESTING ONLY</span>
    <span className="banner-subtext">This page tests direct OpenAI WebRTC connections</span>
  </div>
);

// Direct OpenAI WebRTC test page
const OpenAITestPage: React.FC = () => {
  const [transcript, setTranscript] = useState<string>('');
  const [connectionState, setConnectionState] = useState<string>('disconnected');
  const [interviewId, setInterviewId] = useState<string>('direct-openai-' + Date.now().toString());
  const [openAIMode, setOpenAIMode] = useState<boolean>(true);
  const [openAIKey, setOpenAIKey] = useState<string>('');
  const [jobPosition, setJobPosition] = useState<string>('Software Engineer');
  const [jobDescription, setJobDescription] = useState<string>(
    'We are looking for a Software Engineer with experience in React, TypeScript, and cloud technologies.'
  );
  const [candidateResume, setCandidateResume] = useState<string>(
    'Software engineer with 5 years of experience in web development, React, and TypeScript.'
  );
  const [interviewSettings, setInterviewSettings] = useState({
    voice: 'verse',
    temperature: 0.7,
    maximumLength: 5, // minutes
  });

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

  // Save settings in localStorage to persist across refreshes
  useEffect(() => {
    // Load saved settings
    const savedKey = localStorage.getItem('openai_test_api_key');
    if (savedKey) setOpenAIKey(savedKey);
    
    const savedJobPosition = localStorage.getItem('openai_test_job_position');
    if (savedJobPosition) setJobPosition(savedJobPosition);
    
    const savedJobDescription = localStorage.getItem('openai_test_job_description');
    if (savedJobDescription) setJobDescription(savedJobDescription);
    
    const savedSettings = localStorage.getItem('openai_test_settings');
    if (savedSettings) {
      try {
        setInterviewSettings(JSON.parse(savedSettings));
      } catch (e) {
        console.error('Failed to parse saved settings:', e);
      }
    }
  }, []);

  // Save settings when they change
  useEffect(() => {
    if (openAIKey) localStorage.setItem('openai_test_api_key', openAIKey);
    localStorage.setItem('openai_test_job_position', jobPosition);
    localStorage.setItem('openai_test_job_description', jobDescription);
    localStorage.setItem('openai_test_settings', JSON.stringify(interviewSettings));
  }, [openAIKey, jobPosition, jobDescription, interviewSettings]);

  // Generate a new session ID
  const generateNewSession = () => {
    setInterviewId('direct-openai-' + Date.now().toString());
    setTranscript('');
  };
  
  return (
    <div className="interview-test-page openai-test-page">
      <TestEnvironmentBanner />

      <div className="test-header">
        <h1>OpenAI WebRTC Direct Test</h1>
        <div className="test-controls">
          <div className="test-control-group">
            <label>
              <input
                type="checkbox"
                checked={openAIMode}
                onChange={e => setOpenAIMode(e.target.checked)}
              />
              Direct OpenAI Mode
            </label>
          </div>

          <div className="test-control-group">
            <label>OpenAI API Key:</label>
            <input
              type="password"
              value={openAIKey}
              onChange={e => setOpenAIKey(e.target.value)}
              placeholder="sk-..."
              className="api-key-input"
            />
          </div>

          <div className="test-control-group">
            <label>Session ID:</label>
            <input
              type="text"
              value={interviewId}
              onChange={e => setInterviewId(e.target.value)}
              readOnly
            />
            <button
              onClick={generateNewSession}
              className="new-session-btn"
            >
              Generate New Session
            </button>
          </div>
        </div>

        <div className="interview-settings">
          <h3>Interview Settings</h3>
          <div className="settings-grid">
            <div className="setting-group">
              <label>Job Position:</label>
              <input
                type="text"
                value={jobPosition}
                onChange={e => setJobPosition(e.target.value)}
                placeholder="Software Engineer"
              />
            </div>

            <div className="setting-group">
              <label>Voice:</label>
              <select
                value={interviewSettings.voice}
                onChange={e => setInterviewSettings({...interviewSettings, voice: e.target.value})}
              >
                <option value="alloy">Alloy (Neutral)</option>
                <option value="echo">Echo (Male)</option>
                <option value="fable">Fable (Male)</option>
                <option value="onyx">Onyx (Male)</option>
                <option value="nova">Nova (Female)</option>
                <option value="shimmer">Shimmer (Female)</option>
              </select>
            </div>

            <div className="setting-group">
              <label>Temperature:</label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={interviewSettings.temperature}
                onChange={e => setInterviewSettings({...interviewSettings, temperature: parseFloat(e.target.value)})}
              />
              <span>{interviewSettings.temperature}</span>
            </div>

            <div className="setting-group">
              <label>Max Length (minutes):</label>
              <input
                type="number"
                min="1"
                max="30"
                value={interviewSettings.maximumLength}
                onChange={e => setInterviewSettings({...interviewSettings, maximumLength: parseInt(e.target.value)})}
              />
            </div>
          </div>

          <div className="text-inputs">
            <div className="input-group">
              <label>Job Description:</label>
              <textarea
                value={jobDescription}
                onChange={e => setJobDescription(e.target.value)}
                rows={3}
                placeholder="Enter job description..."
              />
            </div>

            <div className="input-group">
              <label>Candidate Resume:</label>
              <textarea
                value={candidateResume}
                onChange={e => setCandidateResume(e.target.value)}
                rows={3}
                placeholder="Enter candidate resume or background..."
              />
            </div>
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
            openAIMode={openAIMode}
            openAIKey={openAIKey}
            jobDescription={jobDescription}
            resume={candidateResume}
            openAISettings={interviewSettings}
          />

          <div className="test-info">
            <h3>Direct OpenAI WebRTC Testing</h3>
            <p>This page tests direct WebRTC connections to OpenAI's Realtime API.</p>
            <p>Enter your OpenAI API key to establish a direct connection. The key is stored locally and never sent to our servers.</p>
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
      
      <style dangerouslySetInnerHTML={{__html: `
        .interview-test-page {
          display: flex;
          flex-direction: column;
          height: 100vh;
          padding: 1rem;
        }

        .openai-test-page {
          background-color: #f0f7ff;
          color: #333;
        }

        .test-environment-banner {
          background-color: #d32f2f;
          color: white;
          padding: 10px;
          text-align: center;
          font-weight: bold;
          margin-bottom: 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          border-radius: 4px;
        }

        .banner-icon {
          font-size: 24px;
          margin-right: 10px;
        }

        .banner-text {
          font-size: 16px;
        }

        .banner-subtext {
          font-size: 12px;
          opacity: 0.8;
          margin-top: 5px;
        }

        .test-header {
          margin-bottom: 1rem;
          background-color: #e6f0ff;
          padding: 15px;
          border-radius: 8px;
          border-left: 5px solid #10a37f;
        }

        .test-header h1 {
          color: #10a37f;
          margin-bottom: 10px;
        }

        .test-controls {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          margin-bottom: 1rem;
          background-color: rgba(16, 163, 127, 0.05);
          padding: 10px;
          border-radius: 6px;
        }

        .test-control-group {
          display: flex;
          flex-direction: column;
        }

        .api-key-input {
          width: 300px;
          font-family: monospace;
          border: 1px solid #10a37f;
          padding: 5px;
          border-radius: 4px;
        }

        .interview-settings {
          background-color: #f8f9fa;
          padding: 1rem;
          border-radius: 4px;
          margin-bottom: 1rem;
          border: 1px solid #e0e0e0;
        }

        .settings-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .text-inputs {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .input-group {
          display: flex;
          flex-direction: column;
        }

        .input-group textarea {
          resize: vertical;
          border: 1px solid #ccc;
          border-radius: 4px;
          padding: 8px;
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
          background-color: rgba(16, 163, 127, 0.1);
          padding: 1rem;
          border-radius: 4px;
          border-left: 3px solid #10a37f;
          color: #333;
        }

        .test-info h3 {
          color: #10a37f;
          margin-top: 0;
        }

        .new-session-btn {
          padding: 0.5rem 1rem;
          background-color: #10a37f;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          margin-top: 0.5rem;
          font-weight: bold;
        }

        .new-session-btn:hover {
          background-color: #0d8c6b;
        }

        .connection-status {
          background-color: #eee;
          padding: 8px 12px;
          border-radius: 4px;
          margin-top: 10px;
          font-weight: bold;
        }
      `}} />
    </div>
  );
};

export default OpenAITestPage;