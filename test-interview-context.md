# Test Plan: Verify AI Interview Context

## Quick Test Steps

### 1. Start a New Interview
- Go to `/interview-test`
- Select:
  - **Company**: valuetainment
  - **Candidate**: Ben Pappas
  - **Position**: CTO
- Click "Start Interview"

### 2. Check Browser Console
Open browser console (F12) and look for:
```
Interview configuration received: {...}
```

The object should contain:
```javascript
{
  openai_api_config: {
    voice: "alloy",
    model: "gpt-4o",
    instructions: "You are an interviewer for valuetainment...",
    // Should include Ben Pappas' name and skills
    // Should include competency weights
  }
}
```

### 3. Check Edge Function Logs
After starting the interview, immediately run:
```bash
npx supabase functions logs interview-start --tail 20
```

Look for:
- `[DEBUG ...] Session data fetched:` - Should show candidate/position/company data
- `[DEBUG ...] Generated AI instructions:` - Should show the full instructions with context

### 4. Listen to AI's Introduction
The AI should:
- ✅ Mention "valuetainment" (not "our company")
- ✅ Address you as "Ben Pappas" (not "the candidate")
- ✅ Reference your skills (AI, Blockchain, etc.)
- ✅ Focus on Leadership (20%), Communication (20%), etc.

## Debugging If Context Is Missing

### Check 1: Data Channel Message
In browser console, add this before starting interview:
```javascript
// Override data channel to log messages
const originalCreateDataChannel = RTCPeerConnection.prototype.createDataChannel;
RTCPeerConnection.prototype.createDataChannel = function(...args) {
  const channel = originalCreateDataChannel.apply(this, args);
  const originalSend = channel.send;
  channel.send = function(data) {
    console.log('[DataChannel Send]:', data);
    return originalSend.apply(this, arguments);
  };
  return channel;
};
```

### Check 2: Verify Instructions Are Sent
The data channel should send a message like:
```json
{
  "type": "session.update",
  "session": {
    "instructions": "You are an interviewer for valuetainment...",
    "voice": "alloy",
    "input_audio_transcription": {
      "model": "whisper-1"
    }
  }
}
```

### Check 3: Network Tab
1. Open Network tab in browser DevTools
2. Filter by "interview-start"
3. Check the Response - it should contain `openai_api_config.instructions`

## Expected AI Behavior With Context

**Without Context (Old)**:
> "Hello! I'm here to conduct a technical interview with you today. Could you please introduce yourself?"

**With Context (New)**:
> "Hello Ben! I'm conducting this interview on behalf of valuetainment for the CTO position. I see you have extensive experience with AI, blockchain, and emerging technologies. Let's start by having you tell me about your leadership experience, as that's a key competency we're evaluating today."

## Common Issues

1. **AI still says "the candidate"**
   - Check if `full_name` is populated in database
   - Verify edge function is deployed

2. **No competency focus**
   - Check if position_competencies exist for CTO role
   - Verify weights are set (should be 20% each)

3. **No company name**
   - Check if company_id is set on interview_session
   - Verify company name is "valuetainment" (lowercase) 