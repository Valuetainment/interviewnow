#!/usr/bin/env node

/**
 * WebRTC SDP Proxy Test Utility
 * 
 * This script tests the SDP proxy functionality by:
 * 1. Connecting to the WebSocket server
 * 2. Sending a mock SDP offer
 * 3. Verifying the SDP answer received
 * 4. Sending mock ICE candidates
 */

const WebSocket = require('ws');
const readline = require('readline');

// Configuration
const SERVER_URL = process.env.SERVER_URL || 'ws://localhost:3000';
const DEFAULT_TEST_TIMEOUT = 10000; // 10 seconds

// Create readline interface for user interaction
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Basic mock SDP offer (simplified for testing)
const mockSdpOffer = {
  type: 'offer',
  sdp: `v=0
o=- 12345678 1 IN IP4 127.0.0.1
s=-
t=0 0
a=group:BUNDLE 0 1
a=msid-semantic: WMS
m=audio 9 UDP/TLS/RTP/SAVPF 111
c=IN IP4 0.0.0.0
a=rtcp:9 IN IP4 0.0.0.0
a=ice-ufrag:test
a=ice-pwd:testpassword
a=fingerprint:sha-256 00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF
a=setup:actpass
a=mid:0
a=sendrecv
a=rtcp-mux
a=rtpmap:111 opus/48000/2
a=fmtp:111 minptime=10;useinbandfec=1
m=video 9 UDP/TLS/RTP/SAVPF 96
c=IN IP4 0.0.0.0
a=rtcp:9 IN IP4 0.0.0.0
a=ice-ufrag:test
a=ice-pwd:testpassword
a=fingerprint:sha-256 00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF
a=setup:actpass
a=mid:1
a=sendrecv
a=rtcp-mux
a=rtpmap:96 VP8/90000
a=rtcp-fb:96 nack
a=rtcp-fb:96 nack pli`
};

// Mock ICE candidate
const mockIceCandidate = {
  candidate: 'candidate:1 1 UDP 2122252543 192.168.1.100 56789 typ host',
  sdpMid: '0',
  sdpMLineIndex: 0
};

// Start test
console.log(`\n🔧 WebRTC SDP Proxy Test Utility`);
console.log(`Connecting to ${SERVER_URL}...\n`);

// Initialize test state
let sessionId = null;
let testsPassed = 0;
let testsFailed = 0;
let testTimeout = null;

// Connect to WebSocket
const ws = new WebSocket(SERVER_URL);

// Set test timeout
testTimeout = setTimeout(() => {
  console.error('❌ Test timed out after', DEFAULT_TEST_TIMEOUT/1000, 'seconds');
  cleanup(1);
}, DEFAULT_TEST_TIMEOUT);

// WebSocket event handlers
ws.on('open', () => {
  console.log('✅ Connected to server');
  testsPassed++;
});

ws.on('message', (data) => {
  try {
    const message = JSON.parse(data.toString());
    console.log(`📩 Received: ${message.type}`);
    
    if (message.type === 'session') {
      sessionId = message.sessionId;
      console.log(`✅ Received session ID: ${sessionId}`);
      testsPassed++;
      
      // Send SDP offer
      console.log('📤 Sending SDP offer...');
      ws.send(JSON.stringify({
        type: 'sdpOffer',
        sdp: mockSdpOffer.sdp
      }));
    }
    else if (message.type === 'sdpAnswer') {
      console.log('✅ Received SDP answer');
      testsPassed++;
      
      // Verify SDP answer has required properties
      const sdp = message.sdp.sdp;
      if (!sdp) {
        console.error('❌ SDP answer missing sdp property');
        testsFailed++;
      } else {
        // Basic SDP answer validation
        const lines = sdp.split('\n');
        const hasMLines = lines.some(l => l.startsWith('m=audio')) && 
                          lines.some(l => l.startsWith('m=video'));
        
        if (hasMLines) {
          console.log('✅ SDP answer contains expected media lines');
          testsPassed++;
        } else {
          console.error('❌ SDP answer missing expected media lines');
          testsFailed++;
        }
      }
      
      // Send ICE candidate
      console.log('📤 Sending ICE candidate...');
      ws.send(JSON.stringify({
        type: 'iceCandidate',
        candidate: mockIceCandidate
      }));
      
      // End test after a brief delay
      setTimeout(() => {
        console.log('\n🔍 Test Summary:');
        console.log(`Passed: ${testsPassed} | Failed: ${testsFailed}`);
        
        if (testsFailed === 0) {
          console.log('\n✅ All tests passed! The SDP proxy appears to be working correctly.');
        } else {
          console.log('\n⚠️ Some tests failed. Check the logs above for details.');
        }
        
        cleanup(testsFailed > 0 ? 1 : 0);
      }, 1000);
    }
    else if (message.type === 'error') {
      console.error(`❌ Server error: ${message.message}`);
      testsFailed++;
    }
  } catch (error) {
    console.error('❌ Error parsing message:', error);
    testsFailed++;
  }
});

ws.on('error', (error) => {
  console.error('❌ WebSocket error:', error);
  testsFailed++;
  cleanup(1);
});

ws.on('close', () => {
  console.log('Connection closed');
});

// Cleanup function
function cleanup(exitCode = 0) {
  if (testTimeout) {
    clearTimeout(testTimeout);
  }
  
  try {
    ws.close();
  } catch (e) {
    // Ignore errors during cleanup
  }
  
  // Ask if the user wants to exit
  if (exitCode !== 0) {
    rl.question('\nPress Enter to exit...', () => {
      rl.close();
      process.exit(exitCode);
    });
  } else {
    rl.close();
    process.exit(exitCode);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\nTest interrupted');
  cleanup(1);
});

console.log('Waiting for server response...'); 