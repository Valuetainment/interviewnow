import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAudioVisualization } from '../useAudioVisualization';

describe('useAudioVisualization', () => {
  // Mock MediaStream for testing
  const createMockMediaStream = () => {
    return {
      getTracks: vi.fn().mockReturnValue([
        { kind: 'audio', stop: vi.fn(), enabled: true }
      ]),
      getAudioTracks: vi.fn().mockReturnValue([
        { kind: 'audio', stop: vi.fn(), enabled: true }
      ])
    };
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useAudioVisualization());
    
    expect(result.current.audioLevel).toBe(0);
    expect(result.current.isRecording).toBe(false);
    expect(result.current.visualizationData).toEqual([]);
  });

  it('should start visualization when provided with a media stream', () => {
    const { result } = renderHook(() => useAudioVisualization());
    const mockStream = createMockMediaStream();
    
    act(() => {
      result.current.startVisualization(mockStream as any);
    });
    
    expect(result.current.isRecording).toBe(true);
    
    // Since we have mock implementation for getByteFrequencyData that sets random values,
    // we should at least check that visualizationData has been populated
    expect(result.current.visualizationData.length).toBeGreaterThan(0);
    
    // Check that audioLevel is computed
    expect(result.current.audioLevel).toBeGreaterThanOrEqual(0);
    expect(result.current.audioLevel).toBeLessThanOrEqual(100);
  });

  it('should clean up resources when stopVisualization is called', () => {
    const { result } = renderHook(() => useAudioVisualization());
    const mockStream = createMockMediaStream();
    
    // Start visualization
    act(() => {
      result.current.startVisualization(mockStream as any);
    });
    
    expect(result.current.isRecording).toBe(true);
    
    // Stop visualization
    act(() => {
      result.current.stopVisualization();
    });
    
    expect(result.current.isRecording).toBe(false);
    expect(result.current.audioLevel).toBe(0);
    expect(result.current.visualizationData).toEqual([]);
  });

  it('should clean up on unmount', () => {
    // Create spy on window.cancelAnimationFrame
    const cancelAnimationFrameSpy = vi.spyOn(global, 'cancelAnimationFrame');
    
    const { result, unmount } = renderHook(() => useAudioVisualization());
    const mockStream = createMockMediaStream();
    
    // Start visualization
    act(() => {
      result.current.startVisualization(mockStream as any);
    });
    
    // Unmount hook
    unmount();
    
    // Animation frame should be canceled
    expect(cancelAnimationFrameSpy).toHaveBeenCalled();
    
    // Clean up spy
    cancelAnimationFrameSpy.mockRestore();
  });

  it('should restart visualization when a new stream is provided', () => {
    const { result } = renderHook(() => useAudioVisualization());
    const mockStream1 = createMockMediaStream();
    const mockStream2 = createMockMediaStream();
    
    // Start with first stream
    act(() => {
      result.current.startVisualization(mockStream1 as any);
    });
    
    expect(result.current.isRecording).toBe(true);
    
    // Create spy to check that cleanup happens
    const cancelAnimationFrameSpy = vi.spyOn(global, 'cancelAnimationFrame');
    
    // Start with second stream
    act(() => {
      result.current.startVisualization(mockStream2 as any);
    });
    
    // Should have called cleanup
    expect(cancelAnimationFrameSpy).toHaveBeenCalled();
    
    // But should still be recording with new stream
    expect(result.current.isRecording).toBe(true);
    
    // Clean up spy
    cancelAnimationFrameSpy.mockRestore();
  });
});