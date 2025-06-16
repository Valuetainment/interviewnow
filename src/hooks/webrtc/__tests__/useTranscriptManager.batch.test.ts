import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useTranscriptManager } from '../useTranscriptManager';

// Mock Supabase
const mockInvoke = vi.fn();
const mockSupabase = {
  functions: {
    invoke: mockInvoke
  }
};

describe('useTranscriptManager - Batching', () => {
  const mockSessionId = 'session-123';
  const mockOnTranscriptUpdate = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });
  
  afterEach(() => {
    vi.useRealTimers();
  });

  it('should batch transcript entries up to batch size', async () => {
    const { result } = renderHook(() => 
      useTranscriptManager({
        sessionId: mockSessionId,
        onTranscriptUpdate: mockOnTranscriptUpdate,
        supabaseClient: mockSupabase as any,
        batchSize: 3,
        batchTimeout: 5000
      })
    );

    // Add 2 entries - should not trigger batch yet
    await act(async () => {
      await result.current.saveTranscript('Hello', 'candidate');
      await result.current.saveTranscript('How are you?', 'ai');
    });

    expect(mockInvoke).not.toHaveBeenCalled();
    expect(result.current.transcript).toHaveLength(2);

    // Add 3rd entry - should trigger batch flush
    mockInvoke.mockResolvedValueOnce({ 
      data: { success: true, saved_count: 3 }, 
      error: null 
    });

    await act(async () => {
      await result.current.saveTranscript('I am fine', 'candidate');
    });

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('interview-transcript-batch', {
        body: {
          interview_session_id: mockSessionId,
          entries: expect.arrayContaining([
            expect.objectContaining({ text: 'Hello', speaker: 'candidate' }),
            expect.objectContaining({ text: 'How are you?', speaker: 'ai' }),
            expect.objectContaining({ text: 'I am fine', speaker: 'candidate' })
          ])
        }
      });
    });
  });

  it('should flush batch after timeout', async () => {
    const { result } = renderHook(() => 
      useTranscriptManager({
        sessionId: mockSessionId,
        onTranscriptUpdate: mockOnTranscriptUpdate,
        supabaseClient: mockSupabase as any,
        batchSize: 10,
        batchTimeout: 3000
      })
    );

    // Add entries
    await act(async () => {
      await result.current.saveTranscript('Test message 1', 'candidate');
      await result.current.saveTranscript('Test message 2', 'ai');
    });

    expect(mockInvoke).not.toHaveBeenCalled();

    mockInvoke.mockResolvedValueOnce({ 
      data: { success: true, saved_count: 2 }, 
      error: null 
    });

    // Advance time to trigger timeout
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('interview-transcript-batch', {
        body: {
          interview_session_id: mockSessionId,
          entries: expect.arrayContaining([
            expect.objectContaining({ text: 'Test message 1', speaker: 'candidate' }),
            expect.objectContaining({ text: 'Test message 2', speaker: 'ai' })
          ])
        }
      });
    });
  });

  it('should fall back to individual saves on batch error', async () => {
    const { result } = renderHook(() => 
      useTranscriptManager({
        sessionId: mockSessionId,
        onTranscriptUpdate: mockOnTranscriptUpdate,
        supabaseClient: mockSupabase as any,
        batchSize: 2,
        batchTimeout: 5000
      })
    );

    // Add entries to trigger batch
    await act(async () => {
      await result.current.saveTranscript('Message 1', 'candidate');
      await result.current.saveTranscript('Message 2', 'ai');
    });

    // Mock batch failure
    mockInvoke.mockRejectedValueOnce(new Error('Batch failed'));

    // Mock individual saves success
    mockInvoke.mockResolvedValueOnce({ data: { success: true }, error: null });
    mockInvoke.mockResolvedValueOnce({ data: { success: true }, error: null });

    await waitFor(() => {
      // Should have called batch once and individual saves twice
      expect(mockInvoke).toHaveBeenCalledTimes(3);
      
      // First call should be batch
      expect(mockInvoke).toHaveBeenNthCalledWith(1, 'interview-transcript-batch', expect.any(Object));
      
      // Next calls should be individual saves
      expect(mockInvoke).toHaveBeenNthCalledWith(2, 'interview-transcript', 
        expect.objectContaining({
          body: expect.objectContaining({ text: 'Message 1' })
        })
      );
      expect(mockInvoke).toHaveBeenNthCalledWith(3, 'interview-transcript', 
        expect.objectContaining({
          body: expect.objectContaining({ text: 'Message 2' })
        })
      );
    });
  });

  it('should skip batching for test sessions', async () => {
    const { result } = renderHook(() => 
      useTranscriptManager({
        sessionId: 'test-session',
        onTranscriptUpdate: mockOnTranscriptUpdate,
        supabaseClient: mockSupabase as any,
        batchSize: 2,
        batchTimeout: 1000
      })
    );

    // Add entries
    await act(async () => {
      await result.current.saveTranscript('Test 1', 'candidate');
      await result.current.saveTranscript('Test 2', 'ai');
      await result.current.saveTranscript('Test 3', 'candidate');
    });

    // Should not call any edge functions
    expect(mockInvoke).not.toHaveBeenCalled();
    
    // But should update local state
    expect(result.current.transcript).toHaveLength(3);
  });

  it('should flush remaining transcripts on unmount', async () => {
    const { result, unmount } = renderHook(() => 
      useTranscriptManager({
        sessionId: mockSessionId,
        onTranscriptUpdate: mockOnTranscriptUpdate,
        supabaseClient: mockSupabase as any,
        batchSize: 10,
        batchTimeout: 60000
      })
    );

    // Add entries (not enough to trigger batch)
    await act(async () => {
      await result.current.saveTranscript('Final message', 'candidate');
    });

    expect(mockInvoke).not.toHaveBeenCalled();

    mockInvoke.mockResolvedValueOnce({ 
      data: { success: true, saved_count: 1 }, 
      error: null 
    });

    // Unmount should trigger flush
    unmount();

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('interview-transcript-batch', {
        body: {
          interview_session_id: mockSessionId,
          entries: expect.arrayContaining([
            expect.objectContaining({ text: 'Final message', speaker: 'candidate' })
          ])
        }
      });
    });
  });

  it('should handle manual flush', async () => {
    const { result } = renderHook(() => 
      useTranscriptManager({
        sessionId: mockSessionId,
        onTranscriptUpdate: mockOnTranscriptUpdate,
        supabaseClient: mockSupabase as any,
        batchSize: 10,
        batchTimeout: 60000
      })
    );

    // Add entries
    await act(async () => {
      await result.current.saveTranscript('Message 1', 'candidate');
      await result.current.saveTranscript('Message 2', 'ai');
    });

    expect(mockInvoke).not.toHaveBeenCalled();

    mockInvoke.mockResolvedValueOnce({ 
      data: { success: true, saved_count: 2 }, 
      error: null 
    });

    // Manual flush
    await act(async () => {
      await result.current.flushTranscripts();
    });

    expect(mockInvoke).toHaveBeenCalledWith('interview-transcript-batch', {
      body: {
        interview_session_id: mockSessionId,
        entries: expect.arrayContaining([
          expect.objectContaining({ text: 'Message 1', speaker: 'candidate' }),
          expect.objectContaining({ text: 'Message 2', speaker: 'ai' })
        ])
      }
    });
  });
});