#!/usr/bin/env node

/**
 * Test Runner for Hybrid Architecture
 *
 * This script runs the tests specifically for the hybrid WebRTC architecture.
 * The hybrid architecture establishes a direct WebRTC connection with OpenAI,
 * using the SDP proxy only for secure connection negotiation.
 *
 * We no longer support the original SDP proxy approach where audio was
 * fully transmitted through our proxy server.
 *
 * Usage:
 *   npm run test:hybrid
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
  gray: '\x1b[90m'
};

// Banner for the test runner
console.log(`${colors.bright}${colors.cyan}
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║             Hybrid Architecture WebRTC Tests               ║
║                                                            ║
║  ${colors.yellow}The only supported architecture for WebRTC interviews${colors.cyan}  ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝${colors.reset}
`);

// Core hooks to test (common utility hooks used across architectures)
const coreHooks = [
  'useConnectionState',
  'useRetry',
  'useAudioVisualization',
];

// Hybrid architecture specific hooks
const hybridHooks = [
  'useOpenAIConnection',    // Direct OpenAI connection
  'useSDPProxy',            // Secure SDP exchange only (no audio proxy)
  'useWebRTC',              // Main orchestration hook
  'useTranscriptManager',   // Handles transcript with hybrid source attribution
  'useWebRTCConnection',    // Generic WebRTC peer connection management
  'useWebSocketConnection'  // WebSocket for SDP exchange only
];

// Additional explanation about the hybrid architecture
console.log(`${colors.gray}
In the hybrid architecture:
- WebRTC connections go directly to OpenAI's API
- Our server only proxies the SDP exchange for security
- Audio flows directly between the client and OpenAI
- Transcripts are saved with 'hybrid' source attribution
- No audio data passes through our servers

This approach provides lower latency and better reliability
while maintaining security through SDP proxying.
${colors.reset}
`);

// Run tests for a specific hook
function runTestForHook(hook) {
  const testFile = `src/hooks/webrtc/__tests__/${hook}.test.ts`;

  // Check if test file exists
  if (!fs.existsSync(path.resolve(process.cwd(), testFile))) {
    console.log(`${colors.yellow}⚠ Warning: Test file not found for ${hook}${colors.reset}`);
    return { success: false, tests: 0, passed: 0 };
  }

  console.log(`${colors.bright}${colors.blue}➤ Testing ${hook}...${colors.reset}`);

  try {
    // Run the test and capture output
    const output = execSync(`npm test -- --run ${testFile}`, {
      encoding: 'utf8',
      stdio: 'pipe'
    });

    // Count passed and total tests
    const passedMatch = output.match(/✓\s+(\d+)\s+passed/);
    const passedCount = passedMatch ? parseInt(passedMatch[1]) : 0;

    // Look for total test count
    const totalMatch = output.match(/\s+(\d+)\s+tests\s+(passed|failed|skipped)/);
    const totalTests = totalMatch ? parseInt(totalMatch[1]) : passedCount;

    console.log(`${colors.green}✓ ${hook} tests completed: ${passedCount}/${totalTests} passed${colors.reset}`);
    return { success: true, tests: totalTests, passed: passedCount };
  } catch (error) {
    console.log(`${colors.red}✗ ${hook} tests failed${colors.reset}`);
    console.error(error.stdout);

    // Try to extract numbers even from failure
    const passedMatch = error.stdout.toString().match(/(\d+)\s+passed/);
    const failedMatch = error.stdout.toString().match(/(\d+)\s+failed/);
    const totalMatch = error.stdout.toString().match(/\s+(\d+)\s+tests/);

    const passed = passedMatch ? parseInt(passedMatch[1]) : 0;
    const failed = failedMatch ? parseInt(failedMatch[1]) : 0;
    const total = totalMatch ? parseInt(totalMatch[1]) : (passed + failed);

    return { success: false, tests: total, passed: passed };
  }
}

// Run all tests
async function runAllTests() {
  // Track test statistics
  let coreStats = { total: 0, passed: 0, hooks: 0 };
  let hybridStats = { total: 0, passed: 0, hooks: 0 };

  console.log(`${colors.bright}${colors.magenta}Running Core Hook Tests...${colors.reset}`);

  for (const hook of coreHooks) {
    const result = runTestForHook(hook);
    coreStats.total += result.tests;
    coreStats.passed += result.passed;
    if (result.success) coreStats.hooks++;
  }

  console.log(`\n${colors.bright}${colors.magenta}Running Hybrid Architecture Hook Tests...${colors.reset}`);

  for (const hook of hybridHooks) {
    const result = runTestForHook(hook);
    hybridStats.total += result.tests;
    hybridStats.passed += result.passed;
    if (result.success) hybridStats.hooks++;
  }

  // Summary
  const totalTests = coreStats.total + hybridStats.total;
  const totalPassed = coreStats.passed + hybridStats.passed;
  const totalHooks = coreStats.hooks + hybridStats.hooks;
  const allHooks = coreHooks.length + hybridHooks.length;

  console.log(`\n${colors.bright}${colors.cyan}╔════════════════════════════════════════════════════════════╗
║                       Test Summary                         ║
╚════════════════════════════════════════════════════════════╝${colors.reset}`);

  console.log(`${colors.cyan}Core Hooks:${colors.reset} ${colors.green}${coreStats.passed}/${coreStats.total} tests passed${colors.reset} (${coreStats.hooks}/${coreHooks.length} hooks successful)`);
  console.log(`${colors.cyan}Hybrid Hooks:${colors.reset} ${colors.green}${hybridStats.passed}/${hybridStats.total} tests passed${colors.reset} (${hybridStats.hooks}/${hybridHooks.length} hooks successful)`);
  console.log(`${colors.cyan}Total:${colors.reset} ${colors.green}${totalPassed}/${totalTests} tests passed${colors.reset} (${totalHooks}/${allHooks} hooks successful)`);

  if (totalPassed === totalTests && totalHooks === allHooks) {
    console.log(`\n${colors.bright}${colors.green}✓ All hybrid architecture tests passed successfully!${colors.reset}`);
    process.exit(0);
  } else {
    console.log(`\n${colors.bright}${colors.red}✗ Some tests failed: ${totalPassed}/${totalTests} passed${colors.reset}`);
    process.exit(1);
  }
}

// Run all the tests
runAllTests().catch(error => {
  console.error(`${colors.red}Error running tests:${colors.reset}`, error);
  process.exit(1);
});