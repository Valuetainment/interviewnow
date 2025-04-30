import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
  Calendar,
  Clock,
  Filter,
  MoreHorizontal,
  Plus,
  Search,
  User,
  Video,
  Briefcase,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

interface InvitationStatus {
  id: string;
  status: 'pending' | 'sent' | 'accepted' | 'expired';
}

interface InterviewSession {
  id: string;
  candidate: {
    id: string;
    full_name: string;
    email: string;
  };
  position: {
    id: string;
    title: string;
  };
  start_time: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  invitation: InvitationStatus[];
}

const SessionList: React.FC = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;
  
  // Fetch sessions on component mount
  useEffect(() => {
    fetchSessions();
  }, [currentPage, statusFilter]);
  
  const fetchSessions = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('interview_sessions')
        .select(`
          id,
          candidate:candidate_id (id, full_name, email),
          position:position_id (id, title),
          start_time,
          status,
          invitation:interview_invitations (id, status)
        `)
        .order('start_time', { ascending: false })
        .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1);
      
      // Apply status filter if not 'all'
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      
      const { data, error, count } = await query;
      
      if (error) throw error;
      
      // Cast to the correct type
      const typedData = data as unknown as InterviewSession[];
      setSessions(typedData);
      
      // Calculate total pages based on count
      if (count !== null) {
        setTotalPages(Math.ceil(count / itemsPerPage));
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast.error('Failed to load interview sessions');
    } finally {
      setLoading(false);
    }
  };
  
  const handleCreateSession = () => {
    navigate('/create-session');
  };
  
  const handleViewSession = (id: string) => {
    navigate(`/sessions/${id}`);
  };
  
  const handleStartInterview = (id: string) => {
    navigate(`/interview-room/${id}`);
  };
  
  const handleCancelSession = async (id: string) => {
    try {
      await supabase
        .from('interview_sessions')
        .update({ status: 'cancelled' })
        .eq('id', id);
      
      toast.success('Interview session cancelled');
      fetchSessions();
    } catch (error) {
      console.error('Error cancelling session:', error);
      toast.error('Failed to cancel session');
    }
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge className="bg-blue-500">Scheduled</Badge>;
      case 'in_progress':
        return <Badge className="bg-green-500">In Progress</Badge>;
      case 'completed':
        return <Badge className="bg-gray-500">Completed</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-500">Cancelled</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };
  
  const getInvitationStatus = (session: InterviewSession) => {
    if (!session.invitation || session.invitation.length === 0) {
      return <Badge variant="outline">Not Invited</Badge>;
    }
    
    const invitation = session.invitation[0];
    switch (invitation.status) {
      case 'pending':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-500">Pending</Badge>;
      case 'sent':
        return <Badge variant="outline" className="border-blue-500 text-blue-500">Sent</Badge>;
      case 'accepted':
        return <Badge variant="outline" className="border-green-500 text-green-500">Accepted</Badge>;
      case 'expired':
        return <Badge variant="outline" className="border-gray-500 text-gray-500">Expired</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };
  
  // Filter sessions by search term
  const filteredSessions = sessions.filter((session) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      session.candidate.full_name.toLowerCase().includes(searchLower) ||
      session.candidate.email.toLowerCase().includes(searchLower) ||
      session.position.title.toLowerCase().includes(searchLower)
    );
  });
  
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Interview Sessions</CardTitle>
            <CardDescription>
              Manage your scheduled and completed interview sessions
            </CardDescription>
          </div>
          <Button onClick={handleCreateSession} className="mt-4 md:mt-0">
            <Plus className="mr-2 h-4 w-4" />
            New Session
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-6 flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0 md:space-x-4">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search candidates or positions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-[300px]"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Candidate</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Scheduled For</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Invitation</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSessions.length > 0 ? (
                    filteredSessions.map((session) => (
                      <TableRow key={session.id}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{session.candidate.full_name}</p>
                              <p className="text-sm text-muted-foreground">{session.candidate.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Briefcase className="h-4 w-4 text-muted-foreground" />
                            <span>{session.position.title}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span>{format(new Date(session.start_time), 'dd MMM yyyy')}</span>
                            </div>
                            <div className="flex items-center space-x-2 mt-1">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span>{format(new Date(session.start_time), 'HH:mm')}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(session.status)}</TableCell>
                        <TableCell>{getInvitationStatus(session)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleViewSession(session.id)}>
                                View Details
                              </DropdownMenuItem>
                              {session.status === 'scheduled' && (
                                <>
                                  <DropdownMenuItem onClick={() => handleStartInterview(session.id)}>
                                    <Video className="mr-2 h-4 w-4" />
                                    Start Interview
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleCancelSession(session.id)}>
                                    Cancel Session
                                  </DropdownMenuItem>
                                </>
                              )}
                              {session.status === 'in_progress' && (
                                <DropdownMenuItem onClick={() => handleStartInterview(session.id)}>
                                  <Video className="mr-2 h-4 w-4" />
                                  Join Interview
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center h-32">
                        <div className="flex flex-col items-center justify-center p-4">
                          <Calendar className="h-8 w-8 text-muted-foreground mb-2" />
                          <p className="text-lg font-medium">No sessions found</p>
                          <p className="text-sm text-muted-foreground">
                            {searchTerm ? 'Try a different search term' : 'Create your first interview session'}
                          </p>
                          {!searchTerm && (
                            <Button onClick={handleCreateSession} className="mt-4">
                              <Plus className="mr-2 h-4 w-4" />
                              New Session
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            
            {totalPages > 1 && (
              <div className="flex items-center justify-center space-x-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <div className="text-sm">
                  Page {currentPage} of {totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default SessionList; 