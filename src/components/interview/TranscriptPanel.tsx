import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import './TranscriptPanel.css';

interface TranscriptEntry {
  text: string;
  speaker: string;
  timestamp?: string;
}

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
  const [transcriptEntries, setTranscriptEntries] = useState<TranscriptEntry[]>([]);

  // Load existing transcript entries
  useEffect(() => {
    const loadTranscript = async () => {
      if (!interviewId) return;

      // Skip database lookup for test session IDs (starting with 'test-')
      if (interviewId.startsWith('test-')) {
        console.log('Test session detected - skipping database transcript load');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const { data, error } = await supabase
          .from('transcript_entries')
          .select('text, speaker, timestamp')
          .eq('session_id', interviewId)
          .order('timestamp', { ascending: true });

        if (error) {
          throw error;
        }

        // Format the entries with proper speakers
        const entries = data?.map(entry => ({
          text: entry.text,
          speaker: entry.speaker || 'unknown',
          timestamp: entry.timestamp
        })) || [];

        setTranscriptEntries(entries);

        // Also maintain the legacy format for backwards compatibility
        const fullTranscript = entries
          .map(entry => entry.text)
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

    // Skip subscription for test sessions
    if (interviewId.startsWith('test-')) {
      console.log('Test session detected - skipping real-time subscription');
      return;
    }

    // Set up real-time subscription for new transcript entries
    const transcriptSubscription = supabase
      .channel('transcript-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'transcript_entries',
          filter: `session_id=eq.${interviewId}`
        },
        (payload) => {
          // Add the new entry to our list
          setTranscriptEntries(prev => [
            ...prev,
            {
              text: payload.new.text,
              speaker: payload.new.speaker || 'unknown',
              timestamp: payload.new.timestamp
            }
          ]);

          // Update the legacy format
          setSavedTranscript(prev => `${prev} ${payload.new.text}`);
        }
      )
      .subscribe();

    return () => {
      if (transcriptSubscription) {
        transcriptSubscription.unsubscribe();
      }
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

  // Create a reference to track the last seen transcript for test sessions
  const lastTranscriptRef = useRef<string>('');
  const processedTranscripts = useRef<Set<string>>(new Set());
  
  // Ensure refs are always initialized and cleaned up properly
  useEffect(() => {
    if (!processedTranscripts.current) {
      processedTranscripts.current = new Set();
    }
    
    // Cleanup function to prevent errors during unmount
    return () => {
      processedTranscripts.current = null;
      lastTranscriptRef.current = '';
    };
  }, []);

  // For test sessions, handle transcript updates differently with stronger deduplication
  useEffect(() => {
    if (interviewId.startsWith('test-') && transcript && transcript !== lastTranscriptRef.current) {
      // Update our reference to avoid duplication
      lastTranscriptRef.current = transcript;

      // Don't process exact duplicates
      if (!processedTranscripts.current) {
        console.log('ProcessedTranscripts ref not initialized, skipping');
        return;
      }
      
      if (processedTranscripts.current.has(transcript)) {
        console.log('Skipping duplicate transcript');
        return;
      }

      // Add to processed set
      processedTranscripts.current.add(transcript);

      // Clear existing entries if it's a welcome message (common phrase in all welcome messages)
      if (transcript.includes('Hello from the ngrok WebSocket test server')) {
        console.log('Received welcome message - resetting transcript list');
        // Reset transcript list with just the welcome message
        setTranscriptEntries([{
          text: 'Connected to WebSocket server successfully!',
          speaker: 'system',
          timestamp: new Date().toISOString()
        }]);
      } else {
        // For other messages, add as a new entry with timestamp to ensure uniqueness
        console.log('Adding new transcript entry:',
          transcript.length > 30 ? transcript.substring(0, 30) + '...' : transcript);

        setTranscriptEntries(prev => [...prev, {
          text: transcript,
          speaker: 'ai',
          timestamp: new Date().toISOString()
        }]);
      }
    }
  }, [transcript, interviewId]);
  
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
        ) : transcriptEntries.length > 0 ? (
          <div className="transcript-content">
            {transcriptEntries.map((entry, index) => (
              <div key={index} className={`transcript-entry ${entry.speaker}`}>
                <span className="speaker-label">
                  {entry.speaker === 'ai' ? 'AI Interviewer: ' :
                   entry.speaker === 'candidate' ? 'Candidate: ' : ''}
                </span>
                <span className="transcript-text">{entry.text}</span>
              </div>
            ))}

            {/* Display any real-time transcript not yet saved */}
            {transcript && (
              <div className="transcript-entry realtime">
                <span className="transcript-text">{transcript}</span>
              </div>
            )}
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