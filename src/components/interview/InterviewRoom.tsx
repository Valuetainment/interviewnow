import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { WebRTCManager } from './WebRTCManager';
import { TranscriptPanel } from './TranscriptPanel';

interface Candidate {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface Position {
  id: string;
  title: string;
  description: string;
}

interface InterviewData {
  id: string;
  status: string;
  candidate: Candidate | null;
  position: Position | null;
  webrtc_status: string;
  webrtc_server_url: string | null;
}

interface SupabaseInterviewResponse {
  id: string;
  status: string;
  candidate: Candidate[] | null;
  position: Position[] | null;
  webrtc_status: string;
  webrtc_server_url: string | null;
}

interface InterviewRoomProps {
  interviewId: string;
  candidateId?: string;
  positionId?: string;
}

export const InterviewRoom: React.FC<InterviewRoomProps> = ({
  interviewId,
  candidateId,
  positionId
}) => {
  // State
  const [transcript, setTranscript] = useState<string>('');
  const [connectionState, setConnectionState] = useState<string>('disconnected');
  const [interviewData, setInterviewData] = useState<InterviewData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Initialize Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  );
  
  // Fetch interview data
  useEffect(() => {
    const fetchInterviewData = async () => {
      if (!interviewId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const { data, error: fetchError } = await supabase
          .from('interview_sessions')
          .select(`
            id,
            status,
            candidate:candidates(id, first_name, last_name, email),
            position:positions(id, title, description),
            webrtc_status,
            webrtc_server_url
          `)
          .eq('id', interviewId)
          .single();
          
        if (fetchError) {
          throw new Error(fetchError.message);
        }
        
        if (!data) {
          throw new Error('Interview session not found');
        }
        
        // Convert Supabase response format to our interface
        const responseData = data as SupabaseInterviewResponse;
        const formattedData: InterviewData = {
          id: responseData.id,
          status: responseData.status,
          candidate: responseData.candidate && responseData.candidate.length > 0 
            ? responseData.candidate[0] 
            : null,
          position: responseData.position && responseData.position.length > 0 
            ? responseData.position[0] 
            : null,
          webrtc_status: responseData.webrtc_status,
          webrtc_server_url: responseData.webrtc_server_url
        };
        
        setInterviewData(formattedData);
        
      } catch (err) {
        console.error('Error fetching interview data:', err);
        setError('Failed to load interview data: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchInterviewData();
    
  }, [interviewId, supabase]);
  
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
    
    // Update interview status in the database if connected or disconnected
    if (state === 'connected' && interviewData?.status !== 'in_progress') {
      supabase
        .from('interview_sessions')
        .update({ status: 'in_progress' })
        .eq('id', interviewId)
        .then(({ error }) => {
          if (error) console.error('Failed to update interview status:', error);
        });
    } else if (state === 'disconnected' && interviewData?.status === 'in_progress') {
      supabase
        .from('interview_sessions')
        .update({ status: 'completed' })
        .eq('id', interviewId)
        .then(({ error }) => {
          if (error) console.error('Failed to update interview status:', error);
        });
    }
  };
  
  // End interview and navigate to summary
  const endInterview = async () => {
    try {
      const { error: updateError } = await supabase
        .from('interview_sessions')
        .update({ 
          status: 'completed',
          webrtc_status: 'disconnected'
        })
        .eq('id', interviewId);
        
      if (updateError) {
        throw new Error(updateError.message);
      }
      
      // In a real implementation, this would navigate to a summary page
      // window.location.href = `/interviews/${interviewId}/summary`;
      
    } catch (err) {
      console.error('Error ending interview:', err);
      setError('Failed to end interview: ' + err.message);
    }
  };
  
  if (loading) {
    return <div className="interview-loading">Loading interview session...</div>;
  }
  
  if (error) {
    return <div className="interview-error">{error}</div>;
  }
  
  if (!interviewData) {
    return <div className="interview-not-found">Interview session not found</div>;
  }
  
  const candidateName = interviewData.candidate 
    ? `${interviewData.candidate.first_name} ${interviewData.candidate.last_name}`
    : 'Unknown Candidate';
    
  const positionTitle = interviewData.position
    ? interviewData.position.title
    : 'Unknown Position';
  
  return (
    <div className="interview-room">
      <div className="interview-header">
        <h2>Interview Session: {candidateName} for {positionTitle}</h2>
        <div className="connection-status">
          <span className={`status-indicator status-${connectionState}`}></span>
          <span>Status: {connectionState}</span>
        </div>
      </div>
      
      <div className="interview-main">
        <div className="interview-left-panel">
          <div className="candidate-info">
            <h3>Candidate</h3>
            <p>{candidateName}</p>
            {interviewData.candidate && (
              <p>{interviewData.candidate.email}</p>
            )}
          </div>
          
          <div className="position-info">
            <h3>Position</h3>
            <p>{positionTitle}</p>
            {interviewData.position && (
              <div className="position-description">
                {interviewData.position.description.slice(0, 200)}...
              </div>
            )}
          </div>
          
          <div className="interview-controls">
            <button 
              className="interview-end-btn"
              onClick={endInterview}
              disabled={connectionState === 'disconnected'}
            >
              End Interview
            </button>
          </div>
        </div>
        
        <div className="interview-center-panel">
          <WebRTCManager
            sessionId={interviewId}
            onTranscriptUpdate={handleTranscriptUpdate}
            onConnectionStateChange={handleConnectionStateChange}
            serverUrl={interviewData.webrtc_server_url || undefined}
          />
          
          <div className="interview-status">
            <p>Interview {interviewData.status}</p>
            <p>WebRTC {interviewData.webrtc_status}</p>
          </div>
        </div>
        
        <div className="interview-right-panel">
          <TranscriptPanel
            transcript={transcript}
            interviewId={interviewId}
          />
        </div>
      </div>
    </div>
  );
}; 