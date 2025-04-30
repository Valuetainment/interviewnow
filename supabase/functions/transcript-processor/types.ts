/**
 * Interface for transcript entries stored in the database
 */
export interface TranscriptEntry {
  tenant_id: string;
  session_id: string;
  speaker: string;
  text: string;
  start_ms: number;
  confidence?: number;
  sequence_number?: number;
}

/**
 * Interface for transcript response from the Edge Function
 */
export interface TranscriptResponse {
  text: string;
  confidence?: number;
}

/**
 * Interface for OpenAI API response
 */
export interface OpenAITranscriptionResponse {
  text: string;
  segments: TranscriptionSegment[];
}

/**
 * Interface for OpenAI API response segments
 */
export interface TranscriptionSegment {
  id: number;
  seek: number;
  start: number;
  end: number;
  text: string;
  tokens: number[];
  temperature: number;
  avg_logprob: number;
  compression_ratio: number;
  no_speech_prob: number;
  confidence: number;
} 