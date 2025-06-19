# AI Interview Insights Platform - Working Notes

## Current State (June 2025)
- **WebRTC Implementation**: Direct OpenAI connection using ephemeral tokens
- **Model**: `gpt-4o-realtime-preview-2025-06-03` 
- **Voice**: `verse` (updated from `alloy`)
- **Architecture**: Simplified direct P2P connection, no proxy needed
- **Security**: API keys stay in Supabase edge functions, never exposed to browser

## Essential Commands

### Development
```bash
npm run dev                    # Start development server
npm run test                   # Run tests
npm run build                  # Build for production
```

### Deployments
```bash
# Deploy Supabase Edge Functions
supabase functions deploy openai-realtime-token    # NEW: Ephemeral token generation
supabase functions deploy interview-start
supabase functions deploy interview-prepper
supabase functions deploy interview-transcript
supabase functions deploy interview-transcript-batch
```

### Local Testing
```bash
# Start development server
npm run dev

# Test interview at http://localhost:8080/test-interview
```

## Key URLs
- **Supabase Dashboard**: https://supabase.com/dashboard/project/gypnutyegqxelvsqjedu
- **Local Dev**: http://localhost:8080
- **Test Interview**: http://localhost:8080/test-interview

## Recent Updates

### June 18, 2025
- **MAJOR ARCHITECTURE CHANGE**: Replaced Fly.io proxy with Supabase edge functions
- Created `openai-realtime-token` edge function for ephemeral token generation
- Simplified to direct P2P connection with OpenAI (no proxy needed)
- Fixed circular dependency causing browser freeze
- ALWAYS use ephemeral tokens - never expose API keys to browser
- Fixed AI transcript capture issue

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
   - ✅ DONE: Migrated to Supabase edge functions (no more Fly.io)
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
- `useWebRTC` - Main orchestrator (simplified, always uses direct connection)
- `useOpenAIConnection` - Direct OpenAI WebRTC (ALWAYS uses ephemeral tokens)
- `useTranscriptManager` - Transcript handling with batching
- `useConnectionState` - State management

### Key Edge Functions
- `openai-realtime-token` - Generates ephemeral tokens for OpenAI (NEW)
- `interview-start` - Initializes interview sessions
- `interview-prepper` - Pre-analyzes candidates
- `interview-transcript` - Saves real-time transcripts
- `interview-transcript-batch` - Optimized batch saving

## Debugging Tips
- Check browser console for WebRTC connection states
- Monitor Supabase function logs for edge function errors
- Use `/test-interview` route for testing interviews
- Check for circular dependencies in React hooks
- Ensure OPENAI_API_KEY is set in Supabase environment
- AI transcripts now use accumulation pattern (not saved on every delta)