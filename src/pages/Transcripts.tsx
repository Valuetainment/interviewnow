import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from "sonner";
import { FileText, Search, Calendar, Clock, List, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface TranscriptEntry {
  id: string;
  speaker: string;
  text: string;
  start_ms: number;
}

interface InterviewSession {
  id: string;
  candidate_id: string;
  position_id: string;
  start_time: string | null;
  end_time: string | null;
  status: string;
  candidate: {
    full_name: string;
    email: string;
  };
  position: {
    title: string;
  };
  transcript_entries: TranscriptEntry[];
}

const Transcripts: React.FC = () => {
  const { tenantId } = useAuth();
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch interview sessions with transcripts
  useEffect(() => {
    if (!tenantId) return;

    const fetchSessions = async () => {
      try {
        setLoading(true);
        setError(null);

        // First fetch interview sessions with related data
        const { data: sessionsData, error: sessionsError } = await supabase
          .from('interview_sessions')
          .select(`
            id,
            candidate_id,
            position_id,
            start_time,
            end_time,
            status,
            candidates (
              full_name,
              email
            ),
            positions (
              title
            )
          `)
          .eq('tenant_id', tenantId)
          .eq('status', 'completed') // Only show completed interviews
          .order('start_time', { ascending: false });

        if (sessionsError) {
          console.error('Error fetching sessions:', sessionsError);
          setError('Failed to load interview sessions');
          return;
        }

        console.log('Fetched sessions data:', sessionsData);
        console.log('Number of sessions:', sessionsData?.length || 0);
        console.log('Supabase URL:', (window as any).supabase?._supabaseUrl || (window as any).__supabaseClient?._supabaseUrl);
        console.log('Tenant ID:', tenantId);

        if (!sessionsData || sessionsData.length === 0) {
          setSessions([]);
          return;
        }

        // Fetch transcript entries for all sessions
        const sessionIds = sessionsData.map(s => s.id);
        const { data: transcriptsData, error: transcriptsError } = await supabase
          .from('transcript_entries')
          .select('*')
          .in('session_id', sessionIds)
          .order('start_ms', { ascending: true })
          .order('created_at', { ascending: true });

        if (transcriptsError) {
          console.error('Error fetching transcripts:', transcriptsError);
          setError('Failed to load transcripts');
          return;
        }

        console.log('Fetched transcript entries:', transcriptsData);
        console.log('Number of transcript entries:', transcriptsData?.length || 0);

        // Combine sessions with their transcript entries
        const sessionsWithTranscripts = sessionsData.map(session => ({
          ...session,
          candidate: session.candidates as any,
          position: session.positions as any,
          transcript_entries: transcriptsData?.filter(t => t.session_id === session.id) || []
        }));

        setSessions(sessionsWithTranscripts);
      } catch (err) {
        console.error('Error in fetchSessions:', err);
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, [tenantId]);
  
  const filteredSessions = sessions.filter(session => {
    const matchesSearch = 
      session.candidate.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      session.position.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.candidate.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === "all" || session.status.toLowerCase() === filterStatus.toLowerCase();
    
    return matchesSearch && matchesStatus;
  });
  
  const selectedSession = selectedSessionId 
    ? sessions.find(session => session.id === selectedSessionId) 
    : null;

  // Calculate duration if both start and end times exist
  const calculateDuration = (startTime: string | null, endTime: string | null) => {
    if (!startTime || !endTime) return 'N/A';
    
    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationMs = end.getTime() - start.getTime();
    const minutes = Math.floor(durationMs / 60000);
    
    if (minutes < 60) {
      return `${minutes} minutes`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours}h ${remainingMinutes}m`;
    }
  };

  // Format timestamp from milliseconds
  const formatTimestamp = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold mb-8">Interview Transcripts</h1>
        
        {/* Filters and search */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-grow">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
              <Input 
                placeholder="Search by candidate or position..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="w-full md:w-48">
            <Select 
              value={filterStatus} 
              onValueChange={setFilterStatus}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Interview List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Completed Interviews</CardTitle>
                <CardDescription>Select an interview to view the transcript</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {loading ? (
                    <div className="flex items-center justify-center p-8">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : error ? (
                    <div className="p-8 text-center text-red-600">
                      <p>{error}</p>
                    </div>
                  ) : filteredSessions.length > 0 ? (
                    filteredSessions.map((session) => (
                      <div 
                        key={session.id}
                        onClick={() => setSelectedSessionId(session.id)}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedSessionId === session.id 
                            ? 'border-primary bg-primary/5' 
                            : 'hover:border-primary/50'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-medium">{session.candidate.full_name}</h3>
                          {session.transcript_entries.length > 0 && (
                            <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                              {session.transcript_entries.length} entries
                          </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{session.position.title}</p>
                        <div className="flex gap-2 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar size={12} /> {formatDate(session.start_time)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={12} /> {calculateDuration(session.start_time, session.end_time)}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-muted-foreground">
                      <FileText className="mx-auto h-8 w-8 mb-2 opacity-50" />
                      <p>No interviews found matching your filters</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Transcript View */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>
                  {selectedSession 
                    ? `${selectedSession.candidate.full_name} - ${selectedSession.position.title}` 
                    : 'Transcript Details'}
                </CardTitle>
                <CardDescription>
                  {selectedSession 
                    ? `${formatDate(selectedSession.start_time)} | ${calculateDuration(selectedSession.start_time, selectedSession.end_time)}` 
                    : 'Select an interview to view transcript'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedSession ? (
                  <div className="space-y-6">
                    {/* Summary */}
                    <div className="bg-muted p-4 rounded-lg mb-6">
                      <h3 className="font-medium mb-2">Interview Summary</h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Candidate:</p>
                          <p className="font-medium">{selectedSession.candidate.full_name}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Position:</p>
                          <p className="font-medium">{selectedSession.position.title}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Date:</p>
                          <p>{formatDate(selectedSession.start_time)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Duration:</p>
                          <p>{calculateDuration(selectedSession.start_time, selectedSession.end_time)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Status:</p>
                          <p className="capitalize">{selectedSession.status}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Total Entries:</p>
                          <p>{selectedSession.transcript_entries.length}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Transcript */}
                    <div>
                      <h3 className="font-medium mb-4 flex items-center gap-2">
                        <List className="h-4 w-4" />
                        Transcript
                      </h3>
                      
                      <div className="space-y-6 max-h-[600px] overflow-y-auto">
                        {selectedSession.transcript_entries.length > 0 ? (
                          selectedSession.transcript_entries.map((entry) => (
                            <div key={entry.id} className="flex gap-4">
                            <div className="w-24 flex-shrink-0 text-xs text-muted-foreground pt-1">
                                {formatTimestamp(entry.start_ms)}
                            </div>
                            <div className="flex-grow">
                              <p className={`text-sm font-medium mb-1 ${
                                  entry.speaker.toLowerCase() === "interviewer" || entry.speaker.toLowerCase() === "assistant"
                                  ? "text-primary" 
                                  : "text-foreground"
                              }`}>
                                {entry.speaker}
                              </p>
                              <p className="text-foreground">{entry.text}</p>
                            </div>
                          </div>
                          ))
                        ) : (
                          <p className="text-center text-muted-foreground py-8">
                            No transcript entries available for this interview.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground">
                    <FileText className="h-12 w-12 mb-4 opacity-30" />
                    <p className="mb-2">Select an interview from the list to view its transcript</p>
                    <p className="text-sm">Transcripts contain detailed conversation records and analysis</p>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  variant="outline"
                  disabled={!selectedSession || selectedSession.transcript_entries.length === 0}
                  onClick={() => {
                    if (selectedSession) {
                      toast.success("Transcript exported successfully");
                    }
                  }}
                >
                  Export Transcript
                </Button>
                <Button
                  disabled={!selectedSession || selectedSession.transcript_entries.length === 0}
                  onClick={() => {
                    if (selectedSession) {
                      toast.success("AI analysis in progress");
                    }
                  }}
                >
                  Generate AI Summary
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Transcripts;
