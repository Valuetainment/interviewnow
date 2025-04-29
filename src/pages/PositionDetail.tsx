
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Star } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Mock position data
const mockPositions = [
  {
    id: '1',
    title: 'Senior Frontend Developer',
    department: 'Engineering',
    location: 'Remote',
    createdAt: '2025-03-12',
    status: 'Active',
    description: 'We are looking for an experienced Frontend Developer to join our engineering team. You will be responsible for building and maintaining our web applications, ensuring high performance and responsiveness.',
    requirements: [
      'At least 5 years of experience with JavaScript/TypeScript',
      'Proficiency with React and modern frontend frameworks',
      'Experience with responsive design and CSS frameworks',
      'Understanding of web performance optimization techniques',
      'Strong problem-solving skills and attention to detail'
    ]
  },
  // More positions would be here
];

// Mock candidates data with ranking
const mockCandidates = [
  {
    id: '1',
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    skills: ['React', 'TypeScript', 'CSS', 'Node.js'],
    yearsOfExperience: 6,
    matchScore: 92,
    status: 'Interviewed',
    lastInterviewedAt: '2025-04-12',
  },
  {
    id: '2',
    name: 'Michael Johnson',
    email: 'michael.j@example.com',
    skills: ['React', 'JavaScript', 'HTML/CSS', 'Vue'],
    yearsOfExperience: 5,
    matchScore: 87,
    status: 'Scheduled',
    lastInterviewedAt: '2025-04-18',
  },
  {
    id: '3',
    name: 'Sarah Williams',
    email: 'sarah.w@example.com',
    skills: ['Angular', 'TypeScript', 'React', 'AWS'],
    yearsOfExperience: 7,
    matchScore: 85,
    status: 'Pending Review',
    lastInterviewedAt: '2025-04-05',
  },
  {
    id: '4',
    name: 'David Brown',
    email: 'david.b@example.com',
    skills: ['React', 'Redux', 'JavaScript', 'GraphQL'],
    yearsOfExperience: 4,
    matchScore: 78,
    status: 'Interviewed',
    lastInterviewedAt: '2025-04-10',
  },
  {
    id: '5',
    name: 'Emily Davis',
    email: 'emily.d@example.com',
    skills: ['React Native', 'React', 'JavaScript', 'CSS'],
    yearsOfExperience: 3,
    matchScore: 72,
    status: 'Pending Review',
    lastInterviewedAt: '2025-04-08',
  },
];

const PositionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [position, setPosition] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch position and candidates
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const foundPosition = mockPositions.find(p => p.id === id);
      setPosition(foundPosition);
      setCandidates(mockCandidates.sort((a, b) => b.matchScore - a.matchScore)); // Sort by match score
      setLoading(false);
    }, 500);
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container max-w-6xl pt-24 pb-16 flex justify-center">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!position) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container max-w-6xl pt-24 pb-16 flex flex-col items-center">
          <p className="text-xl mb-4">Position not found</p>
          <Button asChild>
            <Link to="/positions">Back to Positions</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-6xl pt-24 pb-16">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="sm" asChild className="mr-2">
            <Link to="/positions">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">{position.title}</h1>
        </div>

        <Tabs defaultValue="overview" className="mb-6" onValueChange={setActiveTab} value={activeTab}>
          <TabsList>
            <TabsTrigger value="overview">Position Overview</TabsTrigger>
            <TabsTrigger value="candidates">Candidates</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4">
            <div className="grid gap-6 grid-cols-1">
              <Card>
                <CardHeader>
                  <CardTitle>Position Details</CardTitle>
                  <CardDescription>
                    {position.department} • {position.location} • Created on {position.createdAt}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-medium mb-2">Description</h3>
                      <p className="text-muted-foreground">{position.description}</p>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium mb-2">Requirements</h3>
                      <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                        {position.requirements.map((req: string, idx: number) => (
                          <li key={idx}>{req}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Summary</CardTitle>
                  <CardDescription>Current application statistics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-muted p-4 rounded-lg text-center">
                      <p className="text-3xl font-bold">{candidates.length}</p>
                      <p className="text-sm text-muted-foreground">Total Candidates</p>
                    </div>
                    <div className="bg-muted p-4 rounded-lg text-center">
                      <p className="text-3xl font-bold">{candidates.filter(c => c.status === 'Interviewed').length}</p>
                      <p className="text-sm text-muted-foreground">Interviewed</p>
                    </div>
                    <div className="bg-muted p-4 rounded-lg text-center">
                      <p className="text-3xl font-bold">{candidates.filter(c => c.matchScore > 85).length}</p>
                      <p className="text-sm text-muted-foreground">High Match</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="candidates" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Ranked Candidates</CardTitle>
                <CardDescription>Candidates are ordered by their match score</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Skills</TableHead>
                      <TableHead>Experience</TableHead>
                      <TableHead className="text-center">Match Score</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Interview</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {candidates.map((candidate) => (
                      <TableRow key={candidate.id} className="hover:cursor-pointer">
                        <TableCell className="font-medium">
                          <Link to={`/candidate/${candidate.id}`} className="text-primary hover:underline">
                            {candidate.name}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {candidate.skills.slice(0, 3).map((skill: string, idx: number) => (
                              <span 
                                key={idx} 
                                className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary"
                              >
                                {skill}
                              </span>
                            ))}
                            {candidate.skills.length > 3 && (
                              <span className="inline-flex items-center text-xs text-muted-foreground">
                                +{candidate.skills.length - 3} more
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{candidate.yearsOfExperience} years</TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center">
                            <span 
                              className={`font-medium ${candidate.matchScore > 85 ? 'text-green-600' : 
                                          candidate.matchScore > 75 ? 'text-amber-600' : 
                                          'text-muted-foreground'}`}
                            >
                              {candidate.matchScore}%
                            </span>
                            {candidate.matchScore > 85 && <Star size={14} className="ml-1 fill-green-500 text-green-500" />}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span 
                            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium
                              ${candidate.status === 'Interviewed' ? 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20' :
                                candidate.status === 'Scheduled' ? 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20' :
                                'bg-yellow-50 text-yellow-700 ring-1 ring-inset ring-yellow-600/20'}`}
                          >
                            {candidate.status}
                          </span>
                        </TableCell>
                        <TableCell>{candidate.lastInterviewedAt}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default PositionDetail;
