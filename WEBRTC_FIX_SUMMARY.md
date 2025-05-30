# WebRTC Fix Summary - Quick Reference

## The Problem
- Current Fly.io server tries to use OpenAI's WebSocket API (`wss://api.openai.com/v1/realtime`)
- But the architecture requires WebRTC with SDP exchange
- OpenAI's WebRTC uses HTTP POST for SDP, not WebSocket

## The Solution
1. **Keep Fly.io** as SDP proxy for security (hides API keys)
2. **Fix SDP exchange** to use OpenAI's HTTP endpoints
3. **Maintain WebSocket** between Browser ↔ Fly.io
4. **Audio flows directly** Browser ↔ OpenAI (low latency)

## Quick Fix Steps

### 1. Add Ephemeral Key Generation (Fly.io)
```javascript
// New endpoint in fly-interview-hybrid/index.js
app.post('/api/generate-ephemeral-key', async (req, res) => {
  // Call OpenAI's /v1/realtime/sessions
  // Return ephemeral key to browser
});
```

### 2. Fix SDP Exchange (Fly.io)
```javascript
// Replace current sdp_offer handling
case 'sdp_offer':
  // Use HTTP POST to OpenAI with Content-Type: application/sdp
  const response = await fetch('https://api.openai.com/v1/realtime?model=...', {
    headers: { 'Content-Type': 'application/sdp' },
    body: offer.sdp // Just the SDP string!
  });
```

### 3. Update Frontend Hook
```typescript
// Add ephemeral key generation before SDP offer
await generateEphemeralKey();
// Create data channel named 'oai-events'
const dc = peerConnection.createDataChannel('oai-events');
```

## File Changes Required

1. **fly-interview-hybrid/index.js**
   - Add ephemeral key endpoint
   - Fix SDP exchange to use HTTP
   - Remove WebSocket to OpenAI

2. **src/hooks/webrtc/useSDPProxy.ts**
   - Add ephemeral key generation
   - Fix data channel name
   - Handle OpenAI event types

3. **No changes needed**:
   - Edge functions (already correct)
   - InterviewRoomHybrid (already fixed)
   - Architecture remains the same

## Testing Checklist
- [ ] Deploy Fly.io changes
- [ ] Test ephemeral key generation
- [ ] Verify SDP exchange works
- [ ] Check audio connection establishes
- [ ] Confirm transcripts are received

## Commands
```bash
# Deploy Fly.io
cd fly-interview-hybrid
fly deploy --app interview-hybrid-template

# Deploy frontend
git add -A && git commit -m "fix: Implement OpenAI WebRTC SDP exchange"
git push origin main

# Monitor logs
fly logs --app interview-hybrid-template
```

## Success Metrics
- WebSocket stays connected > 1 minute ✓
- SDP exchange completes without errors ✓
- Audio permission prompt appears ✓
- Transcripts appear in UI ✓

---
**Status**: Ready to implement
**Estimated Time**: 2-3 hours
**Risk**: Low (can rollback to mock SDP if needed)