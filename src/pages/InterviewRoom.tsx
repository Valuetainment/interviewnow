import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  MessageSquare,
  X,
  Clock,
  Pause,
  Play,
  StopCircle,
  FileText,
} from 'lucide-react';

import { useAudioCapture } from '@/hooks/useAudioCapture';
import { useTranscriptSubscription, TranscriptEntry } from '@/hooks/useTranscriptSubscription';
import { getCurrentTenantId } from '@/integrations/supabase/client';

interface InterviewSessionData {
  id: string;
  position: {
    id: string;
    title: string;
  };
  candidate: {
    id: string;
    full_name: string;
  };
  start_time: string;
  status: string;
}

const InterviewRoom = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<InterviewSessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [micEnabled, setMicEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [tenantId, setTenantId] = useState<string | null>(null);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const loadTenantId = async () => {
      const id = await getCurrentTenantId();
      setTenantId(id);
    };
    
    loadTenantId();
  }, []);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        setLoading(true);
        if (!id) {
          throw new Error('Session ID is required');
        }

        const { data, error } = await supabase
          .from('interview_sessions')
          .select(`
            id,
            position:position_id (id, title),
            candidate:candidate_id (id, full_name),
            start_time,
            status
          `)
          .eq('id', id)
          .single();

        if (error) throw error;
        if (!data) throw new Error('Session not found');

        setSession(data);
        
        if (data.status === 'scheduled') {
          await supabase
            .from('interview_sessions')
            .update({ status: 'in_progress' })
            .eq('id', id);
            
          await supabase
            .from('usage_events')
            .insert({
              tenant_id: tenantId,
              event_type: 'interview_started',
              quantity: 1,
            });
        }
      } catch (err) {
        console.error('Error fetching session:', err);
        setError(err instanceof Error ? err.message : 'Failed to load interview session');
        toast.error('Failed to load interview session');
      } finally {
        setLoading(false);
      }
    };

    if (tenantId) {
      fetchSession();
    }
  }, [id, tenantId]);

  useEffect(() => {
    if (!session) return;

    const setupLocalVideo = async () => {
      try {
        if (localVideoRef.current) {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: true, 
            audio: true 
          });
          localVideoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error('Error accessing media devices:', err);
        toast.error('Failed to access camera or microphone');
      }
    };

    setupLocalVideo();

    return () => {
      if (localVideoRef.current && localVideoRef.current.srcObject) {
        const stream = localVideoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [session]);

  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording, isPaused]);

  const { 
    entries: transcriptEntries,
    isSubscribed,
    error: transcriptError 
  } = useTranscriptSubscription({
    sessionId: id || '',
    onNewEntry: (entry) => {
      console.log('New transcript entry:', entry);
    },
    onError: (err) => {
      console.error('Transcript subscription error:', err);
      toast.error('Error with transcript subscription');
    }
  });

  const {
    audioLevel,
    isInitialized: isAudioInitialized,
    error: audioError
  } = useAudioCapture({
    sessionId: id || '',
    tenantId: tenantId || '',
    speaker: 'User',
    isRecording: isRecording && !isPaused && !!tenantId,
    onTranscriptReceived: (data) => {
      console.log('Transcription received:', data);
    },
    onError: (err) => {
      console.error('Audio capture error:', err);
      toast.error('Error with audio capture');
    }
  });

  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleRecording = () => {
    if (!isRecording) {
      setIsRecording(true);
      setIsPaused(false);
      toast.success('Recording started');
    } else {
      setIsRecording(false);
      toast.success('Recording stopped');
    }
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
    toast.info(isPaused ? 'Recording resumed' : 'Recording paused');
  };

  const endInterview = async () => {
    setIsRecording(false);
    toast.success('Interview ended');
    
    try {
      if (!tenantId) throw new Error('Tenant ID not found');
      
      await supabase
        .from('interview_sessions')
        .update({
          status: 'completed',
          end_time: new Date().toISOString()
        })
        .eq('id', id);
        
      await supabase
        .from('usage_events')
        .insert({
          tenant_id: tenantId,
          event_type: 'interview_completed',
          quantity: 1,
        });
        
      navigate('/dashboard');
    } catch (err) {
      console.error('Error ending interview:', err);
      toast.error('Failed to end interview properly');
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading interview session...</p>
        </div>
      </div>
    );
  }

  if (error || !session || !tenantId) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>Failed to load interview session</CardDescription>
          </CardHeader>
          <CardContent>
            <p>{error || 'Session not found or tenant ID not available'}</p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => navigate('/dashboard')}>Return to Dashboard</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div>
          <h1 className="text-xl font-semibold">Interview: {session.position.title}</h1>
          <p className="text-sm text-muted-foreground">Candidate: {session.candidate.full_name}</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="font-mono">{formatTime(elapsedTime)}</span>
          </div>
          
          <Button variant="destructive" size="sm" onClick={endInterview}>
            End Interview
          </Button>
        </div>
      </div>
      
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 p-4">
          <div className="grid h-full grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="relative rounded-lg bg-muted">
              <video 
                ref={remoteVideoRef}
                className="h-full w-full rounded-lg object-cover"
                autoPlay
                playsInline
              />
              <div className="absolute bottom-4 left-4 rounded-md bg-background/80 px-2 py-1">
                <span className="text-sm font-medium">Interviewer</span>
              </div>
            </div>
            
            <div className="relative rounded-lg bg-muted">
              <video 
                ref={localVideoRef}
                className="h-full w-full rounded-lg object-cover mirror"
                autoPlay
                playsInline
                muted
              />
              <div className="absolute bottom-4 left-4 rounded-md bg-background/80 px-2 py-1">
                <span className="text-sm font-medium">You</span>
              </div>
              
              {isAudioInitialized && (
                <div className="absolute bottom-4 right-4 flex items-center space-x-2">
                  <div className="h-2 w-20 rounded-full bg-gray-300 overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full" 
                      style={{ width: `${audioLevel}%` }}
                    ></div>
                  </div>
                  <Mic className="h-4 w-4" />
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="w-96 border-l">
          <div className="flex h-full flex-col">
            <div className="border-b px-4 py-3">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">Live Transcript</h2>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              {transcriptEntries.length > 0 ? (
                transcriptEntries.map((entry) => (
                  <div key={entry.id} className="mb-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{entry.speaker}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(entry.start_ms).toISOString().substr(11, 8)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm">{entry.text}</p>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <FileText className="h-8 w-8 mb-2 opacity-50" />
                  <p>No transcript yet.</p>
                  <p className="text-xs mt-1">
                    {isRecording 
                      ? 'Recording in progress...' 
                      : 'Start recording to generate transcript'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="border-t px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setMicEnabled(!micEnabled)}
            >
              {micEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => setVideoEnabled(!videoEnabled)}
            >
              {videoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
            </Button>
            
            <Separator orientation="vertical" className="h-6" />
            
            <Button 
              variant={isRecording ? "destructive" : "default"}
              size="sm"
              onClick={toggleRecording}
            >
              {isRecording ? <StopCircle className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
              {isRecording ? "Stop Recording" : "Start Recording"}
            </Button>
            
            {isRecording && (
              <Button
                variant="outline"
                size="sm"
                onClick={togglePause}
              >
                {isPaused ? <Play className="mr-2 h-4 w-4" /> : <Pause className="mr-2 h-4 w-4" />}
                {isPaused ? "Resume" : "Pause"}
              </Button>
            )}
          </div>
          
          <div>
            <Button variant="outline" size="sm">
              <MessageSquare className="mr-2 h-4 w-4" />
              Interview Guide
            </Button>
          </div>
        </div>
      </div>
      
      <style>{`
        .mirror {
          transform: scaleX(-1);
        }
      `}</style>
    </div>
  );
};

export default InterviewRoom; 