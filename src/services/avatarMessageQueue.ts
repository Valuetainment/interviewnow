/**
 * Avatar Message Queue Service
 * Handles Akool's 1KB message limits with sentence detection and rate limiting
 * Implements chunking and completion detection for smooth avatar speech
 */

import type { QueuedMessage } from '../types/avatar';

interface ChunkedMessage {
  v: number;
  type: string;
  mid: string;
  idx: number;
  fin: boolean;
  pld: { text: string };
}

interface RTCClient {
  send?: (data: string) => void;
  sendMessage?: (data: string) => void;
  // Add other RTC client methods as needed
}

export class AvatarMessageQueue {
  private queue: QueuedMessage[] = [];
  private sending = false;
  private sentenceBuffer = '';
  private lastDeltaTimestamp = 0;
  private completionTimer?: NodeJS.Timeout;
  private pendingChunks: Map<string, ChunkedMessage[]> = new Map();
  
  // Rate limiting - Akool limits: 1KB per message, 6KB/s overall
  private readonly MAX_CHUNK_SIZE = 200; // Safe limit for JSON overhead
  private readonly RATE_LIMIT_BYTES_PER_SECOND = 6000; // 6KB/s
  private lastSentTime = 0;
  private sentBytesInWindow = 0;
  private readonly RATE_WINDOW_MS = 1000; // 1 second window

  /**
   * Add message to queue and process if needed
   */
  async add(message: QueuedMessage): Promise<void> {
    this.queue.push(message);
    
    // Update sentence buffer for completion detection
    this.sentenceBuffer = message.text;
    this.lastDeltaTimestamp = message.timestamp;
    
    // Process immediate sentence completions
    const completeSentences = this.detectCompleteSentences(message.text);
    if (completeSentences.length > 0) {
      for (const sentence of completeSentences) {
        await this.sendChunkedMessage(sentence, false);
      }
    }
    
    // Set completion timer for partial sentences
    this.detectCompletion(() => {
      this.finalizePendingMessage();
    });
  }

  /**
   * Send message to avatar with proper chunking and rate limiting
   */
  async sendMessage(client: RTCClient, text: string, isFinal: boolean = false): Promise<void> {
    if (!client || !text.trim()) return;
    
    try {
      await this.sendChunkedMessage(text, isFinal);
    } catch (error) {
      console.error('[Avatar Queue] Failed to send message:', error);
      throw error;
    }
  }

  /**
   * Detect completion with 500ms timeout for natural speech breaks
   */
  detectCompletion(callback: () => void): void {
    clearTimeout(this.completionTimer);
    this.completionTimer = setTimeout(() => {
      if (this.sentenceBuffer.trim()) {
        callback();
        this.finalize();
      }
    }, 500); // 500ms timeout as specified in roadmap
  }

  /**
   * Detect complete sentences for natural breaking points
   */
  private detectCompleteSentences(text: string): string[] {
    // Enhanced sentence detection with multiple punctuation types
    const sentenceEnders = /[.!?]+\s+/g;
    const sentences: string[] = [];
    
    let match;
    let lastIndex = 0;
    
    while ((match = sentenceEnders.exec(text)) !== null) {
      const sentence = text.slice(lastIndex, match.index + match[0].length).trim();
      if (sentence) {
        sentences.push(sentence);
      }
      lastIndex = match.index + match[0].length;
    }
    
    // Update buffer with remaining incomplete text
    const remaining = text.slice(lastIndex).trim();
    this.sentenceBuffer = remaining;
    
    return sentences;
  }

  /**
   * Send message in chunks respecting Akool's size and rate limits
   */
  private async sendChunkedMessage(text: string, isFinal: boolean): Promise<void> {
    if (!text.trim()) return;
    
    const chunks = this.chunkText(text, this.MAX_CHUNK_SIZE);
    const messageId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    for (let i = 0; i < chunks.length; i++) {
      const isLastChunk = i === chunks.length - 1;
      const message: ChunkedMessage = {
        v: 2,
        type: 'chat',
        mid: `${messageId}-${i}`,
        idx: i,
        fin: isLastChunk && isFinal,
        pld: { text: chunks[i] }
      };
      
      const encoded = new TextEncoder().encode(JSON.stringify(message));
      
      // Apply rate limiting
      await this.rateLimitDelay(encoded.length);
      
      // Send the chunk (implementation depends on the RTC client)
      console.log('[Avatar Queue] Sending chunk:', message);
      
      // Store for potential retry or cleanup
      if (!this.pendingChunks.has(messageId)) {
        this.pendingChunks.set(messageId, []);
      }
      this.pendingChunks.get(messageId)!.push(message);
    }
    
    // Clean up completed messages
    if (isFinal) {
      this.pendingChunks.delete(messageId);
    }
  }

  /**
   * Apply rate limiting delay based on Akool's 6KB/s limit
   */
  private async rateLimitDelay(bytes: number): Promise<void> {
    const now = Date.now();
    
    // Reset window if needed
    if (now - this.lastSentTime > this.RATE_WINDOW_MS) {
      this.sentBytesInWindow = 0;
    }
    
    // Check if we need to delay
    if (this.sentBytesInWindow + bytes > this.RATE_LIMIT_BYTES_PER_SECOND) {
      const delayMs = this.RATE_WINDOW_MS - (now - this.lastSentTime);
      if (delayMs > 0) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
        this.sentBytesInWindow = 0;
      }
    }
    
    // Update tracking
    this.sentBytesInWindow += bytes;
    this.lastSentTime = Date.now();
  }

  /**
   * Chunk text into safe sizes for Akool API
   */
  private chunkText(text: string, maxLength: number): string[] {
    const chunks: string[] = [];
    let remaining = text.trim();
    
    while (remaining.length > 0) {
      if (remaining.length <= maxLength) {
        chunks.push(remaining);
        break;
      }
      
      // Try to break at word boundaries
      let breakPoint = maxLength;
      const lastSpace = remaining.lastIndexOf(' ', maxLength);
      if (lastSpace > maxLength * 0.7) { // Don't break too early
        breakPoint = lastSpace;
      }
      
      chunks.push(remaining.slice(0, breakPoint).trim());
      remaining = remaining.slice(breakPoint).trim();
    }
    
    return chunks.filter(chunk => chunk.length > 0);
  }

  /**
   * Finalize any pending message in the buffer
   */
  private finalizePendingMessage(): void {
    if (this.sentenceBuffer.trim()) {
      // Send remaining buffer as final message
      this.sendChunkedMessage(this.sentenceBuffer, true);
      this.sentenceBuffer = '';
    }
  }

  /**
   * Complete cleanup for session end or error
   */
  finalize(): void {
    this.sentenceBuffer = '';
    this.queue = [];
    clearTimeout(this.completionTimer);
  }

  /**
   * Clear buffers on demand (for immediate cleanup)
   */
  clearBuffer(): void {
    this.sentenceBuffer = '';
    this.queue = [];
    clearTimeout(this.completionTimer);
    this.pendingChunks.clear();
  }

  /**
   * Complete cleanup on: response complete, session end, error
   */
  cleanup(): void {
    this.clearBuffer();
    this.lastDeltaTimestamp = 0;
    this.sentBytesInWindow = 0;
    this.lastSentTime = 0;
    this.sending = false;
  }

  /**
   * Get current queue status for debugging
   */
  getStatus() {
    return {
      queueLength: this.queue.length,
      bufferLength: this.sentenceBuffer.length,
      pendingChunks: this.pendingChunks.size,
      lastDeltaAge: this.lastDeltaTimestamp ? Date.now() - this.lastDeltaTimestamp : 0,
      isSending: this.sending
    };
  }
} 