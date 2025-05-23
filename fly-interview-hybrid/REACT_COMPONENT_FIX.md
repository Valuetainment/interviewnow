# React Component Fix Plan

## useAudioVisualization.ts Infinite Loop Fix

The infinite loop issue in `useAudioVisualization.ts` is causing browser crashes during WebRTC testing. Based on the console errors, we're seeing "Maximum update depth exceeded" which typically occurs when a component calls setState inside useEffect without proper dependency management.

### Current Issue

From the error logs:
```
Warning: Maximum update depth exceeded. This can happen when a component calls setState inside useEffect, but useEffect either doesn't have a dependency array, or one of the dependencies changes on every render.
    at WebRTCManager (http://localhost:8080/src/components/interview/WebRTCManager.tsx:14:33)
```

The error specifically points to issues in `useAudioVisualization.ts` line 46, which is likely making state updates in a way that causes infinite re-renders.

### Step 1: Fix useEffect Dependencies

Look for useEffect hooks with state updates but no dependency array or with dependencies that change on every render:

```typescript
// INCORRECT PATTERN (example)
useEffect(() => {
  // This will run on every render and cause infinite loops
  setAudioLevel(calculateLevel(audioData));
}); // Missing dependency array

// CORRECTED PATTERN
useEffect(() => {
  setAudioLevel(calculateLevel(audioData));
}, [audioData]); // Only runs when audioData changes
```

### Step 2: Prevent Updates During Unmounting

Add checks to prevent state updates after component unmounting:

```typescript
useEffect(() => {
  let isMounted = true;
  
  // Function to update audio levels
  const updateAudioLevel = () => {
    if (isMounted) { // Only update state if component is still mounted
      setAudioLevel(calculateLevel(audioData));
    }
  };
  
  updateAudioLevel();
  
  // Cleanup function
  return () => {
    isMounted = false;
  };
}, [audioData]);
```

### Step 3: Properly Clean Up Audio Resources

Ensure all audio resources are properly cleaned up to prevent memory leaks:

```typescript
useEffect(() => {
  // Set up audio resources
  const audioContext = new AudioContext();
  const analyser = audioContext.createAnalyser();
  // ... other setup
  
  // Clean up function
  return () => {
    // Clean up all audio resources
    if (audioContext.state !== 'closed') {
      audioContext.close();
    }
    // Clean up any other resources or timers
  };
}, []);
```

### Step 4: Add Error Boundaries

Create an error boundary component to prevent the entire application from crashing:

```typescript
// ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Error in component:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <div>Something went wrong.</div>;
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

### Step 5: Create Simplified Version

Create a simplified version of WebRTCManager without audio visualization for testing:

```typescript
// SimpleWebRTCManager.tsx (without audio visualization)
import React, { useEffect, useState } from 'react';
import { useWebSocketConnection } from '../../hooks/webrtc/useWebSocketConnection';
import { useSDPProxy } from '../../hooks/webrtc/useSDPProxy';

const SimpleWebRTCManager: React.FC = () => {
  const [connectionState, setConnectionState] = useState('disconnected');
  
  const { 
    connect, 
    disconnect, 
    sendMessage,
    messageQueue 
  } = useWebSocketConnection({
    onConnectionStateChange: (state) => setConnectionState(state),
    // Remove audio visualization dependencies
  });
  
  useEffect(() => {
    // Connect to server without audio visualization
    connect('ws://localhost:3001?simulation=true');
    
    return () => {
      // Clean up
      disconnect();
    };
  }, [connect, disconnect]);
  
  return (
    <div>
      <h2>Simple WebRTC Test</h2>
      <div>Connection State: {connectionState}</div>
      <div>
        {messageQueue.map((msg, index) => (
          <div key={index}>{JSON.stringify(msg)}</div>
        ))}
      </div>
    </div>
  );
};

export default SimpleWebRTCManager;
```

## Implementation Plan

1. Create a temporary branch for the fix
2. Implement the changes to useAudioVisualization.ts
3. Create the simplified WebRTCManager component
4. Add error boundaries in the appropriate places
5. Test with both the simple and full components
6. Verify the fix resolves the infinite loop
7. Create a pull request with detailed explanation of the fix

## Testing Approach

1. Test the simplified component first without audio visualization
2. Verify WebSocket connections work properly
3. Gradually add audio visualization with the fixes
4. Test in multiple browsers (Chrome, Firefox, Safari)
5. Test with different network conditions
6. Verify no memory leaks or resource exhaustion occurs