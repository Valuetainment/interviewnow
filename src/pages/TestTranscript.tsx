import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase, getCurrentTenantId } from '@/integrations/supabase/client';
import { useTranscriptManager } from '@/hooks/webrtc/useTranscriptManager';

export default function TestTranscript() {
  const [sessionId, setSessionId] = useState<string>('');
  const [testResult, setTestResult] = useState<string>('');
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  
  const { transcript, saveTranscript, clearTranscript } = useTranscriptManager({
    sessionId,
    onTranscriptUpdate: (text) => {
      console.log('Transcript updated:', text);
    }
  });

  // Create a test session
  const createTestSession = async () => {
    setIsCreatingSession(true);
    setTestResult('Creating test session...');
    
    try {
      const tenantId = await getCurrentTenantId();
      if (!tenantId) {
        throw new Error('No tenant ID found');
      }

      // Create a test interview session
      const { data, error } = await supabase
        .from('interview_sessions')
        .insert({
          tenant_id: tenantId,
          status: 'in_progress',
          scheduled_time: new Date().toISOString(),
          title: 'Test Transcript Session',
          description: 'Testing transcript edge function'
        })
        .select()
        .single();

      if (error) throw error;

      setSessionId(data.id);
      setTestResult(`✅ Created session: ${data.id}`);
    } catch (error) {
      console.error('Error creating session:', error);
      setTestResult(`❌ Error: ${error.message}`);
    } finally {
      setIsCreatingSession(false);
    }
  };

  // Test saving a transcript
  const testSaveTranscript = async () => {
    if (!sessionId) {
      setTestResult('❌ Please create a session first');
      return;
    }

    setTestResult('Testing transcript save...');
    
    try {
      // Test candidate speech
      await saveTranscript('Hello, this is a test transcript from the candidate.', 'candidate');
      
      // Test AI speech
      await saveTranscript('Thank you for that response. Let me ask you another question.', 'ai');
      
      // Test unknown speaker
      await saveTranscript('This is a system message or unknown speaker.', 'unknown');
      
      setTestResult('✅ Transcript save test completed - check console and database');
    } catch (error) {
      console.error('Error in transcript test:', error);
      setTestResult(`❌ Error: ${error.message}`);
    }
  };

  // Check transcript entries in database
  const checkDatabase = async () => {
    if (!sessionId) {
      setTestResult('❌ Please create a session first');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('transcript_entries')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setTestResult(`✅ Found ${data.length} transcript entries in database:\n${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      console.error('Error checking database:', error);
      setTestResult(`❌ Error: ${error.message}`);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Transcript Edge Function Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Step 1: Create Test Session</h3>
            <Button 
              onClick={createTestSession} 
              disabled={isCreatingSession || !!sessionId}
            >
              {isCreatingSession ? 'Creating...' : 'Create Test Session'}
            </Button>
            {sessionId && (
              <p className="text-sm text-muted-foreground">Session ID: {sessionId}</p>
            )}
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Step 2: Test Transcript Save</h3>
            <Button 
              onClick={testSaveTranscript} 
              disabled={!sessionId}
            >
              Test Save Transcript
            </Button>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Step 3: Check Database</h3>
            <Button 
              onClick={checkDatabase} 
              disabled={!sessionId}
            >
              Check Database Entries
            </Button>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Local Transcript State</h3>
            <div className="bg-muted p-4 rounded-lg">
              {transcript.length === 0 ? (
                <p className="text-muted-foreground">No transcript entries yet</p>
              ) : (
                <div className="space-y-2">
                  {transcript.map((entry, index) => (
                    <div key={index} className="text-sm">
                      <span className="font-semibold">{entry.speaker}:</span> {entry.text}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <Button 
              onClick={clearTranscript} 
              variant="outline"
              disabled={transcript.length === 0}
            >
              Clear Local Transcript
            </Button>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Test Result</h3>
            <pre className="bg-muted p-4 rounded-lg text-sm whitespace-pre-wrap">
              {testResult || 'No test run yet'}
            </pre>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-900">Instructions:</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800 mt-2">
              <li>Click "Create Test Session" to create a new interview session</li>
              <li>Click "Test Save Transcript" to save some test transcript entries</li>
              <li>Check the browser console for detailed logs</li>
              <li>Click "Check Database Entries" to verify data was saved</li>
              <li>The local transcript state shows what's in memory</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 