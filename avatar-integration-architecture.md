# Avatar Integration Architecture

## Overview
Based on your codebase analysis and collaborative refinement, here's how to integrate Akool avatars while preserving your existing architecture. This document reflects the consensus approach that treats avatar as an enhancement, not a requirement.

## Core Principle
**"Avatar is an enhancement, not a requirement"** - The system should gracefully degrade without affecting core interview functionality.

## Key Architecture Decisions

### 1. **Audio Handling - Separate Elements**
```typescript
// Keep your GOLDEN STATE audio element for OpenAI
const openAIAudio = document.getElementById('openai-audio'); // Existing

// Add separate element for avatar audio
const avatarAudio = document.getElementById('avatar-audio'); // New

// Clear audio strategy based on avatar state
switch (avatarConnection.status) {
  case 'active':
    openAIAudio.muted = true;
    avatarAudio.muted = false;
    break;
  case 'error':
  case 'disconnected':
    openAIAudio.muted = false;
    avatarAudio.muted = true;
    break;
  case 'thinking':
    // Keep current state during thinking
    break;
  default:
    // During connecting/ready, keep OpenAI active
    openAIAudio.muted = false;
    avatarAudio.muted = true;
}
```

### 2. **Avatar as Feature, Not Architecture**
```sql
-- Modify interview_sessions table with safety checks
ALTER TABLE interview_sessions 
ADD COLUMN IF NOT EXISTS avatar_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS avatar_session_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS avatar_provider VARCHAR(50) DEFAULT 'akool';
```

### 3. **Performance Budget Enforcement**
Before enabling avatar, verify system resources:
- CPU usage < 40%
- Bandwidth > 2 Mbps
- Memory available > 150MB

### 4. **State Machine with Visual Feedback**
```typescript
export type AvatarState = 
  | 'idle'
  | 'connecting'
  | 'ready'
  | 'active'
  | 'thinking'     // Visual feedback state
  | 'degraded'
  | 'error'
  | 'disconnected';
```

## Integration Points

### In `useOpenAIConnection.ts` (after line 331):
```typescript
case 'response.audio_transcript.delta':
  if (event.text) {
    // Your existing code
    aiResponseTextRef.current += event.text;
    saveTranscript(aiResponseTextRef.current, 'ai');
    
    // NEW: Send to avatar if enabled
    if (avatarConnectionRef.current?.status === 'ready') {
      lastDeltaTimestampRef.current = Date.now();
      
      // Show thinking state on first delta
      if (aiResponseTextRef.current.length === event.text.length) {
        avatarConnectionRef.current.setStatus('thinking');
      }
      
      // Send to avatar message queue
      avatarConnectionRef.current.messageQueue.add({
        text: aiResponseTextRef.current,
        isPartial: true,
        timestamp: Date.now()
      });
      
      // Detect completion with 500ms timeout
      avatarConnectionRef.current.messageQueue.detectCompletion(() => {
        avatarConnectionRef.current.sendToAvatar(
          aiResponseTextRef.current,
          true // isFinal
        );
        avatarConnectionRef.current.setStatus('active');
      });
    }
  }
  break;
```

## New Components to Build

### 1. **useAvatarConnection Hook with Simple Retry**
```typescript
// hooks/useAvatarConnection.ts
import { useState, useEffect, useRef, useCallback } from 'react';
import AgoraRTC, { IAgoraRTCClient } from 'agora-rtc-sdk-ng';
import { PerformanceMonitor } from '@/services/performanceMonitor';

interface UseAvatarConnectionProps {
  enabled: boolean;
  sessionId: string;
  avatarId?: string;
  onStatusChange?: (status: AvatarStatus) => void;
}

export function useAvatarConnection({
  enabled,
  sessionId,
  avatarId = 'dvp_Tristan_cloth2_1080P',
  onStatusChange
}: UseAvatarConnectionProps) {
  const [status, setStatus] = useState<AvatarState>('idle');
  const agoraClientRef = useRef<IAgoraRTCClient | null>(null);
  const messageQueueRef = useRef<AvatarMessageQueue>(new AvatarMessageQueue());
  
  // Simple retry logic (3 attempts with exponential backoff)
  const connectAvatar = useCallback(async (retries = 3): Promise<void> => {
    try {
      // Check performance budget first
      if (!PerformanceMonitor.canEnableAvatar()) {
        console.warn('[Avatar] Performance budget exceeded');
        throw new Error('Performance budget exceeded');
      }
      
      setStatus('connecting');
      
      // Call your Edge Function to create Akool session
      const response = await fetch('/api/avatar-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, avatarId })
      });
      
      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Avatar limit reached');
        }
        throw new Error('Failed to create avatar session');
      }
      
      const { credentials, version } = await response.json();
      console.log(`[Avatar] Using API version: ${version}`);
      
      // Initialize Agora client
      const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      await client.join(
        credentials.agora_app_id,
        credentials.agora_channel,
        credentials.agora_token,
        credentials.agora_uid
      );
      
      agoraClientRef.current = client;
      setStatus('ready');
      
      // Setup stream handlers
      setupAgoraHandlers(client);
      
    } catch (error) {
      console.error('Avatar init failed:', error);
      
      if (retries > 0 && error.message !== 'Avatar limit reached') {
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, 1000 * (4 - retries)));
        return connectAvatar(retries - 1);
      }
      
      setStatus('error');
      onStatusChange?.('error');
    }
  }, [sessionId, avatarId, onStatusChange]);
  
  // Initialize when enabled
  useEffect(() => {
    if (!enabled) return;
    
    connectAvatar();
    
    return () => {
      cleanup();
    };
  }, [enabled, connectAvatar]);
  
  // Message sending with chunking
  const sendToAvatar = async (text: string, isFinal: boolean = false) => {
    if (!agoraClientRef.current || status !== 'ready') return;
    
    // Use the message queue to handle chunking
    await messageQueueRef.current.sendMessage(
      agoraClientRef.current,
      text,
      isFinal
    );
  };
  
  const cleanup = () => {
    messageQueueRef.current.cleanup();
    if (agoraClientRef.current) {
      agoraClientRef.current.leave();
      agoraClientRef.current = null;
    }
    setStatus('disconnected');
  };
  
  return {
    status,
    setStatus,
    sendToAvatar,
    messageQueue: messageQueueRef.current,
    cleanup
  };
}
```

### 2. **Avatar Message Queue with Completion Detection**
```typescript
// services/avatarMessageQueue.ts
export class AvatarMessageQueue {
  private queue: QueuedMessage[] = [];
  private sending = false;
  private sentenceBuffer = '';
  private lastDeltaTimestamp = 0;
  private completionTimer?: NodeJS.Timeout;
  
  async sendMessage(client: RTCClient, text: string, isFinal: boolean) {
    // Detect sentence completion for natural breaking points
    this.sentenceBuffer = text;
    
    const sentences = this.detectCompleteSentences(text);
    if (sentences.length > 0 || isFinal) {
      for (const sentence of sentences) {
        await this.sendChunkedMessage(client, sentence);
      }
    }
  }
  
  // Add completion detection with 500ms timeout
  detectCompletion(callback: () => void) {
    clearTimeout(this.completionTimer);
    this.completionTimer = setTimeout(() => {
      if (this.sentenceBuffer) {
        callback();
        this.finalize();
      }
    }, 500);
  }
  
  private detectCompleteSentences(text: string): string[] {
    // Simple sentence detection - enhance as needed
    const sentenceEnders = /[.!?]+\s+/g;
    const sentences = text.split(sentenceEnders).filter(s => s.trim());
    
    // Keep the last incomplete sentence in buffer
    const lastChar = text[text.length - 1];
    if (!['.', '!', '?'].includes(lastChar)) {
      this.sentenceBuffer = sentences.pop() || '';
    }
    
    return sentences;
  }
  
  private async sendChunkedMessage(client: RTCClient, text: string) {
    const MAX_CHUNK_SIZE = 200; // Safe limit for JSON overhead
    const chunks = this.chunkText(text, MAX_CHUNK_SIZE);
    
    for (let i = 0; i < chunks.length; i++) {
      const message = {
        v: 2,
        type: 'chat',
        mid: `msg-${Date.now()}-${i}`,
        idx: i,
        fin: i === chunks.length - 1,
        pld: { text: chunks[i] }
      };
      
      const encoded = new TextEncoder().encode(JSON.stringify(message));
      await client.sendStreamMessage(encoded, false);
      
      // Rate limiting with minimum delay
      await this.rateLimitDelay(encoded.length);
    }
  }
  
  private rateLimitDelay(bytes: number): Promise<void> {
    // 6KB/s limit = 6 bytes/ms with 10ms minimum
    const delayMs = Math.max(10, Math.ceil(bytes / 6));
    return new Promise(resolve => setTimeout(resolve, delayMs));
  }
  
  private chunkText(text: string, maxLength: number): string[] {
    const chunks: string[] = [];
    let remaining = text;
    
    while (remaining.length > 0) {
      chunks.push(remaining.slice(0, maxLength));
      remaining = remaining.slice(maxLength);
    }
    
    return chunks;
  }
  
  // Memory cleanup - called on: response complete, session end, error
  cleanup() {
    this.sentenceBuffer = '';
    this.queue = [];
    clearTimeout(this.completionTimer);
    this.lastDeltaTimestamp = 0;
  }
}
```

### 3. **Edge Function with Version Tracking**
```typescript
// supabase/functions/avatar-session/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const AVATAR_API_VERSION = 'v1.0.0';

serve(async (req) => {
  try {
    const { sessionId, avatarId } = await req.json();
    
    // Verify session exists and user has access
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    
    const { data: session } = await supabase
      .from('interview_sessions')
      .select('*, tenant_id')
      .eq('id', sessionId)
      .single();
    
    if (!session) {
      return new Response('Session not found', { status: 404 });
    }
    
    // Check tenant limits
    await checkTenantAvatarLimit(session.tenant_id, supabase);
    
    // Create Akool session
    const akoolResponse = await fetch('https://openapi.akool.com/api/open/v4/liveAvatar/session/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('AKOOL_API_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        avatar_id: avatarId,
        duration: 600 // 10 minutes
      })
    });
    
    if (!akoolResponse.ok) {
      throw new Error(`Akool API error: ${akoolResponse.statusText}`);
    }
    
    const akoolData = await akoolResponse.json();
    
    // Update session with avatar info
    await supabase
      .from('interview_sessions')
      .update({
        avatar_enabled: true,
        avatar_session_id: akoolData.data._id,
        avatar_provider: 'akool'
      })
      .eq('id', sessionId);
    
    // Wait for session to be ready
    const credentials = await pollForReady(akoolData.data._id);
    
    return Response.json({ 
      credentials,
      version: AVATAR_API_VERSION,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: error.message,
      version: AVATAR_API_VERSION
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

async function checkTenantAvatarLimit(tenantId: string, supabase: any) {
  const { data: prefs } = await supabase
    .from('tenant_preferences')
    .select('avatar_monthly_limit, avatar_usage_count')
    .eq('tenant_id', tenantId)
    .single();
  
  if (!prefs) return; // No limits set
  
  if (prefs.avatar_usage_count >= prefs.avatar_monthly_limit) {
    throw new Error('Monthly avatar limit reached');
  }
  
  // Increment usage
  await supabase
    .from('tenant_preferences')
    .update({ avatar_usage_count: prefs.avatar_usage_count + 1 })
    .eq('tenant_id', tenantId);
}
```

## Database Schema Updates

```sql
-- Add avatar support to existing tables
ALTER TABLE interview_sessions 
ADD COLUMN IF NOT EXISTS avatar_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS avatar_session_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS avatar_provider VARCHAR(50) DEFAULT 'akool';

-- Create tenant preferences table with limits
CREATE TABLE IF NOT EXISTS tenant_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) UNIQUE,
  avatar_enabled_default BOOLEAN DEFAULT false,
  default_avatar_id VARCHAR(100) DEFAULT 'dvp_Tristan_cloth2_1080P',
  avatar_provider VARCHAR(50) DEFAULT 'akool',
  avatar_monthly_limit INTEGER DEFAULT 100,
  avatar_usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE tenant_preferences ENABLE ROW LEVEL SECURITY;

-- RLS policy
CREATE POLICY tenant_preferences_isolation ON tenant_preferences
  USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));

-- Add proper timing to transcripts
ALTER TABLE transcript_entries
ADD COLUMN IF NOT EXISTS actual_start_ms INTEGER,
ADD COLUMN IF NOT EXISTS duration_ms INTEGER;
```

## Performance Considerations

1. **Maintain 10fps throttling** for avatar video to match your audio optimization
2. **Separate audio elements** prevent interference with your GOLDEN STATE audio
3. **Message queuing** handles Akool's 1KB/6KB-per-second limits
4. **Sentence detection** provides natural breaking points for avatar speech
5. **Performance budget** enforced before enabling avatar (CPU < 40%, bandwidth > 2Mbps)
6. **"Thinking" state** masks latency with visual feedback

## Feature Flag Strategy

```typescript
export const FEATURE_FLAGS = {
  AVATAR: {
    enabled: process.env.VITE_AVATAR_ENABLED === 'true',
    rolloutPercentage: parseInt(process.env.VITE_AVATAR_ROLLOUT || '0'),
    betaTenants: (process.env.VITE_AVATAR_BETA_TENANTS || '').split(',')
  }
};

export function isAvatarEnabledForTenant(tenantId: string): boolean {
  if (!FEATURE_FLAGS.AVATAR.enabled) return false;
  if (FEATURE_FLAGS.AVATAR.betaTenants.includes(tenantId)) return true;
  
  // Simple percentage rollout
  const hash = tenantId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return (hash % 100) < FEATURE_FLAGS.AVATAR.rolloutPercentage;
}
```

## Monitoring & Alerting

```typescript
export class AvatarMonitoring {
  static trackEvent(event: string, data: any) {
    console.log(`[Avatar Analytics] ${event}`, data);
    
    if (window.analytics) {
      window.analytics.track(event, data);
    }
  }
  
  static trackError(error: Error, context: any) {
    console.error('[Avatar Error]', error, context);
    
    if (window.Sentry) {
      window.Sentry.captureException(error, { extra: context });
    }
  }
  
  static trackPerformance(metric: string, value: number) {
    performance.mark(`avatar-${metric}`);
    
    if (window.performance && window.performance.measure) {
      window.performance.measure(`avatar-${metric}-measure`);
    }
  }
}
```

## Rollback Strategy

### Immediate Rollback (< 5 minutes)
1. Set `VITE_AVATAR_ENABLED=false` in environment
2. Deploy frontend with disabled flag
3. All new sessions will be audio-only
4. Existing avatar sessions continue until completed

### Full Rollback (< 30 minutes)
1. Disable feature flag in all environments
2. Stop avatar edge function: `supabase functions delete avatar-session`
3. Update database: `UPDATE tenant_preferences SET avatar_enabled_default = false`
4. Deploy updated frontend without avatar code
5. Run cleanup script for orphaned Akool sessions
6. Monitor for any lingering issues

### Communication with Active Sessions
- Active avatar sessions will continue until natural completion
- Send notification to active users: "Avatar feature temporarily disabled"
- Sessions automatically fallback to audio-only on next connection

## Cost Estimation

Per interview with avatar:
- Akool session: ~$0.10-0.30
- Agora streaming: ~$0.05-0.10
- Additional bandwidth: ~$0.05
- **Total: ~$0.20-0.45 per interview**

## Success Metrics

- Avatar adoption rate (target: 30% of eligible interviews)
- User satisfaction scores (target: 4.5/5)
- Technical success rate (target: >95%)
- Average additional cost per interview (target: <$0.30)
- Performance impact (target: <10% increase in resource usage)

## Key Implementation Notes

1. **Avatar is an enhancement** - Always ensure graceful degradation
2. **Simple retry logic** - 3 attempts with exponential backoff, not complex reconnection
3. **Visual feedback** - "Thinking" state masks technical latency
4. **Resource cleanup** - Verify no memory leaks and all Agora resources released
5. **Server-side limits** - Enforce at edge function level, not frontend
6. **Clear audio strategy** - Mute OpenAI when avatar active, no echo