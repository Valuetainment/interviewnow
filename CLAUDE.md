# AI Interview Insights Platform - Working Notes

## Current State (June 2025)
- **WebRTC Implementation**: Hybrid architecture using Fly.io as SDP proxy for OpenAI Realtime API
- **Model**: `gpt-4o-realtime-preview-2025-06-03` 
- **Voice**: `verse` (updated from `alloy`)
- **Architecture**: Hooks-based WebRTC implementation with modular design

## Essential Commands

### Development
```bash
npm run dev                    # Start development server
npm run test                   # Run tests
npm run build                  # Build for production
```

### Deployments
```bash
# Deploy Fly.io SDP Proxy
cd fly-interview-hybrid && fly deploy

# Deploy Supabase Edge Functions
supabase functions deploy interview-start
supabase functions deploy interview-prepper
supabase functions deploy interview-transcript
supabase functions deploy interview-transcript-batch
```

### Local Testing
```bash
# Start local simulation server
cd fly-interview-hybrid && node simple-server.js

# Start ngrok tunnel (for WebRTC testing)
ngrok http 3001
```

## Key URLs
- **Production SDP Proxy**: wss://interview-sdp-proxy.fly.dev/ws
- **Supabase Dashboard**: https://supabase.com/dashboard/project/gypnutyegqxelvsqjedu
- **Local Dev**: http://localhost:8080

## Recent Updates

### June 16, 2025
- Updated OpenAI Realtime API model to `gpt-4o-realtime-preview-2025-06-03`
- Changed default voice from `alloy` to `verse`
- Deployed updates to production

### June 13, 2025
- Implemented personalized AI interviews with candidate context
- Created `interview-prepper` edge function for pre-interview analysis
- AI now greets candidates by name and asks targeted questions

### June 12, 2025
- Fixed production routing issues with SPA
- Resolved sidebar provider errors

## Next Priorities

### High Priority
1. **Post-Interview Processing**
   - Aggregate transcripts into final report
   - Generate competency scores
   - Create candidate assessment dashboard

2. **Infrastructure Optimization**
   - Consider migrating SDP proxy to Supabase edge functions
   - Implement proper WebRTC session cleanup
   - Add connection quality monitoring

3. **Production Readiness**
   - Add comprehensive error tracking (Sentry)
   - Implement rate limiting
   - Add session recording capabilities

### Medium Priority
- Multi-language support for interviews
- ATS integration (Greenhouse, Lever)
- Interview scheduling improvements
- Batch interview processing

### Low Priority
- Video interview support
- Custom AI voice training
- Advanced analytics dashboard

## Architecture Notes

### WebRTC Hooks Structure
- `useWebRTC` - Main orchestrator
- `useOpenAIConnection` - Direct OpenAI WebRTC
- `useSDPProxy` - Fly.io proxy connection
- `useTranscriptManager` - Transcript handling
- `useConnectionState` - State management

### Key Edge Functions
- `interview-start` - Initializes interview sessions
- `interview-prepper` - Pre-analyzes candidates
- `interview-transcript` - Saves real-time transcripts
- `interview-transcript-batch` - Optimized batch saving

## Debugging Tips
- Check browser console for WebRTC connection states
- Monitor Supabase function logs for edge function errors
- Use `/test/webrtc-hooks` route for WebRTC testing
- Check Fly.io logs: `fly logs -a interview-sdp-proxy`