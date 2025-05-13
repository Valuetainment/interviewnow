import { useState, useRef, useCallback } from 'react';

export interface RetryConfig {
  initialDelay: number;
  maxDelay: number;
  backoffFactor: number;
  maxRetries: number;
}

export interface RetryHandlers {
  retryCount: number;
  scheduleRetry: (callback: () => void) => void;
  resetRetryCount: () => void;
  hasExceededMaxRetries: boolean;
  autoReconnectDisabled: boolean;
  setAutoReconnectDisabled: (disabled: boolean) => void;
}

const DEFAULT_CONFIG: RetryConfig = {
  initialDelay: 3000, // 3 seconds
  maxDelay: 10000,    // 10 seconds
  backoffFactor: 2.0, // Double each time
  maxRetries: 3       // Max 3 retries
};

/**
 * Hook for managing retry logic with exponential backoff
 */
export function useRetry(config: Partial<RetryConfig> = {}): RetryHandlers {
  // Merge provided config with defaults
  const retryConfig: RetryConfig = {
    ...DEFAULT_CONFIG,
    ...config
  };
  
  const [retryCount, setRetryCount] = useState<number>(0);
  const [autoReconnectDisabled, setAutoReconnectDisabled] = useState<boolean>(false);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Calculate if max retries has been exceeded
  const hasExceededMaxRetries = retryCount >= retryConfig.maxRetries;

  // Clear any existing retry timeout
  const clearRetryTimeout = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, []);

  // Reset retry count
  const resetRetryCount = useCallback(() => {
    setRetryCount(0);
    clearRetryTimeout();
  }, [clearRetryTimeout]);

  // Schedule a retry with exponential backoff
  const scheduleRetry = useCallback((callback: () => void) => {
    // Don't retry if auto-reconnect is disabled
    if (autoReconnectDisabled) {
      console.log('Auto-reconnect disabled - not scheduling retry');
      return;
    }

    // Check if we've already reached or exceeded the maximum number of retries
    const nextRetryCount = retryCount + 1;
    
    if (nextRetryCount > retryConfig.maxRetries) {
      console.error(`Reached maximum retry attempts (${retryConfig.maxRetries}). Giving up.`);
      return;
    }

    // Calculate delay with exponential backoff
    const delay = Math.min(
      retryConfig.initialDelay * Math.pow(retryConfig.backoffFactor, retryCount),
      retryConfig.maxDelay
    );

    console.log(`Scheduling retry in ${delay}ms (attempt ${nextRetryCount}/${retryConfig.maxRetries})`);

    // Clear any existing timeout
    clearRetryTimeout();

    // Schedule retry
    retryTimeoutRef.current = setTimeout(() => {
      setRetryCount(nextRetryCount);
      callback();
    }, delay);
  }, [
    retryCount, 
    retryConfig.initialDelay, 
    retryConfig.backoffFactor, 
    retryConfig.maxDelay, 
    retryConfig.maxRetries,
    autoReconnectDisabled,
    clearRetryTimeout
  ]);

  return {
    retryCount,
    scheduleRetry,
    resetRetryCount,
    hasExceededMaxRetries,
    autoReconnectDisabled,
    setAutoReconnectDisabled
  };
}