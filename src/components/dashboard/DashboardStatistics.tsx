
import React, { useState } from 'react';
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

// Mock data for statistics
const WEEKLY_INTERVIEWS = [
  { week: 'Week 1', value: 42 },
  { week: 'Week 2', value: 5 },
  { week: 'Week 3', value: 22 },
  { week: 'Week 4', value: 28 },
];

const SCORE_DISTRIBUTION = [
  { range: '1-2', count: 0 },
  { range: '3-4', count: 0 },
  { range: '5-6', count: 0 },
  { range: '7-8', count: 0 },
  { range: '9-10', count: 0 },
];

const STATUS_BREAKDOWN = [
  { name: 'Completed', value: 75 },
  { name: 'Scheduled', value: 15 },
  { name: 'Pending', value: 10 },
];

const POSITIONS = [
  { id: 'all', name: 'All Positions' },
  { id: 'fe', name: 'Frontend Engineer' },
  { id: 'be', name: 'Backend Engineer' },
  { id: 'fs', name: 'Full Stack Developer' },
  { id: 'dm', name: 'Digital Marketing' },
];

// Colors for the pie chart
const STATUS_COLORS = ['#10b981', '#3b82f6', '#f59e0b'];

const DashboardStatistics: React.FC = () => {
  const [selectedPosition, setSelectedPosition] = useState('all');
  
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
            {POSITIONS.map((position) => (
              <SelectItem key={position.id} value={position.id}>
                {position.name}
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
              <div className="text-3xl font-bold">353</div>
              <div className="ml-2 text-xs text-muted-foreground">Recent interviews</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Interview Duration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col">
              <div className="text-3xl font-bold">1 min</div>
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
              <div className="text-3xl font-bold">0</div>
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
              <div className="text-3xl font-bold">51%</div>
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
                data={WEEKLY_INTERVIEWS}
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
                data={SCORE_DISTRIBUTION}
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
                  data={STATUS_BREAKDOWN}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  fill="#8884d8"
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {STATUS_BREAKDOWN.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
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
            <CardTitle>Competency Scores by Position</CardTitle>
            <CardDescription>Average scores across different roles</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 h-80">
            <Select defaultValue="all">
              <SelectTrigger>
                <SelectValue placeholder="Select position" />
              </SelectTrigger>
              <SelectContent>
                {POSITIONS.map((position) => (
                  <SelectItem key={position.id} value={position.id}>
                    {position.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="flex items-center justify-center h-60 text-muted-foreground">
              No competency data available for this position
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardStatistics;
