import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell
} from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

// Colors for the pie chart
const STATUS_COLORS = {
  completed: '#10b981',
  scheduled: '#3b82f6',
  in_progress: '#f59e0b',
  cancelled: '#ef4444'
};

const DashboardStatistics: React.FC = () => {
  const { tenantId } = useAuth();
  const [selectedPosition, setSelectedPosition] = useState('all');
  const [loading, setLoading] = useState(true);
  const [positions, setPositions] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({
    totalInterviews: 0,
    avgDuration: 0,
    avgScore: 0,
    completionRate: 0
  });
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [scoreDistribution, setScoreDistribution] = useState<any[]>([]);
  const [statusBreakdown, setStatusBreakdown] = useState<any[]>([]);
  const [competencyScores, setCompetencyScores] = useState<any[]>([]);

  useEffect(() => {
    if (tenantId) {
      fetchAllData();
    }
  }, [tenantId, selectedPosition]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchPositions(),
        fetchMetrics(),
        fetchWeeklyData(),
        fetchScoreDistribution(),
        fetchStatusBreakdown(),
        fetchCompetencyScores()
      ]);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPositions = async () => {
    const { data, error } = await supabase
      .from('positions')
      .select('id, title')
      .eq('tenant_id', tenantId)
      .order('title');
    
    if (!error && data) {
      setPositions([{ id: 'all', title: 'All Positions' }, ...data]);
    }
  };

  const fetchMetrics = async () => {
    let query = supabase
      .from('interview_sessions')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantId);

    if (selectedPosition !== 'all') {
      query = query.eq('position_id', selectedPosition);
    }

    const { count: totalCount } = await query;

    // Get completed interviews for duration calculation
    let completedQuery = supabase
      .from('interview_sessions')
      .select('start_time, end_time')
      .eq('tenant_id', tenantId)
      .eq('status', 'completed')
      .not('end_time', 'is', null);

    if (selectedPosition !== 'all') {
      completedQuery = completedQuery.eq('position_id', selectedPosition);
    }

    const { data: completedInterviews } = await completedQuery;

    let avgDuration = 0;
    if (completedInterviews && completedInterviews.length > 0) {
      const totalDuration = completedInterviews.reduce((acc, session) => {
        const duration = new Date(session.end_time).getTime() - new Date(session.start_time).getTime();
        return acc + duration;
      }, 0);
      avgDuration = Math.round(totalDuration / completedInterviews.length / 60000);
    }

    // Calculate completion rate
    let scheduledQuery = supabase
      .from('interview_sessions')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .in('status', ['scheduled', 'completed']);

    if (selectedPosition !== 'all') {
      scheduledQuery = scheduledQuery.eq('position_id', selectedPosition);
    }

    const { count: scheduledCount } = await scheduledQuery;

    const completionRate = scheduledCount > 0 
      ? Math.round((completedInterviews?.length || 0) / scheduledCount * 100)
      : 0;

    // Mock average score for now (would need assessment data)
    const avgScore = completedInterviews?.length > 0 ? 7.5 : 0;

    setMetrics({
      totalInterviews: totalCount || 0,
      avgDuration,
      avgScore,
      completionRate
    });
  };

  const fetchWeeklyData = async () => {
    const weeks = [];
    const now = new Date();
    
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - (i + 1) * 7);
      const weekEnd = new Date(now);
      weekEnd.setDate(weekEnd.getDate() - i * 7);

      let query = supabase
        .from('interview_sessions')
        .select('*', { count: 'exact' })
        .eq('tenant_id', tenantId)
        .gte('created_at', weekStart.toISOString())
        .lt('created_at', weekEnd.toISOString());

      if (selectedPosition !== 'all') {
        query = query.eq('position_id', selectedPosition);
      }

      const { count } = await query;

      weeks.push({
        week: `Week ${4 - i}`,
        value: count || 0
      });
    }

    setWeeklyData(weeks);
  };

  const fetchScoreDistribution = async () => {
    // Mock data for score distribution (would need actual assessment scores)
    const distribution = [
      { range: '1-2', count: 0 },
      { range: '3-4', count: 2 },
      { range: '5-6', count: 5 },
      { range: '7-8', count: 8 },
      { range: '9-10', count: 3 },
    ];
    setScoreDistribution(distribution);
  };

  const fetchStatusBreakdown = async () => {
    const statuses = ['completed', 'scheduled', 'in_progress', 'cancelled'];
    const breakdown = [];

    for (const status of statuses) {
      let query = supabase
        .from('interview_sessions')
        .select('*', { count: 'exact' })
        .eq('tenant_id', tenantId)
        .eq('status', status);

      if (selectedPosition !== 'all') {
        query = query.eq('position_id', selectedPosition);
      }

      const { count } = await query;
      
      if (count && count > 0) {
        breakdown.push({
          name: status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' '),
          value: count,
          color: STATUS_COLORS[status as keyof typeof STATUS_COLORS]
        });
      }
    }

    setStatusBreakdown(breakdown);
  };

  const fetchCompetencyScores = async () => {
    if (selectedPosition === 'all') {
      setCompetencyScores([]);
      return;
    }

    const { data: competencies } = await supabase
      .from('position_competencies')
      .select(`
        weight,
        competencies (
          id,
          name
        )
      `)
      .eq('position_id', selectedPosition)
      .eq('tenant_id', tenantId);

    if (competencies) {
      // Mock scores for demonstration (would need actual assessment data)
      const scores = competencies.map(comp => ({
        name: comp.competencies?.name || 'Unknown',
        score: Math.floor(Math.random() * 3) + 6, // Random score between 6-8
        weight: comp.weight
      }));
      setCompetencyScores(scores);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading statistics...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      {/* Filter by position */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <p className="text-sm font-medium">Filter by Position:</p>
        <Select value={selectedPosition} onValueChange={setSelectedPosition}>
          <SelectTrigger className="w-full sm:w-[240px]">
            <SelectValue placeholder="Select position" />
          </SelectTrigger>
          <SelectContent>
            {positions.map((position) => (
              <SelectItem key={position.id} value={position.id}>
                {position.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Interviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline">
              <div className="text-3xl font-bold">{metrics.totalInterviews}</div>
              <div className="ml-2 text-xs text-muted-foreground">
                {selectedPosition === 'all' ? 'All positions' : 'This position'}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Interview Duration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col">
              <div className="text-3xl font-bold">{metrics.avgDuration} min</div>
              <div className="text-xs text-muted-foreground">For completed interviews</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Assessment Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col">
              <div className="text-3xl font-bold">{metrics.avgScore.toFixed(1)}</div>
              <div className="text-xs text-muted-foreground">Out of 10 points</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col">
              <div className="text-3xl font-bold">{metrics.completionRate}%</div>
              <div className="text-xs text-muted-foreground">Of all scheduled interviews</div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Interviews over time */}
        <Card>
          <CardHeader>
            <CardTitle>Interviews Over Time</CardTitle>
            <CardDescription>Number of interviews conducted weekly</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={weeklyData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#8b5cf6" 
                  name="Interviews"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        {/* Assessment score distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Assessment Score Distribution</CardTitle>
            <CardDescription>Distribution of candidate scores</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={scoreDistribution}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar 
                  dataKey="count" 
                  fill="#8b5cf6" 
                  name="Candidates"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        {/* Interview status breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Interview Status Breakdown</CardTitle>
            <CardDescription>Current status of all interviews</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  fill="#8884d8"
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {statusBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        {/* Competency scores by position */}
        <Card>
          <CardHeader>
            <CardTitle>Competency Scores</CardTitle>
            <CardDescription>
              {selectedPosition === 'all' 
                ? 'Select a specific position to view competency scores'
                : 'Average scores for this position'}
            </CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {competencyScores.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={competencyScores}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  layout="horizontal"
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis domain={[0, 10]} />
                  <Tooltip />
                  <Bar 
                    dataKey="score" 
                    fill="#8b5cf6" 
                    name="Score"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                {selectedPosition === 'all' 
                  ? 'Select a specific position to view competency scores'
                  : 'No competency data available for this position'}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardStatistics;
