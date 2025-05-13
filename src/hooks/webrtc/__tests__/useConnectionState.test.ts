import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useConnectionState, ConnectionState } from '../useConnectionState';

describe('useConnectionState', () => {
  const mockConnectionStateChangeHandler = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with disconnected state', () => {
    const { result } = renderHook(() => useConnectionState());
    
    expect(result.current.connectionState).toBe('disconnected');
    expect(result.current.error).toBeNull();
    expect(result.current.isConnecting).toBe(false);
    expect(result.current.isConnected).toBe(false);
    expect(result.current.isDisconnected).toBe(true);
    expect(result.current.isError).toBe(false);
  });

  it('should update connection state correctly', () => {
    const { result } = renderHook(() => useConnectionState(mockConnectionStateChangeHandler));
    
    // Test setting to connecting
    act(() => {
      result.current.setConnectionState('connecting');
    });
    
    expect(result.current.connectionState).toBe('connecting');
    expect(result.current.isConnecting).toBe(false); // isConnecting is controlled separately
    expect(result.current.isConnected).toBe(false);
    expect(result.current.isDisconnected).toBe(false);
    expect(result.current.isError).toBe(false);
    expect(mockConnectionStateChangeHandler).toHaveBeenCalledWith('connecting');
    
    // Test setting to connected
    act(() => {
      result.current.setConnectionState('connected');
    });
    
    expect(result.current.connectionState).toBe('connected');
    expect(result.current.isConnected).toBe(true);
    expect(result.current.isDisconnected).toBe(false);
    expect(result.current.isError).toBe(false);
    expect(mockConnectionStateChangeHandler).toHaveBeenCalledWith('connected');
    
    // Test setting to error
    act(() => {
      result.current.setConnectionState('error');
    });
    
    expect(result.current.connectionState).toBe('error');
    expect(result.current.isConnected).toBe(false);
    expect(result.current.isDisconnected).toBe(false);
    expect(result.current.isError).toBe(true);
    expect(mockConnectionStateChangeHandler).toHaveBeenCalledWith('error');
  });

  it('should handle setting error message', () => {
    const { result } = renderHook(() => useConnectionState());
    
    act(() => {
      result.current.setError('Test error message');
    });
    
    expect(result.current.error).toBe('Test error message');
    
    act(() => {
      result.current.setError(null);
    });
    
    expect(result.current.error).toBeNull();
  });

  it('should handle isConnecting state', () => {
    const { result } = renderHook(() => useConnectionState());
    
    act(() => {
      result.current.setIsConnecting(true);
    });
    
    expect(result.current.isConnecting).toBe(true);
    
    act(() => {
      result.current.setIsConnecting(false);
    });
    
    expect(result.current.isConnecting).toBe(false);
  });

  it('should correctly identify error states', () => {
    const { result } = renderHook(() => useConnectionState());
    
    // Test ice_failed state
    act(() => {
      result.current.setConnectionState('ice_failed');
    });
    
    expect(result.current.isError).toBe(true);
    
    // Test connection_failed state
    act(() => {
      result.current.setConnectionState('connection_failed');
    });
    
    expect(result.current.isError).toBe(true);
  });
});