import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface TranscriptEntry {
  id: string;
  tenant_id: string;
  session_id: string;
  speaker: string;
  text: string;
  start_ms: number;
  confidence?: number;
  sequence_number?: number;
}

interface UseTranscriptSubscriptionProps {
  sessionId: string;
  onNewEntry?: (entry: TranscriptEntry) => void;
  onError?: (error: Error) => void;
}

/**
 * Custom hook for subscribing to real-time transcript updates
 */
export function useTranscriptSubscription({
  sessionId,
  onNewEntry,
  onError
}: UseTranscriptSubscriptionProps) {
  const [entries, setEntries] = useState<TranscriptEntry[]>([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Subscribe to real-time transcript updates
  useEffect(() => {
    if (!sessionId) return;

    const channelName = `interview:${sessionId}`;
    
    // Set up Supabase Realtime subscription
    const channel = supabase
      .channel(channelName)
      .on('broadcast', { event: 'transcript.new' }, (payload) => {
        try {
          const newEntry = payload.payload as TranscriptEntry;
          
          // Update local state
          setEntries((prevEntries) => {
            // Check if entry already exists by sequence number
            const exists = prevEntries.some(entry => 
              entry.sequence_number === newEntry.sequence_number && 
              entry.speaker === newEntry.speaker
            );
            
            if (exists) {
              return prevEntries;
            }
            
            // Sort entries by sequence number for correct order
            return [...prevEntries, newEntry].sort((a, b) => 
              (a.sequence_number || 0) - (b.sequence_number || 0)
            );
          });
          
          // Call the provided callback
          if (onNewEntry) {
            onNewEntry(newEntry);
          }
        } catch (err) {
          console.error('Error processing transcript entry:', err);
          const newError = err instanceof Error ? err : new Error('Failed to process transcript entry');
          setError(newError);
          if (onError) onError(newError);
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsSubscribed(true);
        } else if (status === 'CHANNEL_ERROR') {
          const newError = new Error('Failed to subscribe to transcript updates');
          setError(newError);
          if (onError) onError(newError);
        }
      });
    
    // Cleanup function to unsubscribe
    return () => {
      supabase.removeChannel(channel);
      setIsSubscribed(false);
    };
  }, [sessionId, onNewEntry, onError]);

  // Load existing transcript entries
  useEffect(() => {
    const loadExistingEntries = async () => {
      if (!sessionId) return;
      
      try {
        const { data, error } = await supabase
          .from('transcript_entries')
          .select('*')
          .eq('session_id', sessionId)
          .order('sequence_number', { ascending: true });
        
        if (error) throw error;
        
        if (data) {
          setEntries(data as TranscriptEntry[]);
        }
      } catch (err) {
        console.error('Error loading transcript entries:', err);
        const newError = err instanceof Error ? err : new Error('Failed to load transcript entries');
        setError(newError);
        if (onError) onError(newError);
      }
    };
    
    loadExistingEntries();
  }, [sessionId, onError]);

  return {
    entries,
    isSubscribed,
    error
  };
} 