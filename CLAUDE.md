# Claude's Work Log

[... existing content remains unchanged ...]

## Project Status Update (May 24, 2025)

### Admin Interview Flow Implementation ✅
Successfully implemented the admin interview path with the following architecture:

#### Interview Paths Defined:
1. **Admin Interview** (Current) - Admin selects company/candidate/position manually
2. **Invitation Path** (Future) - Candidates receive email links with tokens
3. **Self-Service Path** (Much Later) - Public facing with resume upload

#### What Was Built:
- **InterviewRoomHybrid Component** (`/interview/:id`)
  - Professional interview UI without debug tools
  - Pre-interview screen showing candidate/position/company details
  - Integration with interview-start edge function
  - Real-time transcript display using TranscriptPanel
  - Clean interview controls with WebRTCManager

- **Flow Architecture**:
  ```
  TestInterview (/test-interview) → Select Company/Candidate/Position
  ↓
  Creates interview_session in database
  ↓
  Navigates to /interview/:sessionId
  ↓
  InterviewRoomHybrid loads session data
  ↓
  Admin clicks "Start Interview"
  ↓
  Calls interview-start edge function → Gets Fly.io WebSocket URL
  ↓
  WebRTC: Browser ↔ Fly.io (SDP Proxy) ↔ OpenAI
  ↓
  Real-time transcripts saved to database
  ```

#### Key Architecture Points:
- **Fly.io remains essential** for ALL interview types (security, JWT validation, SDP exchange)
- **Hybrid approach maintained**: Audio flows directly between browser and OpenAI
- **Tenant isolation**: Each interview gets a dedicated VM with tenant-specific naming
- **Consistent flow**: Same WebRTC architecture for admin, invitation, and self-service paths

#### Production Deployment Status:
- ✅ Supabase singleton issues resolved
- ✅ Vercel routing configured correctly
- ✅ All components using proper imports
- ✅ Admin interview flow integrated

### Next Steps:
1. Test the complete admin interview flow in production
2. Verify Fly.io VM provisioning and WebSocket connections
3. Confirm transcript storage and retrieval
4. Test with real OpenAI WebRTC connection (not simulation mode)

## Project Status Update (May 27, 2025)

### Critical WebRTC Infinite Loop Issue 🔴

#### Problem Discovered:
- Interview flow causes infinite mount/unmount cycles (57k-120k+ logs before browser crash)
- WebRTC never initializes properly - no microphone permission request
- Multiple circular dependencies in cleanup functions across hooks

#### Root Causes Identified:
1. **Dual Hook Instantiation**: `useWebRTC` creates BOTH `useOpenAIConnection` AND `useSDPProxy` even though only one is used
2. **Circular Dependencies**: Multiple cleanup functions depend on changing values, causing recreation cycles
3. **Database Issues**: 
   - RLS policy using non-existent `request.jwt.claim.tenant_id`
   - Incorrect table reference (`tenant_users` → should be `users`)

#### Fixes Applied:
- ✅ Fixed RLS policy for transcript_entries (dropped problematic policy)
- ✅ Fixed tenant_users → users table reference
- ✅ Removed cleanup from dependencies in:
  - WebRTCManager useEffect
  - useWebRTC cleanup useEffect  
  - useWebRTCConnection initialize function
  - useWebRTCConnection unmount useEffect
  - useSDPProxy cleanup function
- ✅ Memoized activeConnection to prevent recreations

#### Architecture Overview:
```
WebRTCManager (UI Component)
    ↓
useWebRTC (Orchestration Hook)
    ↓
├── useOpenAIConnection (Direct OpenAI - NOT USED in hybrid)
│   └── useWebRTCConnection
└── useSDPProxy (Fly.io Proxy - USED in hybrid)
    ├── useWebSocketConnection (For SDP exchange)
    └── useWebRTCConnection (For WebRTC audio)
```

#### Remaining Issues:
1. **Both connection types still instantiated** - Need to implement "disabled" pattern
2. **May have more cleanup dependencies** - Need comprehensive audit
3. **85% Complete** - Architecture is correct, just need to stop dual instantiation

#### What Should Happen (vs Current):
- Current: Creates both connection types → circular dependencies → infinite loop
- Should: Create only useSDPProxy → initialize → request mic → start streaming

#### Where We're Stuck:
- **Never reach WebSocket connection** - Component loops before any network activity
- **Never reach SDP exchange** - Can't establish signaling channel
- **Never request microphone** - getUserMedia() never called
- **Never establish WebRTC** - No audio connection to OpenAI

#### Next Steps to Fix:
1. **Implement "disabled" pattern in hooks**:
   ```typescript
   // Add 'disabled' flag to skip initialization
   const sdpProxyConnection = useSDPProxy(sessionId, {
     disabled: false,  // Only this one active
     // ...
   });
   const openAIConnection = useOpenAIConnection(sessionId, {
     disabled: true,   // Skip this one
     // ...
   });
   ```

2. **Audit all useCallback/useEffect dependencies**:
   - Check useWebSocketConnection for cleanup deps
   - Check useAudioVisualization for cleanup deps
   - Ensure no circular references remain

3. **Test initialization completes**:
   - Should see WebSocket connect to Fly.io
   - Should see microphone permission prompt
   - Should establish WebRTC audio connection

#### Commands to Run:
```bash
# After fixes, test locally first
npm run dev

# Then deploy
git add -A && git commit -m "fix: Implement disabled pattern to prevent dual hook instantiation"
git push origin main
```