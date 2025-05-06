import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Star, Calendar, Building, Users } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

// Mock position data with enhanced fields
const mockPositions = [
  {
    id: '1',
    title: 'Senior Frontend Developer',
    company: 'Acme Corp',
    department: 'Engineering',
    location: 'Remote',
    experienceLevel: 'Senior',
    createdAt: '2025-03-12',
    status: 'Active',
    role_overview: 'We are seeking an experienced Frontend Developer to join our engineering team. In this role, you will be responsible for building high-quality user interfaces for our web applications using modern JavaScript frameworks and libraries.',
    key_responsibilities: '- Develop responsive and interactive user interfaces\n- Write clean, maintainable, and well-documented code\n- Collaborate with UX designers to implement modern UI/UX patterns\n- Work with backend developers to integrate REST APIs\n- Participate in code reviews and mentor junior developers\n- Optimize applications for maximum speed and scalability',
    required_qualifications: '- 5+ years experience with JavaScript/TypeScript\n- Strong proficiency with React and modern frontend frameworks\n- Experience with responsive design and CSS frameworks\n- Understanding of web performance optimization techniques\n- Strong problem-solving skills and attention to detail',
    preferred_qualifications: '- Experience with Next.js and server-side rendering\n- Knowledge of GraphQL and Apollo Client\n- Experience with state management libraries (Redux, MobX, Zustand)\n- Understanding of CI/CD pipelines and deployment strategies\n- Open source contributions',
    benefits: '- Competitive salary and equity package\n- Flexible remote work policy\n- Comprehensive health, dental, and vision insurance\n- Unlimited PTO policy\n- Professional development budget\n- Regular team retreats',
    key_competencies_section: 'The ideal candidate will excel in front-end architecture, performance optimization, and collaborative development practices.'
  }
];

// Mock candidates with ranking
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
  }
];

// Mock competencies with weights
const mockCompetencies = [
  { id: '1', name: 'Technical Knowledge', description: 'Depth of technical skills and expertise related to the role', weight: 30 },
  { id: '2', name: 'Problem Solving', description: 'Ability to identify, analyze, and solve complex problems', weight: 25 },
  { id: '3', name: 'Communication Skills', description: 'Ability to communicate effectively both written and verbally', weight: 20 },
  { id: '4', name: 'Teamwork', description: 'Ability to collaborate effectively with others', weight: 15 },
  { id: '5', name: 'Leadership', description: 'Ability to guide and influence others', weight: 10 }
];

const PositionDetail2 = () => {
  const { id } = useParams<{ id: string }>();
  const { tenantId } = useAuth();
  const [position, setPosition] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [competencies, setCompetencies] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch position and candidates from the database
  useEffect(() => {
    const fetchPosition = async () => {
      try {
        if (!id) return;
        
        console.log("Fetching position with ID:", id);
        
        // Fetch the position from the database
        const { data: positionData, error: positionError } = await supabase
          .from('positions')
          .select('*')
          .eq('id', id)
          .single();
          
        if (positionError) {
          console.error("Error fetching position:", positionError);
          setLoadError("Failed to load position data");
          setPosition(null);
          setLoading(false);
          return;
        }
        
        console.log("Position data:", positionData);
        
        if (!positionData) {
          setLoadError("Position not found");
          setPosition(null);
          setLoading(false);
          return;
        }
        
        setPosition(positionData);
        
        // Fetch related competencies
        const { data: positionCompetencies, error: compError } = await supabase
          .from('position_competencies')
          .select(`
            weight,
            competencies:competency_id(id, name, description)
          `)
          .eq('position_id', id);
          
        if (compError) {
          console.error("Error fetching competencies:", compError);
        } else if (positionCompetencies && positionCompetencies.length > 0) {
          // Transform the data to match expected format
          const formattedCompetencies = positionCompetencies.map(pc => ({
            id: pc.competencies.id,
            name: pc.competencies.name,
            description: pc.competencies.description,
            weight: pc.weight
          }));
          
          setCompetencies(formattedCompetencies);
        } else {
          // Fallback to mock data if no competencies found
          setCompetencies(mockCompetencies);
        }
        
        // For now, just use mock candidates data
        setCandidates(mockCandidates.sort((a, b) => b.matchScore - a.matchScore));
        
      } catch (error) {
        console.error("Unexpected error fetching position:", error);
        setLoadError("An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    };
    
    fetchPosition();
  }, [id, tenantId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container max-w-6xl pt-24 pb-16 flex justify-center">
          <p>Loading position details...</p>
        </div>
      </div>
    );
  }

  if (!position) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container max-w-6xl pt-24 pb-16 flex flex-col items-center">
          <p className="text-xl mb-4">{loadError || "Position not found"}</p>
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

        <div className="flex flex-wrap gap-2 mb-6">
          {position.experienceLevel && (
            <Badge variant="outline" className="bg-purple-50">
              {position.experienceLevel}
            </Badge>
          )}
          {position.department && (
            <Badge variant="outline" className="bg-blue-50">
              {position.department}
            </Badge>
          )}
          {position.location && (
            <Badge variant="outline" className="bg-green-50">
              {position.location}
            </Badge>
          )}
          {position.company && (
            <Badge variant="outline" className="bg-amber-50 flex items-center gap-1">
              <Building className="h-3 w-3" /> {position.company}
            </Badge>
          )}
          <Badge variant="outline" className="bg-slate-50 flex items-center gap-1">
            <Calendar className="h-3 w-3" /> Created {position.createdAt}
          </Badge>
        </div>

        <Tabs defaultValue="overview" className="mb-6" onValueChange={setActiveTab} value={activeTab}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="competencies">Competencies</TabsTrigger>
            <TabsTrigger value="candidates">Candidates</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Role Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <p>{position.role_overview}</p>
                </div>
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Key Responsibilities</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <div className="whitespace-pre-wrap">{position.key_responsibilities}</div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Required Qualifications</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <div className="whitespace-pre-wrap">{position.required_qualifications}</div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Applications Summary</CardTitle>
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
          </TabsContent>

          <TabsContent value="details" className="mt-4">
            <div className="grid gap-6 grid-cols-1">
              <Card>
                <CardHeader>
                  <CardTitle>Preferred Qualifications</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <div className="whitespace-pre-wrap">{position.preferred_qualifications}</div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Benefits & Perks</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <div className="whitespace-pre-wrap">{position.benefits}</div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Key Competencies Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <p>{position.key_competencies_section}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="competencies" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Competency Weights</CardTitle>
                <CardDescription>Required competencies and their importance for this position</CardDescription>
              </CardHeader>
              <CardContent>
                {competencies.length > 0 ? (
                  <div className="space-y-6">
                    {competencies.map(comp => (
                      <div key={comp.id} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <h3 className="font-medium">{comp.name}</h3>
                          <span className="font-medium text-primary">{comp.weight}%</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{comp.description}</p>
                        <div className="w-full bg-muted rounded-full h-2.5">
                          <div 
                            className="bg-primary h-2.5 rounded-full" 
                            style={{ width: `${comp.weight}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                    
                    <div className="flex justify-between items-center pt-4 border-t">
                      <span className="font-medium">Total</span>
                      <span className="font-medium text-primary">100%</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No competencies defined for this position.</p>
                )}
              </CardContent>
            </Card>
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
                            {candidate.skills.slice(0, 3).map((skill, idx) => (
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

export default PositionDetail2; 