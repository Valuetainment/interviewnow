import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRetry } from '../useRetry';

describe('useRetry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useRetry());
    
    expect(result.current.retryCount).toBe(0);
    expect(result.current.hasExceededMaxRetries).toBe(false);
    expect(result.current.autoReconnectDisabled).toBe(false);
  });

  it('should schedule retry with default backoff configuration', () => {
    const mockCallback = vi.fn();
    const { result } = renderHook(() => useRetry());
    
    act(() => {
      result.current.scheduleRetry(mockCallback);
    });
    
    // Initial delay should be 3000ms (as per DEFAULT_CONFIG)
    expect(mockCallback).not.toHaveBeenCalled();
    
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    
    expect(mockCallback).toHaveBeenCalledTimes(1);
    expect(result.current.retryCount).toBe(1);
  });

  it('should use exponential backoff for retries', () => {
    const mockCallback = vi.fn();
    const { result } = renderHook(() => useRetry());
    
    // First retry - 3000ms delay
    act(() => {
      result.current.scheduleRetry(mockCallback);
    });
    
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    
    expect(mockCallback).toHaveBeenCalledTimes(1);
    expect(result.current.retryCount).toBe(1);
    
    // Second retry - 6000ms delay (3000 * 2^1)
    act(() => {
      result.current.scheduleRetry(mockCallback);
    });
    
    act(() => {
      vi.advanceTimersByTime(5999);
    });
    
    expect(mockCallback).toHaveBeenCalledTimes(1); // Not yet called again
    
    act(() => {
      vi.advanceTimersByTime(1);
    });
    
    expect(mockCallback).toHaveBeenCalledTimes(2);
    expect(result.current.retryCount).toBe(2);
  });

  it('should respect maxRetries limit', () => {
    const mockCallback = vi.fn();
    const { result } = renderHook(() => useRetry({ maxRetries: 2 }));
    
    // First retry
    act(() => {
      result.current.scheduleRetry(mockCallback);
    });
    
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    
    // Second retry
    act(() => {
      result.current.scheduleRetry(mockCallback);
    });
    
    act(() => {
      vi.advanceTimersByTime(6000);
    });
    
    expect(result.current.retryCount).toBe(2);
    expect(result.current.hasExceededMaxRetries).toBe(false);
    
    // Try third retry - should not schedule
    act(() => {
      result.current.scheduleRetry(mockCallback);
    });
    
    // This should be a no-op since we've reached maxRetries
    act(() => {
      vi.advanceTimersByTime(12000);
    });
    
    expect(mockCallback).toHaveBeenCalledTimes(2); // Still just 2 calls
    expect(result.current.retryCount).toBe(2); // Count doesn't increase
  });

  it('should respect maxDelay parameter', () => {
    const mockCallback = vi.fn();
    const { result } = renderHook(() => 
      useRetry({ 
        initialDelay: 1000,
        maxDelay: 5000,
        backoffFactor: 3,
        maxRetries: 5
      })
    );
    
    // First retry - 1000ms
    act(() => {
      result.current.scheduleRetry(mockCallback);
    });
    
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    
    // Second retry - 3000ms (1000 * 3^1)
    act(() => {
      result.current.scheduleRetry(mockCallback);
    });
    
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    
    // Third retry - should be 9000ms, but capped at 5000ms
    act(() => {
      result.current.scheduleRetry(mockCallback);
    });
    
    act(() => {
      vi.advanceTimersByTime(4999);
    });
    
    expect(mockCallback).toHaveBeenCalledTimes(2);
    
    act(() => {
      vi.advanceTimersByTime(1);
    });
    
    expect(mockCallback).toHaveBeenCalledTimes(3);
  });

  it('should not schedule retry when autoReconnectDisabled is true', () => {
    const mockCallback = vi.fn();
    const { result } = renderHook(() => useRetry());
    
    act(() => {
      result.current.setAutoReconnectDisabled(true);
    });
    
    act(() => {
      result.current.scheduleRetry(mockCallback);
    });
    
    act(() => {
      vi.advanceTimersByTime(10000); // Advance well past any retry delay
    });
    
    expect(mockCallback).not.toHaveBeenCalled();
  });

  it('should reset retry count correctly', () => {
    const mockCallback = vi.fn();
    const { result } = renderHook(() => useRetry());
    
    // Perform some retries
    act(() => {
      result.current.scheduleRetry(mockCallback);
    });
    
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    
    act(() => {
      result.current.scheduleRetry(mockCallback);
    });
    
    act(() => {
      vi.advanceTimersByTime(6000);
    });
    
    expect(result.current.retryCount).toBe(2);
    
    // Reset the count
    act(() => {
      result.current.resetRetryCount();
    });
    
    expect(result.current.retryCount).toBe(0);
    expect(result.current.hasExceededMaxRetries).toBe(false);
  });
});