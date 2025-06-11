import { useState, useCallback } from 'react';
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
}

export interface TranscriptManagerHandlers {
  transcript: TranscriptEntry[];
  saveTranscript: (text: string, speaker?: 'candidate' | 'ai' | 'unknown') => Promise<void>;
  addTranscriptEntry: (entry: TranscriptEntry) => void;
  clearTranscript: () => void;
}

/**
 * Hook for managing interview transcripts
 */
export function useTranscriptManager({
  sessionId,
  onTranscriptUpdate,
  supabaseClient
}: TranscriptManagerConfig): TranscriptManagerHandlers {
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);

  // Use provided Supabase client or default
  const supabase = supabaseClient || defaultSupabaseClient;

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
  }, []);

  // Save transcript entry to the database
  const saveTranscript = useCallback(async (
    text: string,
    speaker: 'candidate' | 'ai' | 'unknown' = 'unknown'
  ) => {
    if (!text.trim() || !sessionId) return;

    try {
      // Create transcript entry in local state first
      addTranscriptEntry({ text, speaker });

      // Log the attempt
      console.log('Saving transcript:', { sessionId, speaker, textLength: text.length });

      // Call transcript Edge Function to save the entry
      const { data, error } = await supabase.functions.invoke('interview-transcript', {
        body: {
          interview_session_id: sessionId,
          text,
          speaker,
          timestamp: new Date().toISOString(),
          source: 'hybrid' // Indicate this is from the hybrid architecture
        }
      });

      if (error) {
        console.error('Edge function invocation error:', error);
        // Don't throw - we don't want to break the interview
        // The transcript is already saved locally, so the user can still see it
      } else if (data && !data.success) {
        console.error('Transcript save failed:', data.error);
        // Again, don't throw - local state is already updated
      } else if (data && data.success) {
        console.log('Transcript saved successfully:', data.entry_id);
      }
    } catch (error) {
      console.error('Unexpected error saving transcript:', error);
      // We don't retry here as this shouldn't block the interview
      // The transcript is still visible locally
    }
  }, [sessionId, supabase, addTranscriptEntry]);

  return {
    transcript,
    saveTranscript,
    addTranscriptEntry,
    clearTranscript
  };
}