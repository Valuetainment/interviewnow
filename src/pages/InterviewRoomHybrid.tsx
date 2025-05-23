import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { WebRTCManager } from '@/components/interview/WebRTCManager';
import { TranscriptPanel } from '@/components/interview/TranscriptPanel';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, AlertCircle } from 'lucide-react';

interface InterviewSessionData {
  id: string;
  position: {
    id: string;
    title: string;
    description?: string;
  };
  candidate: {
    id: string;
    full_name: string;
    email?: string;
  };
  company?: {
    id: string;
    name: string;
  };
  start_time: string;
  status: string;
}

interface InterviewConfig {
  serverUrl: string;
  openAIConfig?: {
    voice?: string;
    model?: string;
    temperature?: number;
    instructions?: string;
  };
}

const InterviewRoomHybrid = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<InterviewSessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [interviewConfig, setInterviewConfig] = useState<InterviewConfig | null>(null);
  const [transcript, setTranscript] = useState<string>('');
  const [connectionState, setConnectionState] = useState<string>('disconnected');
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        setLoading(true);
        if (!id) {
          throw new Error('Session ID is required');
        }

        // Fetch session data with related entities
        const { data, error } = await supabase
          .from('interview_sessions')
          .select(`
            id,
            position:position_id (id, title, description),
            candidate:candidate_id (id, full_name, email),
            company:company_id (id, name),
            start_time,
            status
          `)
          .eq('id', id)
          .single();

        if (error) throw error;
        if (!data) throw new Error('Session not found');

        setSession(data);
      } catch (err) {
        console.error('Error fetching session:', err);
        setError(err instanceof Error ? err.message : 'Failed to load session');
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [id]);

  const startInterview = async () => {
    if (!session) return;

    try {
      setIsStarting(true);
      setError(null);

      // Call the interview-start edge function
      const { data, error } = await supabase.functions.invoke('interview-start', {
        body: {
          interview_session_id: session.id,
          architecture: 'hybrid' // Use hybrid architecture
        }
      });

      if (error) throw error;
      if (!data) throw new Error('No configuration received from server');

      console.log('Interview configuration received:', data);

      // Set the configuration for WebRTC
      setInterviewConfig({
        serverUrl: data.vm_url || data.websocket_url,
        openAIConfig: data.openai_config
      });

      // Update session status to in_progress
      await supabase
        .from('interview_sessions')
        .update({ status: 'in_progress' })
        .eq('id', session.id);

      toast.success('Interview started successfully');
    } catch (err) {
      console.error('Error starting interview:', err);
      setError(err instanceof Error ? err.message : 'Failed to start interview');
      toast.error('Failed to start interview');
    } finally {
      setIsStarting(false);
    }
  };

  const handleTranscriptUpdate = (text: string) => {
    setTranscript(prev => prev ? `${prev}\n${text}` : text);
  };

  const handleConnectionStateChange = (state: string) => {
    setConnectionState(state);
    console.log('Connection state:', state);
  };

  const endInterview = async () => {
    try {
      // Update session status
      await supabase
        .from('interview_sessions')
        .update({ 
          status: 'completed',
          end_time: new Date().toISOString()
        })
        .eq('id', session?.id);

      toast.success('Interview ended');
      navigate('/sessions');
    } catch (err) {
      console.error('Error ending interview:', err);
      toast.error('Failed to end interview properly');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Error Loading Interview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">{error || 'Session not found'}</p>
            <Button onClick={() => navigate('/dashboard')} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold">
                Interview: {session.candidate.full_name}
              </h1>
              <p className="text-gray-600">
                {session.position.title} 
                {session.company && ` at ${session.company.name}`}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">
                Status: <span className="font-medium">{connectionState}</span>
              </span>
              {interviewConfig && (
                <Button onClick={endInterview} variant="destructive">
                  End Interview
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!interviewConfig ? (
          /* Pre-interview Screen */
          <div className="flex items-center justify-center min-h-[600px]">
            <Card className="max-w-lg w-full">
              <CardHeader>
                <CardTitle>Ready to Start Interview</CardTitle>
                <CardDescription>
                  Review the details below and click start when ready
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-1">Candidate</h3>
                  <p>{session.candidate.full_name}</p>
                  {session.candidate.email && (
                    <p className="text-sm text-gray-600">{session.candidate.email}</p>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Position</h3>
                  <p>{session.position.title}</p>
                  {session.position.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {session.position.description}
                    </p>
                  )}
                </div>
                {session.company && (
                  <div>
                    <h3 className="font-semibold mb-1">Company</h3>
                    <p>{session.company.name}</p>
                  </div>
                )}
                <Button 
                  onClick={startInterview} 
                  className="w-full"
                  disabled={isStarting}
                >
                  {isStarting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Starting Interview...
                    </>
                  ) : (
                    'Start Interview'
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Interview in Progress */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Interview Controls</CardTitle>
                </CardHeader>
                <CardContent>
                  <WebRTCManager
                    sessionId={session.id}
                    serverUrl={interviewConfig.serverUrl}
                    openAIConfig={interviewConfig.openAIConfig}
                    onTranscriptUpdate={handleTranscriptUpdate}
                    onConnectionStateChange={handleConnectionStateChange}
                  />
                </CardContent>
              </Card>
            </div>
            
            <div>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Interview Transcript</CardTitle>
                </CardHeader>
                <CardContent>
                  <TranscriptPanel
                    transcript={transcript}
                    interviewId={session.id}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InterviewRoomHybrid;