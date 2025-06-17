import { useState, useCallback, useRef, useEffect } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { supabase as defaultSupabaseClient } from '@/integrations/supabase/client';

export interface TranscriptEntry {
  id?: string;
  text: string;
  speaker: 'candidate' | 'ai' | 'unknown';
  timestamp?: string;
}

export interface TranscriptManagerConfig {
  sessionId: string;
  onTranscriptUpdate?: (text: string) => void;
  supabaseClient?: SupabaseClient;
  batchSize?: number; // Max entries before forcing flush
  batchTimeout?: number; // Max time (ms) before forcing flush
}

export interface TranscriptManagerHandlers {
  transcript: TranscriptEntry[];
  saveTranscript: (text: string, speaker?: 'candidate' | 'ai' | 'unknown') => Promise<void>;
  addTranscriptEntry: (entry: TranscriptEntry) => void;
  clearTranscript: () => void;
  flushTranscripts: () => Promise<void>; // Force flush the batch
}

// Constants for batching
const DEFAULT_BATCH_SIZE = 10;
const DEFAULT_BATCH_TIMEOUT = 5000; // 5 seconds

/**
 * Hook for managing interview transcripts with batching support
 */
export function useTranscriptManager({
  sessionId,
  onTranscriptUpdate,
  supabaseClient,
  batchSize = DEFAULT_BATCH_SIZE,
  batchTimeout = DEFAULT_BATCH_TIMEOUT
}: TranscriptManagerConfig): TranscriptManagerHandlers {
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  
  // Batching state
  const transcriptBuffer = useRef<TranscriptEntry[]>([]);
  const batchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isFlushingRef = useRef<boolean>(false);
  
  // Use provided Supabase client or default
  const supabase = supabaseClient || defaultSupabaseClient;

  // Save a single transcript (fallback method)
  const saveSingleTranscript = useCallback(async (entry: TranscriptEntry) => {
    try {
      const { data, error } = await supabase.functions.invoke('interview-transcript', {
        body: {
          interview_session_id: sessionId,
          text: entry.text,
          speaker: entry.speaker,
          timestamp: entry.timestamp,
          source: 'hybrid'
        }
      });

      if (error || (data && !data.success)) {
        console.error('Individual transcript save failed:', error || data?.error);
      }
    } catch (error) {
      console.error('Error saving individual transcript:', error);
    }
  }, [sessionId, supabase]);

  // Flush transcript batch to database
  const flushTranscripts = useCallback(async () => {
    // Prevent concurrent flushes
    if (isFlushingRef.current || transcriptBuffer.current.length === 0) {
      return;
    }

    isFlushingRef.current = true;
    
    // Clear any pending timeout
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
      batchTimeoutRef.current = null;
    }

    // Get all entries from buffer
    const entriesToSave = [...transcriptBuffer.current];
    transcriptBuffer.current = [];

    try {
      console.log(`Flushing ${entriesToSave.length} transcript entries for session ${sessionId}`);
      
      // Call new batch edge function
      const { data, error } = await supabase.functions.invoke('interview-transcript-batch', {
        body: {
          interview_session_id: sessionId,
          entries: entriesToSave.map(entry => ({
            text: entry.text,
            speaker: entry.speaker,
            timestamp: entry.timestamp || new Date().toISOString(),
            source: 'hybrid'
          }))
        }
      });

      if (error) {
        console.error('Batch transcript save error:', error);
        // On error, try to save entries individually as fallback
        console.log('Falling back to individual saves...');
        for (const entry of entriesToSave) {
          await saveSingleTranscript(entry);
        }
      } else if (data && !data.success) {
        console.error('Batch transcript save failed:', data.error);
        // Fallback to individual saves
        for (const entry of entriesToSave) {
          await saveSingleTranscript(entry);
        }
      } else if (data && data.success) {
        console.log(`Batch saved successfully: ${data.saved_count} entries`);
      }
    } catch (error) {
      console.error('Unexpected error flushing transcripts:', error);
      // Try individual saves as last resort
      for (const entry of entriesToSave) {
        await saveSingleTranscript(entry);
      }
    } finally {
      isFlushingRef.current = false;
    }
  }, [sessionId, supabase, saveSingleTranscript]);

  // Start or reset the batch timeout
  const startBatchTimeout = useCallback(() => {
    // Clear existing timeout
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
    }

    // Set new timeout
    batchTimeoutRef.current = setTimeout(() => {
      flushTranscripts();
    }, batchTimeout);
  }, [batchTimeout, flushTranscripts]);

  // Add a transcript entry to the local state
  const addTranscriptEntry = useCallback((entry: TranscriptEntry) => {
    if (!entry.text.trim()) return;

    // Add timestamp if not provided
    const entryWithTimestamp = {
      ...entry,
      timestamp: entry.timestamp || new Date().toISOString()
    };

    // Update local state
    setTranscript(prev => [...prev, entryWithTimestamp]);

    // Call the update callback if provided
    if (onTranscriptUpdate) {
      const formattedText = `${entry.speaker === 'unknown' ? '' : `${entry.speaker}: `}${entry.text}`;
      onTranscriptUpdate(formattedText);
    }
  }, [onTranscriptUpdate]);

  // Clear the transcript
  const clearTranscript = useCallback(() => {
    setTranscript([]);
    transcriptBuffer.current = [];
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
      batchTimeoutRef.current = null;
    }
  }, []);

  // Save transcript entry with batching
  const saveTranscript = useCallback(async (
    text: string,
    speaker: 'candidate' | 'ai' | 'unknown' = 'unknown'
  ) => {
    if (!text.trim() || !sessionId) return;

    // Skip batching for test sessions
    if (sessionId.startsWith('test-')) {
      addTranscriptEntry({ text, speaker });
      return;
    }

    // Create transcript entry
    const entry: TranscriptEntry = {
      text,
      speaker,
      timestamp: new Date().toISOString()
    };

    // Add to local state immediately
    addTranscriptEntry(entry);

    // Add to buffer
    transcriptBuffer.current.push(entry);

    // Check if we should flush immediately
    if (transcriptBuffer.current.length >= batchSize) {
      await flushTranscripts();
    } else {
      // Start or reset the timeout
      startBatchTimeout();
    }
  }, [sessionId, addTranscriptEntry, batchSize, flushTranscripts, startBatchTimeout]);

  // Cleanup on unmount or session change
  useEffect(() => {
    return () => {
      // Flush any remaining transcripts when component unmounts
      if (transcriptBuffer.current.length > 0) {
        console.log('Flushing remaining transcripts on unmount...');
        flushTranscripts();
      }
      
      // Clear timeout
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
      }
    };
  }, [flushTranscripts]);

  // Flush when session ends
  useEffect(() => {
    if (!sessionId && transcriptBuffer.current.length > 0) {
      flushTranscripts();
    }
  }, [sessionId, flushTranscripts]);

  return {
    transcript,
    saveTranscript,
    addTranscriptEntry,
    clearTranscript,
    flushTranscripts
  };
}