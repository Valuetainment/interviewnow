# WebRTC Debug Log - June 2, 2025

## Current Issue: "Ghost Connection" Problem

### Summary
- ✅ WebSocket shows `WS_CONNECTED` status
- ❌ **Zero activity in Fly.io logs** (no HTTP requests, no WebSocket messages)
- ❌ Ephemeral key generation never triggers
- ❌ No SDP exchange occurs

### Test Environment
- **Frontend URL**: https://interviewnow-fawn.vercel.app/interview/8ac26b4b-e4c8-4697-8ec8-968b59930366
- **Fly.io App**: interview-hybrid-template.fly.dev
- **Architecture**: Hybrid (Browser ↔ Fly.io ↔ OpenAI)

### Debug Theory: WebSocket Message Flow Issue

#### Expected Message Flow:
1. **Frontend connects** → WebSocket to Fly.io
2. **Fly.io sends** → `{"type": "session", "sessionId": "uuid"}`
3. **Frontend receives** → Session message, stores sessionId
4. **Frontend triggers** → Ephemeral key generation
5. **Frontend sends** → HTTP POST to `/api/generate-ephemeral-key`
6. **Fly.io logs** → Should show HTTP request

#### Actual Behavior:
1. ✅ Frontend connects to WebSocket 
2. ❓ Unknown if session message is sent/received
3. ❌ Ephemeral key generation never triggers
4. ❌ No HTTP requests to Fly.io
5. ❌ No logs in Fly.io at all

### Debugging Steps to Try:

#### Step 1: Verify WebSocket Message Exchange
```typescript
// Add to WebSocket message handler
console.log('Raw WebSocket message received:', message);
```

#### Step 2: Check Session Message Format
Expected from server:
```json
{"type": "session", "sessionId": "uuid-here", "headers": {...}}
```

#### Step 3: Verify Connection State Tracking
```typescript
// Check if isWsConnected is actually true when we think it is
console.log('WebSocket state:', {
  readyState: wsRef.current?.readyState,
  isWsConnected,
  url: wsRef.current?.url
});
```

#### Step 4: Test with Simulation Mode
```typescript
// Force simulation mode to bypass OpenAI dependency
simulationMode: true
```

### Investigation Questions:
1. **Is the WebSocket actually connected to the right URL?**
2. **Is Fly.io sending session messages?**
3. **Is the frontend receiving and parsing messages correctly?**
4. **Are there any WebSocket errors being silenced?**
5. **Is the session message handler actually being called?**

### Next Actions:
1. Add comprehensive WebSocket message logging
2. Verify Fly.io server is sending session messages
3. Check WebSocket URL and connection details
4. Test with simulation mode to isolate issue
5. Add visible debugging to UI (not just console)

### Architecture Status:
- 🟢 **Edge Function**: Working (returns WebSocket URLs)
- 🟢 **WebSocket Connection**: Appears connected
- 🔴 **Message Processing**: Not working (no logs)
- 🔴 **HTTP Requests**: Not happening
- 🔴 **SDP Exchange**: Not starting

### Commit History:
- `7e7209c` - Moved ephemeral key to session handler
- `0b152ce` - Added visible toast debugging
- `fb3cc04` - Fixed infinite loops in useEffect
- `076c8bd` - Removed unsupported message types

---
**Status**: Actively debugging WebSocket message flow
**Next Session**: Focus on WebSocket message visibility and session handler verification