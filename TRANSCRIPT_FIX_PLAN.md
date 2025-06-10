# Transcript Edge Function Fix Plan

## Overview
The `interview-transcript` edge function is returning 500 errors in production. This plan outlines steps to diagnose and fix the issue.

## Phase 1: Immediate Diagnostics (5 minutes)

### 1. Check Edge Function Status
```bash
# Check if the function is deployed
npx supabase functions list

# If not listed or not ACTIVE, deploy it
npx supabase functions deploy interview-transcript
```

### 2. Verify Environment Variables
```bash
# List all secrets
npx supabase secrets list

# If SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY are missing, set them:
npx supabase secrets set SUPABASE_URL=https://xvjbqwlcvqxdnrxhwpkm.supabase.co
npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

### 3. Test the Function Directly
```bash
# Get your anon key from Supabase dashboard
ANON_KEY="your-anon-key"

# Test with a simple payload
curl -X POST https://xvjbqwlcvqxdnrxhwpkm.supabase.co/functions/v1/interview-transcript \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "interview_session_id": "test-session-123",
    "text": "Test transcript entry",
    "speaker": "candidate"
  }'
```

## Phase 2: Deploy Updated Function (10 minutes)

### 1. The function has been updated with:
- Better error logging
- Proper environment variable checking
- Relaxed session status checking (allows 'scheduled' status too)
- More detailed console logs for debugging

### 2. Deploy the Updated Function
```bash
# Deploy the updated function
npx supabase functions deploy interview-transcript

# Monitor the deployment
npx supabase functions list
```

### 3. Test with Real Interview Session
```bash
# First, get a real interview session ID from your database
# Then test with that ID
curl -X POST https://xvjbqwlcvqxdnrxhwpkm.supabase.co/functions/v1/interview-transcript \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "interview_session_id": "REAL-SESSION-ID-HERE",
    "text": "This is a test transcript",
    "speaker": "candidate",
    "source": "hybrid"
  }'
```

## Phase 3: Fix Frontend Integration (5 minutes)

### 1. Update the useTranscriptManager hook to handle errors better:

```typescript
// In src/hooks/webrtc/useTranscriptManager.ts
const saveTranscript = useCallback(async (
  text: string,
  speaker: 'candidate' | 'ai' | 'unknown' = 'unknown'
) => {
  if (!text.trim() || !sessionId) return;

  try {
    // Create transcript entry in local state
    addTranscriptEntry({ text, speaker });

    // Call transcript Edge Function to save the entry
    const { data, error } = await supabase.functions.invoke('interview-transcript', {
      body: {
        interview_session_id: sessionId,
        text,
        speaker,
        timestamp: new Date().toISOString(),
        source: 'hybrid'
      }
    });

    if (error) {
      console.error('Edge function error:', error);
      // Don't throw - we don't want to break the interview
    } else if (data && !data.success) {
      console.error('Transcript save failed:', data.error);
    }
  } catch (error) {
    console.error('Error saving transcript:', error);
    // Continue without throwing
  }
}, [sessionId, supabase, addTranscriptEntry]);
```

## Phase 4: Production Testing (10 minutes)

### 1. Start a Test Interview
1. Go to your production app
2. Navigate to the Test Interview page
3. Start an interview session
4. Speak a few sentences
5. Check the browser console for any errors

### 2. Monitor Edge Function Logs
```bash
# If you have access to logs
npx supabase functions logs interview-transcript --tail
```

### 3. Check Database
```sql
-- Check if transcript entries are being created
SELECT * FROM transcript_entries 
WHERE created_at > NOW() - INTERVAL '10 minutes'
ORDER BY created_at DESC
LIMIT 10;

-- Check interview sessions status
SELECT id, status, created_at 
FROM interview_sessions 
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
```

## Phase 5: Alternative Solutions (if needed)

### Option 1: Direct Database Insert (Bypass Edge Function)
If the edge function continues to fail, temporarily use direct database inserts:

```typescript
// In useTranscriptManager.ts
const saveTranscript = useCallback(async (
  text: string,
  speaker: 'candidate' | 'ai' | 'unknown' = 'unknown'
) => {
  if (!text.trim() || !sessionId) return;

  try {
    addTranscriptEntry({ text, speaker });

    // Direct database insert instead of edge function
    const { error } = await supabase
      .from('transcript_entries')
      .insert({
        session_id: sessionId,
        text,
        speaker,
        timestamp: new Date().toISOString(),
        start_ms: 0,
        tenant_id: getCurrentTenantId() // You'll need to implement this
      });

    if (error) {
      console.error('Database error:', error);
    }
  } catch (error) {
    console.error('Error saving transcript:', error);
  }
}, [sessionId, supabase, addTranscriptEntry]);
```

### Option 2: Batch Processing
Store transcripts locally and batch save them:

```typescript
const transcriptBuffer = useRef<TranscriptEntry[]>([]);

// Add to buffer
transcriptBuffer.current.push({ text, speaker, timestamp });

// Batch save every 30 seconds
useInterval(() => {
  if (transcriptBuffer.current.length > 0) {
    saveTranscriptBatch(transcriptBuffer.current);
    transcriptBuffer.current = [];
  }
}, 30000);
```

## Success Criteria
- [ ] Edge function responds with 200 status
- [ ] Transcripts appear in the database
- [ ] No errors in browser console during interviews
- [ ] TranscriptPanel shows real-time updates
- [ ] Interview sessions can be completed without interruption

## Rollback Plan
If the fixes don't work:
1. Disable transcript saving temporarily
2. Store transcripts in local storage
3. Export transcripts at the end of the interview
4. Fix the edge function offline and redeploy

## Next Steps After Fix
1. Add monitoring/alerting for edge function failures
2. Implement retry logic with exponential backoff
3. Add transcript validation before saving
4. Consider implementing a transcript queue for reliability 