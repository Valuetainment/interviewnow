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

const DashboardOverview: React.FC = () => {
  const navigate = useNavigate();

  // Mock data for recent activities
  const recentCandidates = [
    {
      candidate: { name: "Ben Pappas", initials: "BP" },
      action: "Completed interview",
      time: "2 hours ago",
      position: "Cursor AI Engineer",
      score: 8.5
    },
    {
      candidate: { name: "Sarah Johnson", initials: "SJ" },
      action: "Received invitation",
      time: "Yesterday",
      position: "Frontend Engineer"
    },
    {
      candidate: { name: "Alex Wong", initials: "AW" },
      action: "Resume uploaded",
      time: "3 days ago",
      position: "Backend Node Engineer"
    }
  ];

  // Mock data for upcoming interviews
  const upcomingInterviews = [
    {
      candidate: { name: "Maria Garcia", initials: "MG" },
      position: "Digital Marketing Media Buyer",
      time: "10:00 AM",
      date: "Tomorrow"
    },
    {
      candidate: { name: "John Smith", initials: "JS" },
      position: "Frontend Engineer",
      time: "2:30 PM",
      date: "May 15, 2025"
    }
  ];

  // Monthly interview stats
  const monthlyStats = [
    { month: 'Jan', count: 12 },
    { month: 'Feb', count: 18 },
    { month: 'Mar', count: 25 },
    { month: 'Apr', count: 32 },
    { month: 'May', count: 46 }
  ];

  return (
    <div className="space-y-8">
      {/* Top metrics */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard 
          title="Total Interviews" 
          value="353"
          description="All time interviews"
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
          trend={{
            value: "12%",
            direction: "up",
            label: "vs last month"
          }}
        />
        
        <MetricCard 
          title="Upcoming Interviews" 
          value="24"
          description="Next 7 days"
          icon={<Calendar className="h-4 w-4 text-muted-foreground" />}
        />
        
        <MetricCard 
          title="Avg. Duration" 
          value="32min"
          description="Completed interviews"
          icon={<Clock className="h-4 w-4 text-muted-foreground" />}
          trend={{
            value: "5min",
            direction: "down",
            label: "vs last month"
          }}
        />
        
        <MetricCard 
          title="Completion Rate" 
          value="86%"
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
              {recentCandidates.map((activity, index) => (
                <React.Fragment key={`${activity.candidate.name}-${index}`}>
                  <RecentCandidateActivity {...activity} />
                  {index < recentCandidates.length - 1 && <Separator />}
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
              {monthlyStats.map((stat) => (
                <div key={stat.month} className="flex flex-col items-center">
                  <div 
                    className="w-12 bg-primary rounded-t-sm" 
                    style={{ height: `${(stat.count / 46) * 200}px` }}
                  ></div>
                  <div className="mt-2 text-xs">{stat.month}</div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" onClick={() => navigate('/statistics')}>
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
              <div>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span>Frontend Engineer</span>
                  <span className="font-medium">48 interviews</span>
                </div>
                <Progress value={80} className="h-2" />
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span>Backend Node Engineer</span>
                  <span className="font-medium">36 interviews</span>
                </div>
                <Progress value={60} className="h-2" />
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span>Digital Marketing</span>
                  <span className="font-medium">24 interviews</span>
                </div>
                <Progress value={40} className="h-2" />
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span>Cursor AI Engineer</span>
                  <span className="font-medium">18 interviews</span>
                </div>
                <Progress value={30} className="h-2" />
              </div>
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
            {[1, 2, 3].map((item) => (
              <Card key={item} className="overflow-hidden">
                <div className="p-4">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <h4 className="text-sm font-medium">Ben Pappas</h4>
                      <p className="text-xs text-muted-foreground">Cursor AI Engineer</p>
                    </div>
                  </div>
                  <div className="mt-3 space-y-1">
                    <p className="text-xs text-muted-foreground">Duration: 32 minutes</p>
                    <p className="text-xs text-muted-foreground">Word count: 4,258</p>
                  </div>
                </div>
                <div className="bg-muted px-4 py-2 flex justify-between">
                  <span className="text-xs">Apr 28, 2025</span>
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