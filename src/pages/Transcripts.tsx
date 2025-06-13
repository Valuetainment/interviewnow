import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from "sonner";
import { FileText, Search, Calendar, Clock, List } from 'lucide-react';

// Mock data for completed interviews
const MOCK_INTERVIEWS = [
  { 
    id: "int-001", 
    candidate: "John Doe", 
    position: "Senior Frontend Developer", 
    date: "2025-04-25", 
    duration: "45 minutes", 
    status: "Completed",
    score: 85,
    transcript: [
      { speaker: "Interviewer", text: "Could you explain your experience with React?", timestamp: "00:01:23" },
      { speaker: "John Doe", text: "I've been working with React for over 5 years, building large-scale applications with Redux for state management and React Query for data fetching.", timestamp: "00:01:45" },
      { speaker: "Interviewer", text: "What's your approach to component testing?", timestamp: "00:03:12" },
      { speaker: "John Doe", text: "I prefer using React Testing Library for component tests as it encourages testing from a user's perspective rather than implementation details.", timestamp: "00:03:30" },
    ]
  },
  { 
    id: "int-002", 
    candidate: "Jane Smith", 
    position: "Backend Engineer", 
    date: "2025-04-26", 
    duration: "30 minutes", 
    status: "Completed",
    score: 92,
    transcript: [
      { speaker: "Interviewer", text: "What's your experience with microservices?", timestamp: "00:00:45" },
      { speaker: "Jane Smith", text: "I've designed and implemented microservices architectures using Node.js and Docker, focusing on service boundaries and communication patterns.", timestamp: "00:01:10" },
      { speaker: "Interviewer", text: "How do you approach API design?", timestamp: "00:04:22" },
      { speaker: "Jane Smith", text: "I follow REST principles while being pragmatic. I focus on clear resource naming, proper use of HTTP methods, and comprehensive documentation with OpenAPI.", timestamp: "00:04:55" },
    ]
  },
  { 
    id: "int-003", 
    candidate: "Robert Johnson", 
    position: "Full Stack Developer", 
    date: "2025-04-27", 
    duration: "60 minutes", 
    status: "Completed",
    score: 78,
    transcript: [
      { speaker: "Interviewer", text: "Can you describe a challenging project you worked on recently?", timestamp: "00:02:10" },
      { speaker: "Robert Johnson", text: "I recently led the migration of a monolithic application to a microservices architecture, which involved breaking down the system into manageable services while ensuring continuous delivery.", timestamp: "00:02:45" },
      { speaker: "Interviewer", text: "How do you handle state management in complex React applications?", timestamp: "00:08:30" },
      { speaker: "Robert Johnson", text: "For complex apps, I use a combination of context API for global state, React Query for server state, and local state for component-specific concerns.", timestamp: "00:09:12" },
    ]
  }
];

const Transcripts: React.FC = () => {
  const [selectedInterview, setSelectedInterview] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  
  const filteredInterviews = MOCK_INTERVIEWS.filter(interview => {
    const matchesSearch = 
      interview.candidate.toLowerCase().includes(searchTerm.toLowerCase()) || 
      interview.position.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === "all" || interview.status.toLowerCase() === filterStatus.toLowerCase();
    
    return matchesSearch && matchesStatus;
  });
  
  const selectedInterviewData = selectedInterview 
    ? MOCK_INTERVIEWS.find(interview => interview.id === selectedInterview) 
    : null;

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
                  {filteredInterviews.length > 0 ? (
                    filteredInterviews.map((interview) => (
                      <div 
                        key={interview.id}
                        onClick={() => setSelectedInterview(interview.id)}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedInterview === interview.id 
                            ? 'border-primary bg-primary/5' 
                            : 'hover:border-primary/50'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-medium">{interview.candidate}</h3>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            interview.score >= 85 ? 'bg-green-100 text-green-800' :
                            interview.score >= 70 ? 'bg-amber-100 text-amber-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            Score: {interview.score}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{interview.position}</p>
                        <div className="flex gap-2 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar size={12} /> {interview.date}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={12} /> {interview.duration}
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
                  {selectedInterviewData 
                    ? `${selectedInterviewData.candidate} - ${selectedInterviewData.position}` 
                    : 'Transcript Details'}
                </CardTitle>
                <CardDescription>
                  {selectedInterviewData 
                    ? `${selectedInterviewData.date} | ${selectedInterviewData.duration}` 
                    : 'Select an interview to view transcript'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedInterviewData ? (
                  <div className="space-y-6">
                    {/* Summary */}
                    <div className="bg-muted p-4 rounded-lg mb-6">
                      <h3 className="font-medium mb-2">Interview Summary</h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Candidate:</p>
                          <p className="font-medium">{selectedInterviewData.candidate}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Position:</p>
                          <p className="font-medium">{selectedInterviewData.position}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Date:</p>
                          <p>{selectedInterviewData.date}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Duration:</p>
                          <p>{selectedInterviewData.duration}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Score:</p>
                          <p className={`font-medium ${
                            selectedInterviewData.score >= 85 ? 'text-green-600' :
                            selectedInterviewData.score >= 70 ? 'text-amber-600' :
                            'text-red-600'
                          }`}>
                            {selectedInterviewData.score}/100
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Transcript */}
                    <div>
                      <h3 className="font-medium mb-4 flex items-center gap-2">
                        <List className="h-4 w-4" />
                        Transcript
                      </h3>
                      
                      <div className="space-y-6">
                        {selectedInterviewData.transcript.map((entry, index) => (
                          <div key={index} className="flex gap-4">
                            <div className="w-24 flex-shrink-0 text-xs text-muted-foreground pt-1">
                              {entry.timestamp}
                            </div>
                            <div className="flex-grow">
                              <p className={`text-sm font-medium mb-1 ${
                                entry.speaker === "Interviewer" 
                                  ? "text-primary" 
                                  : "text-foreground"
                              }`}>
                                {entry.speaker}
                              </p>
                              <p className="text-foreground">{entry.text}</p>
                            </div>
                          </div>
                        ))}
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
                  disabled={!selectedInterviewData}
                  onClick={() => {
                    if (selectedInterviewData) {
                      toast.success("Transcript exported successfully");
                    }
                  }}
                >
                  Export Transcript
                </Button>
                <Button
                  disabled={!selectedInterviewData}
                  onClick={() => {
                    if (selectedInterviewData) {
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
