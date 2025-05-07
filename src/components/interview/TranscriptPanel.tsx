import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

interface TranscriptPanelProps {
  transcript: string;
  interviewId: string;
}

export const TranscriptPanel: React.FC<TranscriptPanelProps> = ({
  transcript,
  interviewId
}) => {
  const [savedTranscript, setSavedTranscript] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const transcriptContainerRef = useRef<HTMLDivElement>(null);
  
  // Initialize Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  );
  
  // Load existing transcript entries
  useEffect(() => {
    const loadTranscript = async () => {
      if (!interviewId) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        const { data, error } = await supabase
          .from('transcript_entries')
          .select('text, timestamp')
          .eq('interview_session_id', interviewId)
          .order('timestamp', { ascending: true });
          
        if (error) {
          throw error;
        }
        
        const fullTranscript = data
          ?.map(entry => entry.text)
          .join(' ') || '';
          
        setSavedTranscript(fullTranscript);
        
      } catch (error) {
        console.error('Error loading transcript:', error);
        setError('Failed to load transcript');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadTranscript();
    
    // Set up real-time subscription for new transcript entries
    const transcriptSubscription = supabase
      .channel('transcript-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'transcript_entries',
          filter: `interview_session_id=eq.${interviewId}`
        },
        (payload) => {
          setSavedTranscript(prev => `${prev} ${payload.new.text}`);
        }
      )
      .subscribe();
      
    return () => {
      transcriptSubscription.unsubscribe();
    };
  }, [interviewId, supabase]);
  
  // Auto-scroll to bottom when transcript updates
  useEffect(() => {
    if (transcriptContainerRef.current) {
      transcriptContainerRef.current.scrollTop = transcriptContainerRef.current.scrollHeight;
    }
  }, [transcript, savedTranscript]);
  
  // Combine saved transcript with real-time transcript
  const fullTranscript = savedTranscript + 
    (savedTranscript && transcript ? ' ' : '') + 
    transcript;
  
  return (
    <div className="transcript-panel">
      <div className="transcript-header">
        <h3>Interview Transcript</h3>
      </div>
      
      <div className="transcript-container" ref={transcriptContainerRef}>
        {isLoading ? (
          <div className="loading-indicator">Loading transcript...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : fullTranscript ? (
          <div className="transcript-content">
            {fullTranscript.split(/(?<=[.!?])\s+/).map((sentence, index) => (
              <p key={index} className="transcript-sentence">
                {sentence.trim()}
              </p>
            ))}
          </div>
        ) : (
          <div className="empty-transcript">
            No transcript yet. The interview will be transcribed in real-time as it progresses.
          </div>
        )}
      </div>
      
      <div className="transcript-footer">
        <div className="transcript-status">
          {isLoading ? 'Loading...' : 'Transcript updating in real-time'}
        </div>
        <button 
          className="transcript-download-btn"
          onClick={() => {
            const element = document.createElement('a');
            const file = new Blob([fullTranscript], {type: 'text/plain'});
            element.href = URL.createObjectURL(file);
            element.download = `interview-transcript-${interviewId}.txt`;
            document.body.appendChild(element);
            element.click();
            document.body.removeChild(element);
          }}
          disabled={!fullTranscript}
        >
          Download Transcript
        </button>
      </div>
    </div>
  );
}; 