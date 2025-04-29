
import React, { useState } from 'react';
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

// Mock data for interviews
const MOCK_INTERVIEWS = [
  { 
    id: 1, 
    candidate: "Ben Pappas", 
    position: "Digital Marketing Media Buyer", 
    date: null, 
    time: null, 
    duration: "N/A", 
    status: "Completed" 
  },
  { 
    id: 2, 
    candidate: "Ben Pappas", 
    position: "President", 
    date: "04/28/2025", 
    time: "09:03 AM", 
    duration: "1 min", 
    status: "Completed" 
  },
  { 
    id: 3, 
    candidate: "Ben Pappas", 
    position: "Backend Node Engineer", 
    date: null, 
    time: null, 
    duration: "N/A", 
    status: "Completed" 
  },
  { 
    id: 4, 
    candidate: "Ben Pappas", 
    position: "Cursor AI Engineer", 
    date: "04/28/2025", 
    time: "08:11 AM", 
    duration: "1 min", 
    status: "Completed" 
  },
  { 
    id: 5, 
    candidate: "Ben Pappas", 
    position: "Backend Node Engineer", 
    date: null, 
    time: null, 
    duration: "N/A", 
    status: "Completed" 
  }
];

const DashboardInterviews: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  
  const filteredInterviews = MOCK_INTERVIEWS.filter(interview => 
    interview.candidate.toLowerCase().includes(searchTerm.toLowerCase()) ||
    interview.position.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
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
                filteredInterviews.map((interview) => (
                  <TableRow key={interview.id}>
                    <TableCell className="font-medium">{interview.candidate}</TableCell>
                    <TableCell>{interview.position}</TableCell>
                    <TableCell>
                      {interview.date ? (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{interview.date} at {interview.time}</span>
                        </div>
                      ) : (
                        "Not scheduled"
                      )}
                    </TableCell>
                    <TableCell>{interview.duration}</TableCell>
                    <TableCell>
                      <span 
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${interview.status === "Completed" ? "bg-green-100 text-green-800" : 
                          interview.status === "Scheduled" ? "bg-blue-100 text-blue-800" : 
                          "bg-yellow-100 text-yellow-800"}`}
                      >
                        {interview.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                          <span className="ml-1">Profile</span>
                        </Button>
                        <Button variant="ghost" size="sm">
                          <FileText className="h-4 w-4" />
                          <span className="ml-1">Transcript</span>
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Star className="h-4 w-4" />
                          <span className="ml-1">Assessment</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
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
