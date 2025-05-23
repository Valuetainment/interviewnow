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
  const isMountedRef = useRef<boolean>(true);
  const lastUpdateTimeRef = useRef<number>(0);
  const isProcessingFrameRef = useRef<boolean>(false);
  const throttleIntervalRef = useRef<number>(100); // Only update visualization 10 times per second (100ms)

  // Cleanup function for audio resources
  const cleanup = useCallback(() => {
    console.log('Running audio visualization cleanup');

    try {
      // Stop animation frame
      if (animationFrameRef.current) {
        console.log('Canceling animation frame');
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      // Stop all media stream tracks to release the microphone
      if (streamRef.current) {
        console.log('Stopping media stream tracks');
        try {
          const tracks = streamRef.current.getTracks();
          tracks.forEach(track => {
            try {
              if (track.readyState === 'live') {
                track.stop();
                console.log('Stopped track:', track.kind);
              }
            } catch (trackError) {
              console.error('Error stopping media track:', trackError);
            }
          });
        } catch (streamError) {
          console.error('Error accessing stream tracks:', streamError);
        }
      }

      // Close audio context
      if (audioContextRef.current) {
        console.log('Closing audio context, current state:', audioContextRef.current.state);
        if (audioContextRef.current.state !== 'closed') {
          try {
            audioContextRef.current.close();
          } catch (error) {
            console.error('Error closing audio context:', error);
          }
        }
        audioContextRef.current = null;
      }

      // Clear other references
      analyserRef.current = null;
      streamRef.current = null;

      // Only update state if component is still mounted
      if (isMountedRef.current) {
        console.log('Resetting audio visualization state');
        setAudioLevel(0);
        setIsRecording(false);
        setVisualizationData([]);
      }

      console.log('Audio visualization cleanup completed');
    } catch (error) {
      console.error('Error during audio visualization cleanup:', error);
    }
  }, []);

  // Set up audio visualization
  const startVisualization = useCallback((stream: MediaStream) => {
    console.log('Starting audio visualization');

    try {
      // Clean up existing audio context if any
      cleanup();

      // Prevent starting visualization if component is unmounting
      if (!isMountedRef.current) {
        console.log('Component is unmounting, not starting visualization');
        return;
      }

      // Check if stream is valid
      if (!stream || stream.getTracks().length === 0) {
        console.error('Invalid media stream provided to startVisualization');
        return;
      }

      // Reset state
      lastUpdateTimeRef.current = 0;
      isProcessingFrameRef.current = false;

      // Store the stream
      streamRef.current = stream;

      // Verify stream has audio tracks
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) {
        console.warn('No audio tracks found in the provided stream');
      } else {
        console.log(`Found ${audioTracks.length} audio tracks, using first track`);
      }

      // Update state only if component is still mounted
      if (isMountedRef.current) {
        setIsRecording(true);
      } else {
        console.log('Component unmounted after cleanup, aborting visualization start');
        return;
      }

      // Create audio context with error handling
      let audioContext: AudioContext;
      try {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (contextError) {
        console.error('Failed to create AudioContext:', contextError);
        if (isMountedRef.current) setIsRecording(false);
        return;
      }

      // Create analyzer with explicit error handling
      let analyser: AnalyserNode;
      try {
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256; // Use smaller FFT size for better performance
        analyser.smoothingTimeConstant = 0.8;
      } catch (analyserError) {
        console.error('Failed to create AnalyserNode:', analyserError);
        try { audioContext.close(); } catch (e) { console.error('Error closing audio context:', e); }
        if (isMountedRef.current) setIsRecording(false);
        return;
      }

      // Connect stream to analyzer with error handling
      let source: MediaStreamAudioSourceNode;
      try {
        source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
      } catch (sourceError) {
        console.error('Failed to create or connect MediaStreamSource:', sourceError);
        try { audioContext.close(); } catch (e) { console.error('Error closing audio context:', e); }
        if (isMountedRef.current) setIsRecording(false);
        return;
      }

      // Store references
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      // Start visualization loop
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      // Store the last level value to prevent unnecessary updates
      let lastLevel = 0;
      let lastVisData: number[] = [];

      const updateVisualization = () => {
        // Prevent re-entry if already processing a frame
        if (isProcessingFrameRef.current) {
          console.log('Already processing a frame, skipping');
          animationFrameRef.current = requestAnimationFrame(updateVisualization);
          return;
        }

        // Check if component is still mounted and analyzer exists
        if (!isMountedRef.current || !analyserRef.current) {
          console.log('Component unmounted or analyzer missing, stopping visualization loop');
          return;
        }

        try {
          isProcessingFrameRef.current = true;

          // Apply throttling to reduce CPU usage and prevent excessive renders
          const now = performance.now();
          const timeSinceLastUpdate = now - lastUpdateTimeRef.current;

          // Skip processing this frame if we updated too recently
          if (timeSinceLastUpdate < throttleIntervalRef.current) {
            isProcessingFrameRef.current = false;
            animationFrameRef.current = requestAnimationFrame(updateVisualization);
            return;
          }

          // Update the last update time
          lastUpdateTimeRef.current = now;

          // Get frequency data
          analyserRef.current.getByteFrequencyData(dataArray);

          // Calculate average level
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const average = sum / dataArray.length;

          // Scale to 0-100 range
          const scaledLevel = Math.min(Math.round(average / 256 * 100), 100);

          // Only update state if the level has changed significantly (reduce renders)
          // Use a higher threshold to further reduce updates
          if (Math.abs(scaledLevel - lastLevel) > 5) {
            lastLevel = scaledLevel;
            if (isMountedRef.current) {
              setAudioLevel(scaledLevel);
            }
          }

          // Process only every ~10 frames for visualization data to reduce load
          // Only sample a subset of the frequency data (every 3rd value)
          const reducedData = [];
          for (let i = 0; i < Math.min(dataArray.length, 60); i += 3) {
            reducedData.push(dataArray[i] / 255);
          }

          // Check if the visualization data has changed significantly
          const shouldUpdateVisData = reducedData.some(
            (val, idx) => !lastVisData[idx] || Math.abs(val - lastVisData[idx]) > 0.1
          );

          if (shouldUpdateVisData) {
            lastVisData = reducedData;
            if (isMountedRef.current) {
              setVisualizationData(reducedData);
            }
          }
        } catch (error) {
          console.error('Error in visualization update:', error);
        } finally {
          isProcessingFrameRef.current = false;

          // Schedule next frame only if component is still mounted
          if (isMountedRef.current) {
            animationFrameRef.current = requestAnimationFrame(updateVisualization);
          } else {
            console.log('Component unmounted during visualization, stopping loop');
          }
        }
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
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
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