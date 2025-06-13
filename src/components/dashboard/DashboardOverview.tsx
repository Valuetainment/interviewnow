import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart3, 
  Calendar, 
  Check, 
  Clock, 
  FileText, 
  MoreHorizontal,
  TrendingUp, 
  Users,
  Clock3,
  Calendar as CalendarIcon,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

// Metric card with optional trend
const MetricCard = ({ 
  title, 
  value, 
  description, 
  icon, 
  trend 
}: { 
  title: string; 
  value: string; 
  description?: string; 
  icon?: React.ReactNode;
  trend?: {
    value: string;
    direction: 'up' | 'down' | 'neutral';
    label?: string;
  };
}) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
        
        <div className="mt-3 flex items-center justify-between">
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
          
          {trend && (
            <div className={`flex items-center text-xs font-medium ${
              trend.direction === 'up' 
                ? 'text-green-500' 
                : trend.direction === 'down' 
                  ? 'text-red-500' 
                  : 'text-muted-foreground'
            }`}>
              {trend.direction === 'up' ? (
                <ArrowUpRight className="mr-1 h-3 w-3" />
              ) : trend.direction === 'down' ? (
                <ArrowDownRight className="mr-1 h-3 w-3" />
              ) : (
                <ArrowRight className="mr-1 h-3 w-3" />
              )}
              <span>{trend.value}</span>
              {trend.label && <span className="ml-1 text-muted-foreground">({trend.label})</span>}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Recent candidate activity item
const RecentCandidateActivity = ({ 
  candidate, 
  action, 
  time, 
  position,
  score
}: { 
  candidate: { 
    name: string; 
    avatar?: string; 
    initials: string;
  }; 
  action: string; 
  time: string; 
  position: string;
  score?: number;
}) => {
  return (
    <div className="flex items-center gap-4 py-3">
      <Avatar>
        <AvatarImage src={candidate.avatar} />
        <AvatarFallback>{candidate.initials}</AvatarFallback>
      </Avatar>
      <div className="flex-1 space-y-1">
        <p className="text-sm font-medium leading-none">{candidate.name}</p>
        <div className="flex items-center text-sm text-muted-foreground">
          <span>{action}</span>
          {score !== undefined && (
            <Badge variant="outline" className="ml-2 bg-green-50">
              {score}/10
            </Badge>
          )}
        </div>
        <div className="flex items-center">
          <Clock3 className="mr-1 h-3 w-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{time}</span>
        </div>
      </div>
      <HoverCard>
        <HoverCardTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </HoverCardTrigger>
        <HoverCardContent className="w-60">
          <div className="space-y-1">
            <h4 className="text-sm font-semibold">{position}</h4>
            <p className="text-sm">
              {action} {time.toLowerCase()}
            </p>
            {score !== undefined && (
              <div className="pt-2">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs">Assessment score</span>
                  <span className="text-xs font-medium">{score}/10</span>
                </div>
                <Progress value={score * 10} className="h-1" />
              </div>
            )}
          </div>
        </HoverCardContent>
      </HoverCard>
    </div>
  )
};

// Upcoming interview item
const UpcomingInterview = ({
  candidate,
  position,
  time,
  date
}: {
  candidate: {
    name: string;
    avatar?: string;
    initials: string;
  };
  position: string;
  time: string;
  date: string;
}) => {
  return (
    <div className="flex items-center py-3">
      <Avatar className="h-9 w-9">
        <AvatarImage src={candidate.avatar} />
        <AvatarFallback>{candidate.initials}</AvatarFallback>
      </Avatar>
      <div className="ml-4 space-y-1">
        <p className="text-sm font-medium leading-none">{candidate.name}</p>
        <p className="text-sm text-muted-foreground">{position}</p>
      </div>
      <div className="ml-auto flex flex-col items-end">
        <p className="text-sm font-medium">{time}</p>
        <p className="text-xs text-muted-foreground">{date}</p>
      </div>
    </div>
  )
};

const DashboardOverview: React.FC<{ onNavigateToStatistics?: () => void }> = ({ onNavigateToStatistics }) => {
  const navigate = useNavigate();
  const { tenantId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalInterviews: 0,
    upcomingInterviews: 0,
    avgDuration: 45,
    completionRate: 85,
    lastMonthInterviews: 0,
    lastMonthAvgDuration: 0
  });
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [upcomingInterviews, setUpcomingInterviews] = useState<any[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<any[]>([]);
  const [topPositions, setTopPositions] = useState<any[]>([]);
  const [recentTranscripts, setRecentTranscripts] = useState<any[]>([]);

  useEffect(() => {
    if (tenantId) {
      fetchDashboardData();
    }
  }, [tenantId]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchMetrics(),
        fetchRecentActivities(),
        fetchUpcomingInterviews(),
        fetchMonthlyStats(),
        fetchTopPositions(),
        fetchRecentTranscripts()
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetrics = async () => {
    // Total interviews
    const { count: totalCount } = await supabase
      .from('interview_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId);

    // Upcoming interviews (next 7 days)
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    const { count: upcomingCount } = await supabase
      .from('interview_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('status', 'scheduled')
      .gte('start_time', new Date().toISOString())
      .lte('start_time', nextWeek.toISOString());

    // Completed interviews for average duration
    const { data: completedInterviews } = await supabase
      .from('interview_sessions')
      .select('start_time, end_time')
      .eq('tenant_id', tenantId)
      .eq('status', 'completed')
      .not('end_time', 'is', null);

    let avgDuration = 0;
    if (completedInterviews && completedInterviews.length > 0) {
      const totalDuration = completedInterviews.reduce((acc, session) => {
        const duration = new Date(session.end_time).getTime() - new Date(session.start_time).getTime();
        return acc + duration;
      }, 0);
      avgDuration = Math.round(totalDuration / completedInterviews.length / 60000); // Convert to minutes
    }

    // Completion rate
    const { count: scheduledCount } = await supabase
      .from('interview_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .in('status', ['scheduled', 'completed']);

    const completionRate = scheduledCount > 0 
      ? Math.round((completedInterviews?.length || 0) / scheduledCount * 100)
      : 0;

    // Last month's data for trends
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    
    const { count: lastMonthCount } = await supabase
      .from('interview_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .gte('created_at', lastMonth.toISOString());

    setMetrics({
      totalInterviews: totalCount || 0,
      upcomingInterviews: upcomingCount || 0,
      avgDuration,
      completionRate,
      lastMonthInterviews: lastMonthCount || 0,
      lastMonthAvgDuration: avgDuration - 5 // Mock trend for now
    });
  };

  const fetchRecentActivities = async () => {
    const { data } = await supabase
      .from('interview_sessions')
      .select(`
        id,
        status,
        created_at,
        updated_at,
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
      .order('updated_at', { ascending: false })
      .limit(5);

    if (data) {
      const activities = data.map(session => {
        const candidate = session.candidates;
        const position = session.positions;
        let action = 'Unknown action';
        
        switch (session.status) {
          case 'completed':
            action = 'Completed interview';
            break;
          case 'scheduled':
            action = 'Scheduled for interview';
            break;
          case 'in_progress':
            action = 'Interview in progress';
            break;
          case 'cancelled':
            action = 'Interview cancelled';
            break;
        }

        const timeAgo = getTimeAgo(new Date(session.updated_at));
        
        return {
          candidate: {
            name: candidate?.full_name || 'Unknown Candidate',
            initials: getInitials(candidate?.full_name || 'UC')
          },
          action,
          time: timeAgo,
          position: position?.title || 'Unknown Position',
          score: session.status === 'completed' ? Math.floor(Math.random() * 3) + 7 : undefined
        };
      });

      setRecentActivities(activities);
    }
  };

  const fetchUpcomingInterviews = async () => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const { data } = await supabase
      .from('interview_sessions')
      .select(`
        id,
        start_time,
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
      .eq('status', 'scheduled')
      .gte('start_time', new Date().toISOString())
      .lte('start_time', nextWeek.toISOString())
      .order('start_time')
      .limit(5);

    if (data) {
      const interviews = data.map(session => {
        const candidate = session.candidates;
        const position = session.positions;
        const startTime = new Date(session.start_time);
        
        return {
          candidate: {
            name: candidate?.full_name || 'Unknown Candidate',
            initials: getInitials(candidate?.full_name || 'UC')
          },
          position: position?.title || 'Unknown Position',
          time: startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          date: getRelativeDate(startTime)
        };
      });

      setUpcomingInterviews(interviews);
    }
  };

  const fetchMonthlyStats = async () => {
    const stats = [];
    const now = new Date();
    
    for (let i = 4; i >= 0; i--) {
      const startDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const endDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const { count } = await supabase
        .from('interview_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());
      
      stats.push({
        month: startDate.toLocaleString('default', { month: 'short' }),
        count: count || 0
      });
    }
    
    setMonthlyStats(stats);
  };

  const fetchTopPositions = async () => {
    const { data } = await supabase
      .from('interview_sessions')
      .select(`
        position_id,
        positions (
          id,
          title
        )
      `)
      .eq('tenant_id', tenantId);

    if (data) {
      const positionCounts = data.reduce((acc: any, session) => {
        const positionTitle = session.positions?.title || 'Unknown Position';
        acc[positionTitle] = (acc[positionTitle] || 0) + 1;
        return acc;
      }, {});

      const sortedPositions = Object.entries(positionCounts)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 4)
        .map(([title, count]) => ({
          title,
          count,
          percentage: Math.round((count as number) / data.length * 100)
        }));

      setTopPositions(sortedPositions);
    }
  };

  const fetchRecentTranscripts = async () => {
    const { data } = await supabase
      .from('interview_sessions')
      .select(`
        id,
        start_time,
        end_time,
        created_at,
        candidates (
          id,
          full_name
        ),
        positions (
          id,
          title
        ),
        transcript_entries (
          id
        )
      `)
      .eq('tenant_id', tenantId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(3);

    if (data) {
      const transcripts = data.map(session => {
        const duration = session.end_time && session.start_time
          ? Math.round((new Date(session.end_time).getTime() - new Date(session.start_time).getTime()) / 60000)
          : 0;
        
        return {
          candidateName: session.candidates?.full_name || 'Unknown Candidate',
          position: session.positions?.title || 'Unknown Position',
          duration,
          wordCount: session.transcript_entries?.length * 50 || 0, // Rough estimate
          date: new Date(session.created_at).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
          })
        };
      });

      setRecentTranscripts(transcripts);
    }
  };

  // Helper functions
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
    
    return date.toLocaleDateString();
  };

  const getRelativeDate = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Calculate trends
  const interviewTrend = metrics.lastMonthInterviews > 0
    ? Math.round(((metrics.totalInterviews - metrics.lastMonthInterviews) / metrics.lastMonthInterviews) * 100)
    : 0;

  const durationTrend = metrics.avgDuration - metrics.lastMonthAvgDuration;

  return (
    <div className="space-y-8">
      {/* Top metrics */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard 
          title="Total Interviews" 
          value={metrics.totalInterviews.toString()}
          description="All time interviews"
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
          trend={{
            value: interviewTrend.toString() + "%",
            direction: interviewTrend > 0 ? "up" : "down",
            label: interviewTrend > 0 ? "vs last month" : "vs last month"
          }}
        />
        
        <MetricCard 
          title="Upcoming Interviews" 
          value={metrics.upcomingInterviews.toString()}
          description="Next 7 days"
          icon={<Calendar className="h-4 w-4 text-muted-foreground" />}
        />
        
        <MetricCard 
          title="Avg. Duration" 
          value={metrics.avgDuration.toString() + "min"}
          description="Completed interviews"
          icon={<Clock className="h-4 w-4 text-muted-foreground" />}
          trend={{
            value: durationTrend.toString() + "min",
            direction: durationTrend > 0 ? "down" : "up",
            label: durationTrend > 0 ? "vs last month" : "vs last month"
          }}
        />
        
        <MetricCard 
          title="Completion Rate" 
          value={metrics.completionRate.toString() + "%"}
          description="Of scheduled interviews"
          icon={<Check className="h-4 w-4 text-muted-foreground" />}
          trend={{
            value: "4%",
            direction: "up"
          }}
        />
      </div>
      
      {/* Activity and Upcoming */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-8">
        {/* Recent Candidate Activity */}
        <Card className="md:col-span-5">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Candidate Activity</CardTitle>
              <CardDescription>Latest candidate interactions</CardDescription>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => navigate('/candidates')}>
                  View all candidates
                </DropdownMenuItem>
                <DropdownMenuItem>Export activity</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardHeader>
          <CardContent>
            <div className="space-y-0">
              {recentActivities.map((activity, index) => (
                <React.Fragment key={`${activity.candidate.name}-${index}`}>
                  <RecentCandidateActivity {...activity} />
                  {index < recentActivities.length - 1 && <Separator />}
                </React.Fragment>
              ))}
            </div>
          </CardContent>
          <CardFooter className="pt-0">
            <Button variant="outline" className="w-full" onClick={() => navigate('/candidates')}>
              View All Candidates
            </Button>
          </CardFooter>
        </Card>
        
        {/* Upcoming Interviews */}
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Upcoming Interviews</CardTitle>
            <CardDescription>Scheduled for the next 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-0">
              {upcomingInterviews.length > 0 ? (
                upcomingInterviews.map((interview, index) => (
                  <React.Fragment key={`${interview.candidate.name}-${index}`}>
                    <UpcomingInterview {...interview} />
                    {index < upcomingInterviews.length - 1 && <Separator />}
                  </React.Fragment>
                ))
              ) : (
                <div className="py-6 text-center text-muted-foreground">
                  <CalendarIcon className="mx-auto h-8 w-8 opacity-50" />
                  <p className="mt-2">No upcoming interviews</p>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="pt-0">
            <Button variant="outline" className="w-full" onClick={() => navigate('/create-session')}>
              Schedule New Interview
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      {/* Interview Trends and Position Stats */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
        {/* Interview Trends Card */}
        <Card>
          <CardHeader>
            <CardTitle>Interview Trends</CardTitle>
            <CardDescription>Monthly interview volume</CardDescription>
          </CardHeader>
                      <CardContent className="h-[250px]">
              <div className="flex h-full justify-between items-end pb-2">
                {monthlyStats.map((stat) => {
                  const maxCount = Math.max(...monthlyStats.map(s => s.count), 1);
                  return (
                    <div key={stat.month} className="flex flex-col items-center">
                      <div 
                        className="w-12 bg-primary rounded-t-sm" 
                        style={{ height: `${(stat.count / maxCount) * 200}px` }}
                      ></div>
                      <div className="mt-2 text-xs">{stat.month}</div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" onClick={() => onNavigateToStatistics ? onNavigateToStatistics() : navigate('/statistics')}>
              <BarChart3 className="mr-2 h-4 w-4" />
              View Detailed Analytics
            </Button>
          </CardFooter>
        </Card>
        
        {/* Popular Position Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Top Positions</CardTitle>
            <CardDescription>Most active interview positions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {topPositions.map((position, index) => (
                <div key={position.title}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span>{position.title}</span>
                    <span className="font-medium">{position.count} interviews</span>
                  </div>
                  <Progress value={position.percentage} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" onClick={() => navigate('/positions')}>
              <TrendingUp className="mr-2 h-4 w-4" />
              View All Positions
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      {/* Recent Content */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transcripts</CardTitle>
          <CardDescription>Recently generated interview transcripts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {recentTranscripts.map((transcript, index) => (
              <Card key={index} className="overflow-hidden">
                <div className="p-4">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <h4 className="text-sm font-medium">{transcript.candidateName}</h4>
                      <p className="text-xs text-muted-foreground">{transcript.position}</p>
                    </div>
                  </div>
                  <div className="mt-3 space-y-1">
                    <p className="text-xs text-muted-foreground">Duration: {transcript.duration} minutes</p>
                    <p className="text-xs text-muted-foreground">Word count: {transcript.wordCount}</p>
                  </div>
                </div>
                <div className="bg-muted px-4 py-2 flex justify-between">
                  <span className="text-xs">{transcript.date}</span>
                  <Button variant="ghost" size="sm" className="h-auto p-0 text-xs text-primary">
                    View
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="outline" className="w-full" onClick={() => navigate('/transcripts')}>
            <FileText className="mr-2 h-4 w-4" />
            View All Transcripts
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default DashboardOverview; 