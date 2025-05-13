import { useState, useRef, useEffect, useCallback } from 'react';

export interface AudioVisualizationState {
  audioLevel: number;
  isRecording: boolean;
  visualizationData: number[];
}

export interface AudioVisualizationHandlers extends AudioVisualizationState {
  startVisualization: (stream: MediaStream) => void;
  stopVisualization: () => void;
}

/**
 * Hook for managing audio visualization
 */
export function useAudioVisualization(): AudioVisualizationHandlers {
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [visualizationData, setVisualizationData] = useState<number[]>([]);

  // References
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Cleanup function for audio resources
  const cleanup = useCallback(() => {
    // Stop animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Close audio context
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(error => 
        console.error('Error closing audio context:', error)
      );
      audioContextRef.current = null;
    }

    analyserRef.current = null;
    streamRef.current = null;
    setAudioLevel(0);
    setIsRecording(false);
    setVisualizationData([]);
  }, []);

  // Set up audio visualization
  const startVisualization = useCallback((stream: MediaStream) => {
    try {
      // Clean up existing audio context if any
      cleanup();

      // Store the stream
      streamRef.current = stream;
      setIsRecording(true);

      // Create audio context and analyzer
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;

      // Connect stream to analyzer
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      // Store references
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      // Start visualization loop
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      
      const updateVisualization = () => {
        if (!analyserRef.current) return;

        analyserRef.current.getByteFrequencyData(dataArray);

        // Calculate average level
        let sum = 0;
        dataArray.forEach(value => sum += value);
        const average = sum / dataArray.length;

        // Scale to 0-100 range
        const scaledLevel = Math.min(Math.round(average / 256 * 100), 100);
        setAudioLevel(scaledLevel);

        // Create visualization data array for rendering
        const visData = Array.from(dataArray).slice(0, 20).map(val => val / 255);
        setVisualizationData(visData);

        // Schedule next frame
        animationFrameRef.current = requestAnimationFrame(updateVisualization);
      };

      // Start the loop
      animationFrameRef.current = requestAnimationFrame(updateVisualization);
    } catch (error) {
      console.error('Error setting up audio visualization:', error);
    }
  }, [cleanup]);

  // Stop audio visualization
  const stopVisualization = useCallback(() => {
    cleanup();
  }, [cleanup]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    audioLevel,
    isRecording,
    visualizationData,
    startVisualization,
    stopVisualization
  };
}