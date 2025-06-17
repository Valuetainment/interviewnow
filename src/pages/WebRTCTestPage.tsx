import React, { useState, useCallback, useEffect } from 'react';
import { useSDPProxy } from '../hooks/webrtc/useSDPProxy';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ConnectionState } from '../hooks/webrtc/useConnectionState';

export function WebRTCTestPage() {
  const [serverUrl, setServerUrl] = useState('wss://interview-hybrid-template.fly.dev/ws');
  const [transcript, setTranscript] = useState<string[]>([]);
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [logs, setLogs] = useState<string[]>([]);
  const [sessionId] = useState(`test-session-${Date.now()}`);
  
  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toISOString();
    setLogs(prev => [...prev, `${timestamp}: ${message}`]);
    console.log(`[WebRTCTest] ${message}`);
  }, []);
  
  const handleTranscriptUpdate = useCallback((text: string) => {
    setTranscript(prev => [...prev, text]);
    addLog(`Transcript: ${text}`);
  }, [addLog]);
  
  const handleConnectionStateChange = useCallback((state: ConnectionState) => {
    setConnectionState(state);
    addLog(`Connection state: ${state}`);
  }, [addLog]);
  
  const {
    initialize,
    cleanup,
    connectionState: currentState,
    error,
    isConnected,
    audioLevel
  } = useSDPProxy(
    sessionId,
    {
      serverUrl,
      openAISettings: {
        voice: 'verse',
        model: 'gpt-4o-realtime-preview-2025-06-03',
        instructions: 'You are a helpful AI assistant conducting a technical interview. Please introduce yourself and ask the candidate about their background.'
      }
    },
    handleConnectionStateChange,
    handleTranscriptUpdate
  );
  
  useEffect(() => {
    addLog('WebRTC Test Page loaded');
    addLog(`Session ID: ${sessionId}`);
  }, [sessionId, addLog]);
  
  const handleConnect = async () => {
    try {
      addLog('Starting connection...');
      const success = await initialize();
      
      if (success) {
        addLog('Connection initialized successfully');
      } else {
        addLog('Failed to initialize connection');
      }
    } catch (error) {
      addLog(`Connection error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  const handleDisconnect = () => {
    addLog('Disconnecting...');
    cleanup();
    setTranscript([]);
    addLog('Disconnected');
  };
  
  const clearLogs = () => {
    setLogs([]);
    setTranscript([]);
  };
  
  return (
    <div className="container mx-auto p-8 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">WebRTC Test Page</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Server URL</label>
              <Input
                type="text"
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                disabled={isConnected}
                placeholder="wss://interview-hybrid-template.fly.dev/ws"
              />
            </div>
            
            <div className="space-y-2">
              <p className="text-sm">
                <strong>Session ID:</strong> {sessionId}
              </p>
              <p className="text-sm">
                <strong>Connection State:</strong> {currentState || 'disconnected'}
              </p>
              <p className="text-sm">
                <strong>Audio Level:</strong> {audioLevel.toFixed(2)}
              </p>
              {error && (
                <p className="text-sm text-red-600">
                  <strong>Error:</strong> {error}
                </p>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={handleConnect}
                disabled={isConnected}
                variant="default"
              >
                Connect
              </Button>
              
              <Button
                onClick={handleDisconnect}
                disabled={!isConnected}
                variant="destructive"
              >
                Disconnect
              </Button>
              
              <Button
                onClick={clearLogs}
                variant="outline"
              >
                Clear Logs
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Connection Status */}
        <Card>
          <CardHeader>
            <CardTitle>Connection Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  isConnected ? 'bg-green-500' : 'bg-red-500'
                }`} />
                <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
              </div>
              
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Test Instructions:</h3>
                <ol className="text-sm space-y-1 list-decimal list-inside">
                  <li>Click "Connect" to establish WebRTC connection</li>
                  <li>Grant microphone permissions when prompted</li>
                  <li>Speak to test audio capture</li>
                  <li>Check logs for SDP exchange and connection events</li>
                  <li>Verify transcripts appear when speaking</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Transcript */}
        <Card>
          <CardHeader>
            <CardTitle>Transcript</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={transcript.join('\n')}
              readOnly
              className="h-64 font-mono text-sm"
              placeholder="Transcript will appear here..."
            />
          </CardContent>
        </Card>
        
        {/* Logs */}
        <Card>
          <CardHeader>
            <CardTitle>Debug Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={logs.join('\n')}
              readOnly
              className="h-64 font-mono text-xs"
              placeholder="Logs will appear here..."
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}