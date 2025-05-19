import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTranscriptManager, TranscriptEntry } from '../useTranscriptManager';

/**
 * HYBRID ARCHITECTURE TESTS
 *
 * These tests focus on the transcript management functionality as used in the hybrid architecture approach.
 * In the hybrid architecture, transcripts come directly from OpenAI's WebRTC implementation
 * and are saved to the database with the appropriate source attribution.
 */

// Mock Supabase client
const mockInvoke = vi.fn().mockResolvedValue({ data: null, error: null });
const mockSupabaseClient = {
  functions: {
    invoke: mockInvoke
  }
};

describe('useTranscriptManager for Hybrid Architecture', () => {
  const mockSessionId = 'test-session-id';
  const mockOnTranscriptUpdate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-05-19T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should initialize with empty transcript', () => {
    const { result } = renderHook(() =>
      useTranscriptManager({
        sessionId: mockSessionId,
        onTranscriptUpdate: mockOnTranscriptUpdate,
        supabaseClient: mockSupabaseClient as any
      })
    );

    expect(result.current.transcript).toEqual([]);
  });

  it('should add OpenAI transcript entries to local state', () => {
    const { result } = renderHook(() =>
      useTranscriptManager({
        sessionId: mockSessionId,
        onTranscriptUpdate: mockOnTranscriptUpdate,
        supabaseClient: mockSupabaseClient as any
      })
    );

    const testEntry: TranscriptEntry = {
      text: 'Candidate response about technical experience',
      speaker: 'candidate'
    };

    act(() => {
      result.current.addTranscriptEntry(testEntry);
    });

    // Should add entry with timestamp
    expect(result.current.transcript).toHaveLength(1);
    expect(result.current.transcript[0]).toEqual({
      ...testEntry,
      timestamp: '2025-05-19T12:00:00Z'
    });

    // Should call the update callback with formatted text
    expect(mockOnTranscriptUpdate).toHaveBeenCalledWith('candidate: Candidate response about technical experience');
  });

  it('should save OpenAI transcript to the database with hybrid source attribution', async () => {
    const { result } = renderHook(() =>
      useTranscriptManager({
        sessionId: mockSessionId,
        supabaseClient: mockSupabaseClient as any
      })
    );

    await act(async () => {
      await result.current.saveTranscript('AI interviewer question about experience', 'ai');
    });

    // Should invoke the edge function with hybrid source
    expect(mockInvoke).toHaveBeenCalledWith('interview-transcript', {
      body: JSON.stringify({
        interview_session_id: mockSessionId,
        text: 'AI interviewer question about experience',
        speaker: 'ai',
        timestamp: '2025-05-19T12:00:00Z',
        source: 'hybrid'
      })
    });

    // Should add to local state
    expect(result.current.transcript).toHaveLength(1);
    expect(result.current.transcript[0].text).toBe('AI interviewer question about experience');
    expect(result.current.transcript[0].speaker).toBe('ai');
  });

  it('should save candidate transcript to the database with hybrid source attribution', async () => {
    const { result } = renderHook(() =>
      useTranscriptManager({
        sessionId: mockSessionId,
        supabaseClient: mockSupabaseClient as any
      })
    );

    await act(async () => {
      await result.current.saveTranscript('I have five years of experience with React', 'candidate');
    });

    // Should invoke the edge function with hybrid source
    expect(mockInvoke).toHaveBeenCalledWith('interview-transcript', {
      body: JSON.stringify({
        interview_session_id: mockSessionId,
        text: 'I have five years of experience with React',
        speaker: 'candidate',
        timestamp: '2025-05-19T12:00:00Z',
        source: 'hybrid'
      })
    });
  });

  it('should handle transcript save errors gracefully in production environment', async () => {
    // Mock error response once
    mockInvoke.mockRejectedValueOnce(new Error('Database error'));

    const { result } = renderHook(() =>
      useTranscriptManager({
        sessionId: mockSessionId,
        supabaseClient: mockSupabaseClient as any
      })
    );

    // This shouldn't throw even though the invoke fails
    await act(async () => {
      await result.current.saveTranscript('Test with error', 'ai');
    });

    // Should still add to local state despite API error
    expect(result.current.transcript).toHaveLength(1);
    expect(result.current.transcript[0].text).toBe('Test with error');
  });

  it('should clear transcript entries when session ends', () => {
    const { result } = renderHook(() =>
      useTranscriptManager({
        sessionId: mockSessionId,
        supabaseClient: mockSupabaseClient as any
      })
    );

    // Add some AI and candidate entries
    act(() => {
      result.current.addTranscriptEntry({
        text: 'Tell me about your experience with React',
        speaker: 'ai'
      });

      result.current.addTranscriptEntry({
        text: 'I have five years of experience with React',
        speaker: 'candidate'
      });
    });

    expect(result.current.transcript).toHaveLength(2);

    // Clear the transcript
    act(() => {
      result.current.clearTranscript();
    });

    expect(result.current.transcript).toHaveLength(0);
  });

  it('should handle OpenAI transcript format with timestamps', () => {
    const { result } = renderHook(() =>
      useTranscriptManager({
        sessionId: mockSessionId,
        supabaseClient: mockSupabaseClient as any
      })
    );

    const customTimestamp = '2025-05-18T10:30:00Z';

    act(() => {
      result.current.addTranscriptEntry({
        text: 'This is from the OpenAI transcript event',
        speaker: 'ai',
        timestamp: customTimestamp
      });
    });

    expect(result.current.transcript[0].timestamp).toBe(customTimestamp);
  });

  it('should handle transcript entries in simulation mode without database saves', async () => {
    // Mock Supabase client for simulation mode
    const mockSimulationClient = {
      functions: {
        invoke: vi.fn() // Should not be called in simulation mode
      }
    };

    const { result } = renderHook(() =>
      useTranscriptManager({
        sessionId: 'simulation-session',
        simulationMode: true,
        supabaseClient: mockSimulationClient as any
      })
    );

    await act(async () => {
      await result.current.saveTranscript('Simulated AI response', 'ai');
    });

    // Should add to local state
    expect(result.current.transcript).toHaveLength(1);
    expect(result.current.transcript[0].text).toBe('Simulated AI response');

    // Should not invoke the edge function in simulation mode
    expect(mockSimulationClient.functions.invoke).not.toHaveBeenCalled();
  });

  it('should not save transcript to database when in demo mode', async () => {
    const { result } = renderHook(() =>
      useTranscriptManager({
        sessionId: 'demo-session',
        demoMode: true,
        supabaseClient: mockSupabaseClient as any
      })
    );

    await act(async () => {
      await result.current.saveTranscript('Demo transcript text', 'ai');
    });

    // Should add to local state
    expect(result.current.transcript).toHaveLength(1);

    // Should not invoke the edge function in demo mode
    expect(mockInvoke).not.toHaveBeenCalled();
  });

  it('should format transcript entries from OpenAI data channel messages', () => {
    const { result } = renderHook(() =>
      useTranscriptManager({
        sessionId: mockSessionId,
        onTranscriptUpdate: mockOnTranscriptUpdate,
        supabaseClient: mockSupabaseClient as any
      })
    );

    // OpenAI format - user speech transcript
    act(() => {
      result.current.addTranscriptEntry({
        text: 'I have worked with React for five years',
        speaker: 'candidate',
        type: 'conversation.item.input_audio_transcription.completed'
      });
    });

    // OpenAI format - AI speech transcript
    act(() => {
      result.current.addTranscriptEntry({
        text: 'Can you tell me about a challenging project?',
        speaker: 'ai',
        type: 'response.audio_transcript.delta'
      });
    });

    expect(result.current.transcript).toHaveLength(2);
    expect(mockOnTranscriptUpdate).toHaveBeenCalledWith('candidate: I have worked with React for five years');
    expect(mockOnTranscriptUpdate).toHaveBeenCalledWith('ai: Can you tell me about a challenging project?');
  });
});