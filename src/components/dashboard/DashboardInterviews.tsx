import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableHead, TableRow, TableBody, TableCell } from "@/components/ui/table";
import { Calendar, Eye, FileText, Search, Star } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const DashboardInterviews: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [interviews, setInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { tenantId } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (tenantId) {
      fetchInterviews();
    }
  }, [tenantId]);

  const fetchInterviews = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('interview_sessions')
        .select(`
          id,
          start_time,
          end_time,
          status,
          created_at,
          candidates (
            id,
            full_name,
            email
          ),
          positions (
            id,
            title
          )
        `)
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching interviews:', error);
      } else {
        setInterviews(data || []);
      }
    } catch (error) {
      console.error('Error fetching interviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return { date: null, time: null };
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', { 
        month: '2-digit', 
        day: '2-digit', 
        year: 'numeric' 
      }),
      time: date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      })
    };
  };

  const calculateDuration = (startTime: string | null, endTime: string | null) => {
    if (!startTime || !endTime) return 'N/A';
    const duration = new Date(endTime).getTime() - new Date(startTime).getTime();
    const minutes = Math.floor(duration / 60000);
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredInterviews = interviews.filter(interview => {
    const candidateName = interview.candidates?.full_name || '';
    const positionTitle = interview.positions?.title || '';
    return (
      candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      positionTitle.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });
  
  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading interviews...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Recent Interviews
            </CardTitle>
            <CardDescription>View and manage recent interview sessions</CardDescription>
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              className="pl-9" 
              placeholder="Search interviews..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Candidate</TableHead>
                <TableHead className="w-[250px]">Position</TableHead>
                <TableHead className="w-[180px]">Date & Time</TableHead>
                <TableHead className="w-[100px]">Duration</TableHead>
                <TableHead className="w-[120px]">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInterviews.length > 0 ? (
                filteredInterviews.map((interview) => {
                  const { date, time } = formatDateTime(interview.start_time);
                  const duration = calculateDuration(interview.start_time, interview.end_time);
                  
                  return (
                    <TableRow key={interview.id}>
                      <TableCell className="font-medium">
                        {interview.candidates?.full_name || 'Unknown Candidate'}
                      </TableCell>
                      <TableCell>{interview.positions?.title || 'Unknown Position'}</TableCell>
                      <TableCell>
                        {date ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>{date} at {time}</span>
                          </div>
                        ) : (
                          "Not scheduled"
                        )}
                      </TableCell>
                      <TableCell>{duration}</TableCell>
                      <TableCell>
                        <span 
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                          ${getStatusColor(interview.status)}`}
                        >
                          {interview.status.replace('_', ' ')}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => navigate(`/candidates/${interview.candidates?.id}`)}
                            disabled={!interview.candidates?.id}
                          >
                            <Eye className="h-4 w-4" />
                            <span className="ml-1">Profile</span>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => navigate(`/sessions/${interview.id}`)}
                          >
                            <FileText className="h-4 w-4" />
                            <span className="ml-1">Transcript</span>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            disabled={interview.status !== 'completed'}
                          >
                            <Star className="h-4 w-4" />
                            <span className="ml-1">Assessment</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No interviews found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default DashboardInterviews;
