import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Define transcript type for better type safety
interface TranscriptData {
  id: string;
  text: string;
  confidence?: number;
}

interface UseAudioCaptureProps {
  sessionId: string;
  tenantId: string;
  speaker: string;
  isRecording: boolean;
  onTranscriptReceived?: (transcript: TranscriptData) => void;
  onError?: (error: Error) => void;
}

/**
 * Custom hook for audio capture and real-time transcription
 */
export function useAudioCapture({
  sessionId,
  tenantId,
  speaker,
  isRecording,
  onTranscriptReceived,
  onError
}: UseAudioCaptureProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  
  // References for audio processing
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sequenceNumberRef = useRef(0);

  // Initialize audio capture
  useEffect(() => {
    const initializeAudio = async () => {
      try {
        // Request microphone access
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        
        // Set up audio analyzer for visualizing audio levels
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = audioContext;
        
        const analyser = audioContext.createAnalyser();
        analyserRef.current = analyser;
        analyser.fftSize = 256;
        
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        
        // Create the MediaRecorder instance
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'audio/webm',
        });
        mediaRecorderRef.current = mediaRecorder;
        
        // Set up audio level visualization
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        
        const updateAudioLevel = () => {
          if (!analyserRef.current || !isInitialized) return;
          
          analyserRef.current.getByteFrequencyData(dataArray);
          
          // Calculate audio level (average of frequency data)
          const average = dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length;
          const normalized = Math.min(100, Math.max(0, average));
          setAudioLevel(normalized);
          
          requestAnimationFrame(updateAudioLevel);
        };
        
        updateAudioLevel();
        setIsInitialized(true);
      } catch (err) {
        console.error('Error initializing audio capture:', err);
        setError(err instanceof Error ? err : new Error('Failed to initialize audio capture'));
        if (onError) onError(err instanceof Error ? err : new Error('Failed to initialize audio capture'));
      }
    };
    
    if (!isInitialized) {
      initializeAudio();
    }
    
    // Cleanup function to stop all audio streams and processing
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, [isInitialized, onError]);
  
  // Start/stop recording based on isRecording prop
  useEffect(() => {
    if (!isInitialized || !mediaRecorderRef.current) return;
    
    if (isRecording) {
      // Set up chunk collection and processing
      const chunks: Blob[] = [];
      
      mediaRecorderRef.current.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
          
          // Process the audio chunk and send to server
          await processAudioChunk(
            event.data, 
            sessionId, 
            tenantId,
            speaker, 
            sequenceNumberRef.current++
          );
        }
      };
      
      // Start recording with a reasonable timeslice (2 seconds)
      mediaRecorderRef.current.start(2000);
    } else {
      // Stop recording if it's active
      if (mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    }
    
    // Cleanup function
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, [isRecording, isInitialized, sessionId, tenantId, speaker]);
  
  // Process and send audio chunk to the server
  const processAudioChunk = async (
    chunk: Blob, 
    sessionId: string, 
    tenantId: string,
    speaker: string, 
    sequenceNumber: number
  ) => {
    try {
      // Convert blob to base64
      const arrayBuffer = await chunk.arrayBuffer();
      const base64Audio = btoa(
        new Uint8Array(arrayBuffer)
          .reduce((data, byte) => data + String.fromCharCode(byte), '')
      );
      
      // Send to transcript processor Edge Function
      const { data, error } = await supabase.functions.invoke('transcript-processor', {
        body: {
          session_id: sessionId,
          tenant_id: tenantId,
          audio_chunk: base64Audio,
          speaker,
          sequence_number: sequenceNumber,
        },
      });
      
      if (error) {
        throw new Error(`Edge Function error: ${error.message}`);
      }
      
      // Call the provided callback with the transcript data
      if (data && onTranscriptReceived) {
        onTranscriptReceived(data);
      }
    } catch (err) {
      console.error('Error processing audio chunk:', err);
      if (onError) {
        onError(err instanceof Error ? err : new Error('Failed to process audio'));
      }
    }
  };
  
  return {
    isInitialized,
    audioLevel,
    error,
  };
} 