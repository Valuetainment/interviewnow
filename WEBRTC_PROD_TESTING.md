# WebRTC Testing Guide for Production

**Production URL:** [https://interviewnow-fawn.vercel.app/](https://interviewnow-fawn.vercel.app/)

## Accessing WebRTC Test Pages

### Hooks Implementation Test

URL: [https://interviewnow-fawn.vercel.app/interview-test-simple](https://interviewnow-fawn.vercel.app/interview-test-simple)

This page uses our new hooks-based architecture with enhanced debugging features:
- Look for the "Hooks Version" badge in the header
- Debug tools and session recording functionality
- Improved connection state visualization

### Alternative Test Pages

If the main test page doesn't work, try these alternatives:
- [https://interviewnow-fawn.vercel.app/test-interview](https://interviewnow-fawn.vercel.app/test-interview)
- [https://interviewnow-fawn.vercel.app/interview-room/test-123](https://interviewnow-fawn.vercel.app/interview-room/test-123)

For comparison with the previous implementation.

## Testing Process

1. **Choose Test Mode**
   - **Simulation Mode:** No real WebRTC connection, simulated responses
   - **OpenAI Direct Mode:** Direct connection to OpenAI's Realtime API (requires API key)

2. **Configure Connection**
   - Simulation Mode: Set server URL (`wss://interview-sdp-proxy.fly.dev/ws`) - CONFIRMED RUNNING
   - OpenAI Mode: Enter API key, configure job description and voice settings

3. **Initiate Connection**
   - Watch connection status indicator (will change from red to yellow to green)
   - Monitor debug panel if enabled

4. **Testing Features**
   - **Show Debug Info:** Displays connection timeline and session logs
   - **Start/Stop Recording:** Records session data for debugging
   - **Save Session:** Exports session data as JSON

## Troubleshooting

### Connection Issues
- Check if status transitions to "Connected" (green)
- Verify server URL for simulation mode
- Ensure valid API key for OpenAI mode
- Check browser console for errors (F12 → Console)

### Audio Problems
- Grant microphone permissions when prompted
- Check if audio level visualization responds to voice
- Ensure system audio is not muted for AI responses

### Server Availability
- SDP Proxy server may need to be restarted if simulation fails
- Check status: `fly status -a interview-sdp-proxy`
- Restart if needed: `fly machine start <machine-id> -a interview-sdp-proxy`
- Current machine ID: `4d89791b262048`

## Test Scenarios

1. **Basic Connection**
   - Verify connection establishes successfully
   - Check connection status indicators change appropriately

2. **Audio Transmission**
   - Speak into microphone and check audio level visualization
   - Verify transcript appears in the right panel

3. **Error Recovery**
   - Test connection recovery after temporary disconnection
   - Observe reconnection attempts in debug panel

4. **Session Recording**
   - Start recording before test session
   - Save session data after testing
   - Review JSON export for debugging information

## Expected Behavior

- Connection status should transition to "Connected" within 5-10 seconds
- Audio level visualization should respond to voice input
- Transcript should appear in the right panel for both user and AI speech
- Debug panel should show detailed timeline of connection states
- No error messages should appear in browser console

## Known Limitations

- Simulation mode provides mock responses, not real AI interaction
- OpenAI mode requires a valid API key with access to the Realtime API
- Initial connection may take longer in production environment
- Browser security restrictions may affect WebRTC in some environments

## Hooks-Based Architecture Benefits

The new hooks implementation offers several advantages:

1. **Modular Design**
   - Specialized hooks for different WebRTC concerns
   - Clear separation of responsibilities
   - Easier to maintain and extend

2. **Improved Error Handling**
   - Better recovery from connection failures
   - More detailed error reporting
   - Exponential backoff for reconnection attempts

3. **Enhanced Debugging**
   - Comprehensive session logs
   - Connection state timeline
   - Detailed configuration information

4. **Testing Improvements**
   - Session recording for QA
   - Easy export of diagnostic data
   - Visual indicators for connection health