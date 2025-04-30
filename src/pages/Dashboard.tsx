import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Activity, 
  Calendar, 
  ChevronRight, 
  LayoutDashboard, 
  Mail, 
  Plus, 
  PlusCircle, 
  UserPlus, 
  Users,
  FileText,
  BriefcaseBusiness,
  Clock,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DashboardInterviews from '@/components/dashboard/DashboardInterviews';
import DashboardInvitations from '@/components/dashboard/DashboardInvitations';
import DashboardStatistics from '@/components/dashboard/DashboardStatistics';
import DashboardOverview from '@/components/dashboard/DashboardOverview';

const RecentActivityItem = ({ icon, title, description, time, status }: { 
  icon: React.ReactNode, 
  title: string, 
  description: string,
  time: string,
  status?: 'success' | 'pending' | 'failed'
}) => (
  <div className="flex items-start space-x-4 py-3">
    <div className="rounded-full bg-muted p-2">
      {icon}
    </div>
    <div className="flex-1 space-y-1">
      <p className="text-sm font-medium">{title}</p>
      <p className="text-sm text-muted-foreground">{description}</p>
      <div className="flex items-center pt-1">
        <Clock className="mr-1 h-3 w-3 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">{time}</span>
        {status && (
          <div className="ml-2 flex items-center">
            {status === 'success' && <CheckCircle2 className="mr-1 h-3 w-3 text-green-500" />}
            {status === 'pending' && <Clock className="mr-1 h-3 w-3 text-yellow-500" />}
            {status === 'failed' && <XCircle className="mr-1 h-3 w-3 text-red-500" />}
            <span className={`text-xs ${
              status === 'success' ? 'text-green-500' : 
              status === 'pending' ? 'text-yellow-500' : 'text-red-500'
            }`}>
              {status === 'success' ? 'Completed' : 
               status === 'pending' ? 'Pending' : 'Failed'}
            </span>
          </div>
        )}
      </div>
    </div>
  </div>
);

const QuickStatCard = ({ icon, title, value, description, trend }: {
  icon: React.ReactNode,
  title: string,
  value: string,
  description: string,
  trend?: {
    value: string,
    up?: boolean
  }
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">
        {title}
      </CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className="flex items-baseline justify-between">
        <div className="text-3xl font-bold">{value}</div>
        {trend && (
          <div className={`ml-2 text-xs ${trend.up ? 'text-green-500' : 'text-red-500'}`}>
            {trend.up ? '↑' : '↓'} {trend.value}
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground mt-1">{description}</p>
    </CardContent>
  </Card>
);

const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const navigate = useNavigate();

  // Mock data for recent activities
  const recentActivities = [
    {
      icon: <Users className="h-4 w-4" />,
      title: "Ben Pappas completed the Cursor AI Engineer interview",
      description: "The assessment has been generated with a score of 8.5/10",
      time: "2 hours ago",
      status: 'success' as const
    },
    {
      icon: <Mail className="h-4 w-4" />,
      title: "Interview invitation sent to Sarah Johnson",
      description: "For the position of Frontend Engineer",
      time: "Yesterday",
      status: 'pending' as const
    },
    {
      icon: <BriefcaseBusiness className="h-4 w-4" />,
      title: "New position created: Digital Marketing Media Buyer",
      description: "With 7 competencies defined",
      time: "2 days ago"
    },
    {
      icon: <FileText className="h-4 w-4" />,
      title: "Resume uploaded for Alex Wong",
      description: "For the Backend Node Engineer position",
      time: "3 days ago"
    }
  ];

  return (
    <div className="flex-1 space-y-6 p-6 md:p-8">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex items-center space-x-2">
          <Button onClick={() => navigate('/companies/new')}>
            <Plus className="mr-2 h-4 w-4" />
            New Company
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-muted/40 w-full justify-start border-b pb-px mb-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="interviews" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>Interviews</span>
          </TabsTrigger>
          <TabsTrigger value="invitations" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            <span>Invitations</span>
          </TabsTrigger>
          <TabsTrigger value="statistics" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            <span>Statistics</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <DashboardOverview />
        </TabsContent>
        
        <TabsContent value="interviews">
          <DashboardInterviews />
        </TabsContent>
        
        <TabsContent value="invitations">
          <DashboardInvitations />
        </TabsContent>
        
        <TabsContent value="statistics">
          <DashboardStatistics />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
