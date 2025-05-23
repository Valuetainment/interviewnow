import { useState, useEffect } from 'react';
import { WebRTCManager } from '../components/interview/WebRTCManager';
import { TranscriptPanel } from '../components/interview/TranscriptPanel';

// Complete Interview Test Page for WebRTC functionality
const FullInterviewTest: React.FC = () => {
  // State for interview setup
  const [jobDescription, setJobDescription] = useState<string>('');
  const [resume, setResume] = useState<string>('');
  const [interviewStarted, setInterviewStarted] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [connectionState, setConnectionState] = useState<string>('disconnected');
  const [interviewId, setInterviewId] = useState<string>('test-' + Date.now().toString());
  const [simulationMode, setSimulationMode] = useState<boolean>(true);
  const [serverUrl, setServerUrl] = useState<string>('wss://4d5fb0d8191c.ngrok.app'); // Update with current URL
  
  // Sample job descriptions for quick testing
  const sampleJobs = [
    {
      title: 'Software Engineer',
      description: 'We are looking for a software engineer with 3+ years experience in React, Node.js and TypeScript. The candidate should be familiar with WebRTC, WebSockets, and microservices architecture.'
    },
    {
      title: 'AI Engineer',
      description: 'Looking for an AI engineer with experience in machine learning models, natural language processing, and real-time audio processing. Familiarity with OpenAI APIs, WebRTC, and web development is required.'
    },
    {
      title: 'Full Stack Developer',
      description: 'Full stack developer position available. Must have experience with React, Node.js, database design, and CI/CD. The ideal candidate has 2+ years of professional experience and can work independently.'
    }
  ];
  
  // Sample resumes for quick testing
  const sampleResumes = [
    {
      name: 'Experienced Developer',
      content: 'Software engineer with 5 years of experience in web development. Proficient in React, TypeScript, Node.js, and WebRTC. Worked on real-time communication applications and implemented video conferencing features. Strong problem-solving skills and experience with agile methodologies.'
    },
    {
      name: 'Junior Developer',
      content: 'Recent computer science graduate with 1 year of internship experience. Familiar with React, JavaScript, and basic backend development. Eager to learn new technologies and grow as a developer. Completed several personal projects including a chat application using WebSockets.'
    },
    {
      name: 'AI Specialist',
      content: 'AI specialist with 3 years of experience working with machine learning models and natural language processing. Implemented real-time transcription systems and worked with OpenAI APIs. Strong background in Python, TensorFlow, and web development technologies.'
    }
  ];
  
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
  
  // Start the interview
  const startInterview = () => {
    // Validate inputs
    if (!jobDescription.trim()) {
      alert('Please enter a job description or select a sample job');
      return;
    }
    
    if (!resume.trim()) {
      alert('Please enter a resume or select a sample resume');
      return;
    }
    
    // Generate a new session ID for this interview
    setInterviewId('test-' + Date.now().toString());
    setTranscript(''); // Clear previous transcript
    setInterviewStarted(true);
    
    console.log('Starting interview with:', {
      jobDescription,
      resume,
      interviewId,
      serverUrl,
      simulationMode
    });
  };
  
  // Reset the interview
  const resetInterview = () => {
    setInterviewStarted(false);
    setTranscript('');
  };
  
  // Set a sample job description
  const selectSampleJob = (index: number) => {
    setJobDescription(sampleJobs[index].description);
  };
  
  // Set a sample resume
  const selectSampleResume = (index: number) => {
    setResume(sampleResumes[index].content);
  };
  
  return (
    <div className="full-interview-test-container">
      <div className="test-header">
        <h1>Full Interview Test</h1>
        <div className="connection-status">
          <span>Connection: {connectionState}</span>
        </div>
      </div>
      
      {!interviewStarted ? (
        <div className="setup-panel">
          <div className="setup-section">
            <h2>Job Description</h2>
            <div className="sample-buttons">
              {sampleJobs.map((job, index) => (
                <button 
                  key={`job-${index}`} 
                  className="sample-button"
                  onClick={() => selectSampleJob(index)}
                >
                  {job.title}
                </button>
              ))}
            </div>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Enter the job description here or select a sample above..."
              rows={8}
              className="input-field"
            />
          </div>
          
          <div className="setup-section">
            <h2>Resume</h2>
            <div className="sample-buttons">
              {sampleResumes.map((resume, index) => (
                <button 
                  key={`resume-${index}`} 
                  className="sample-button"
                  onClick={() => selectSampleResume(index)}
                >
                  {resume.name}
                </button>
              ))}
            </div>
            <textarea
              value={resume}
              onChange={(e) => setResume(e.target.value)}
              placeholder="Enter the candidate's resume here or select a sample above..."
              rows={8}
              className="input-field"
            />
          </div>
          
          <div className="setup-section">
            <h2>Connection Settings</h2>
            <div className="setting-group">
              <label>
                <input 
                  type="checkbox" 
                  checked={simulationMode} 
                  onChange={e => setSimulationMode(e.target.checked)} 
                />
                Simulation Mode
              </label>
            </div>
            
            <div className="setting-group">
              <label>WebSocket Server URL:</label>
              <input 
                type="text" 
                value={serverUrl} 
                onChange={e => setServerUrl(e.target.value)}
                className="input-field"
              />
            </div>
          </div>
          
          <div className="actions">
            <button 
              onClick={startInterview}
              className="start-button"
            >
              Start Interview
            </button>
          </div>
        </div>
      ) : (
        <div className="interview-panel">
          <div className="interview-left">
            <div className="job-resume-details">
              <div className="detail-section">
                <h3>Job Description</h3>
                <p>{jobDescription}</p>
              </div>
              <div className="detail-section">
                <h3>Resume</h3>
                <p>{resume}</p>
              </div>
            </div>
            
            <WebRTCManager
              sessionId={interviewId}
              onTranscriptUpdate={handleTranscriptUpdate}
              onConnectionStateChange={handleConnectionStateChange}
              serverUrl={serverUrl}
              simulationMode={simulationMode}
            />
            
            <div className="interview-actions">
              <button 
                onClick={resetInterview}
                className="reset-button"
              >
                End Interview & Reset
              </button>
            </div>
          </div>
          
          <div className="interview-right">
            <TranscriptPanel
              transcript={transcript}
              interviewId={interviewId}
            />
          </div>
        </div>
      )}
      
      <style dangerouslySetInnerHTML={{__html: `
        .full-interview-test-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          font-family: system-ui, -apple-system, sans-serif;
        }
        
        .test-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 10px;
          border-bottom: 1px solid #eee;
        }
        
        .connection-status {
          padding: 8px 12px;
          background-color: #f5f5f5;
          border-radius: 4px;
          font-size: 14px;
        }
        
        .setup-panel {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        
        .setup-section {
          background-color: #f9f9f9;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        
        .setup-section h2 {
          margin-top: 0;
          margin-bottom: 15px;
          font-size: 18px;
        }
        
        .setup-section:nth-child(3) {
          grid-column: 1 / -1;
        }
        
        .input-field {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-family: inherit;
          font-size: 14px;
          margin-bottom: 10px;
        }
        
        .sample-buttons {
          display: flex;
          gap: 10px;
          margin-bottom: 10px;
        }
        
        .sample-button {
          padding: 8px 12px;
          background-color: #e9ecef;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }
        
        .sample-button:hover {
          background-color: #dee2e6;
        }
        
        .actions {
          grid-column: 1 / -1;
          text-align: center;
          margin-top: 20px;
        }
        
        .start-button {
          padding: 12px 24px;
          background-color: #007bff;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 16px;
          cursor: pointer;
        }
        
        .start-button:hover {
          background-color: #0069d9;
        }
        
        .interview-panel {
          display: grid;
          grid-template-columns: 40% 60%;
          gap: 20px;
        }
        
        .interview-left {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        
        .job-resume-details {
          background-color: #f9f9f9;
          padding: 15px;
          border-radius: 8px;
          max-height: 300px;
          overflow-y: auto;
        }
        
        .detail-section {
          margin-bottom: 15px;
        }
        
        .detail-section h3 {
          margin-top: 0;
          margin-bottom: 8px;
          font-size: 16px;
        }
        
        .detail-section p {
          margin: 0;
          font-size: 14px;
          line-height: 1.5;
        }
        
        .interview-actions {
          margin-top: auto;
        }
        
        .reset-button {
          padding: 10px 20px;
          background-color: #dc3545;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .reset-button:hover {
          background-color: #c82333;
        }
        
        .setting-group {
          margin-bottom: 15px;
        }
        
        .setting-group label {
          display: block;
          margin-bottom: 5px;
        }
      `}} />
    </div>
  );
};

export default FullInterviewTest;