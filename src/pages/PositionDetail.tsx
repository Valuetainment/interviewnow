import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Star, Calendar, Building, Users, FileText, Award, Briefcase, CheckCircle, Gift, UserCheck } from 'lucide-react';
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
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';

const PositionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { tenantId } = useAuth();
  const [position, setPosition] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [competencies, setCompetencies] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("overview");

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Briefcase },
    { id: 'responsibilities', label: 'Responsibilities', icon: CheckCircle },
    { id: 'qualifications', label: 'Qualifications', icon: Award },
    { id: 'benefits', label: 'Benefits', icon: Gift },
    { id: 'candidates', label: 'Candidates', icon: UserCheck },
  ];

  // Parse the markdown description into sections
  const parseDescription = (description: string) => {
    if (!description) return {};
    
    const sections: any = {};
    const lines = description.split('\n');
    let currentSection = '';
    let currentContent: string[] = [];
    
    for (const line of lines) {
      // Check if this is a section header (starts with ##)
      if (line.startsWith('## ')) {
        // Save previous section if exists
        if (currentSection && currentContent.length > 0) {
          sections[currentSection] = currentContent.join('\n').trim();
        }
        // Start new section
        currentSection = line.replace('## ', '').trim();
        currentContent = [];
      } else if (line.startsWith('# ') && !currentSection) {
        // Handle main title
        sections.title = line.replace('# ', '').trim();
      } else {
        // Add to current section content
        currentContent.push(line);
      }
    }
    
    // Save last section
    if (currentSection && currentContent.length > 0) {
      sections[currentSection] = currentContent.join('\n').trim();
    }
    
    return sections;
  };

  // Fetch position and candidates from the database
  useEffect(() => {
    const fetchPosition = async () => {
      try {
        if (!id) return;
        
        console.log("Fetching position with ID:", id);
        
        // Fetch the position from the database with company info
        const { data: positionData, error: positionError } = await supabase
          .from('positions')
          .select(`
            *,
            companies (
              id,
              name
            )
          `)
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
          const formattedCompetencies = positionCompetencies
            .filter(pc => pc.competencies)
            .map(pc => ({
              id: pc.competencies.id,
              name: pc.competencies.name,
              description: pc.competencies.description,
              weight: pc.weight
            }));
          
          setCompetencies(formattedCompetencies);
        }
        
        // Fetch candidates for this position (from interview sessions)
        const { data: sessionsData, error: sessionsError } = await supabase
          .from('interview_sessions')
          .select(`
            *,
            candidates (
              id,
              full_name,
              email,
              skills,
              experience
            )
          `)
          .eq('position_id', id);

        if (sessionsError) {
          console.error('Error fetching candidates:', sessionsError);
        } else if (sessionsData) {
          // Transform the data to match the expected format
          const transformedCandidates = sessionsData
            .filter(session => session.candidates)
            .map(session => ({
              id: session.candidates.id,
              name: session.candidates.full_name,
              email: session.candidates.email,
              skills: session.candidates.skills || [],
              yearsOfExperience: 0, // Would need to calculate from experience
              matchScore: 0, // Would need actual scoring logic
              status: session.status === 'completed' ? 'Interviewed' : 
                     session.status === 'scheduled' ? 'Scheduled' : 'Pending Review',
              lastInterviewedAt: session.start_time ? new Date(session.start_time).toLocaleDateString() : 'Not scheduled'
            }));
          
          setCandidates(transformedCandidates);
        }
        
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
          {position.experience_level && (
            <Badge variant="outline" className="bg-purple-50">
              {position.experience_level}
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
          {position.companies?.name && (
            <Badge variant="outline" className="bg-amber-50 flex items-center gap-1">
              <Building className="h-3 w-3" /> {position.companies.name}
            </Badge>
          )}
          <Badge variant="outline" className="bg-slate-50 flex items-center gap-1">
            <Calendar className="h-3 w-3" /> Created {new Date(position.created_at).toLocaleDateString()}
          </Badge>
        </div>

        <Tabs defaultValue="overview" className="mb-6" onValueChange={setActiveTab} value={activeTab}>
          <TabsList>
            {tabs.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id}>
                <span className="flex items-center gap-2">
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overview" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Position Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  <section>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary</h3>
                    <div className="prose prose-gray max-w-none">
                      {position.description && (
                        <p className="text-gray-700 mb-4">{position.description}</p>
                      )}
                      {position.role_overview && (
                        <div className="text-gray-700">
                          <ReactMarkdown>
                            {position.role_overview}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>
                  </section>

                  <section>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Competencies</h3>
                    <div className="prose prose-gray max-w-none">
                      {position.key_competencies_section ? (
                        <div className="space-y-2">
                          {position.key_competencies_section.split('\n').map((item, index) => {
                            const trimmedItem = item.trim();
                            if (trimmedItem.startsWith('•')) {
                              return (
                                <div key={index} className="flex items-start">
                                  <span className="text-gray-500 mr-2">•</span>
                                  <span className="text-gray-700">{trimmedItem.substring(1).trim()}</span>
                                </div>
                              );
                            }
                            return trimmedItem ? <p key={index} className="text-gray-700">{trimmedItem}</p> : null;
                          })}
                        </div>
                      ) : (
                        <p className="text-gray-500 italic">No key competencies specified</p>
                      )}
                    </div>
                  </section>
                </div>
              </CardContent>
            </Card>
            
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

          <TabsContent value="responsibilities" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Key Responsibilities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-gray max-w-none">
                  {position.key_responsibilities ? (
                    <div className="space-y-2">
                      {position.key_responsibilities.split('\n').map((item, index) => {
                        const trimmedItem = item.trim();
                        if (trimmedItem.startsWith('•')) {
                          return (
                            <div key={index} className="flex items-start">
                              <span className="text-gray-500 mr-2">•</span>
                              <span className="text-gray-700">{trimmedItem.substring(1).trim()}</span>
                            </div>
                          );
                        }
                        return trimmedItem ? <p key={index} className="text-gray-700">{trimmedItem}</p> : null;
                      })}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">No responsibilities specified</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="qualifications" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Qualifications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  <section>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Required Qualifications</h3>
                    <div className="prose prose-gray max-w-none">
                      {position.required_qualifications ? (
                        <div className="space-y-2">
                          {position.required_qualifications.split('\n').map((item, index) => {
                            const trimmedItem = item.trim();
                            if (trimmedItem.startsWith('•')) {
                              return (
                                <div key={index} className="flex items-start">
                                  <span className="text-gray-500 mr-2">•</span>
                                  <span className="text-gray-700">{trimmedItem.substring(1).trim()}</span>
                                </div>
                              );
                            }
                            return trimmedItem ? <p key={index} className="text-gray-700">{trimmedItem}</p> : null;
                          })}
                        </div>
                      ) : (
                        <p className="text-gray-500 italic">No required qualifications specified</p>
                      )}
                    </div>
                  </section>

                  <section>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Preferred Qualifications</h3>
                    <div className="prose prose-gray max-w-none">
                      {position.preferred_qualifications ? (
                        <div className="space-y-2">
                          {position.preferred_qualifications.split('\n').map((item, index) => {
                            const trimmedItem = item.trim();
                            if (trimmedItem.startsWith('•')) {
                              return (
                                <div key={index} className="flex items-start">
                                  <span className="text-gray-500 mr-2">•</span>
                                  <span className="text-gray-700">{trimmedItem.substring(1).trim()}</span>
                                </div>
                              );
                            }
                            return trimmedItem ? <p key={index} className="text-gray-700">{trimmedItem}</p> : null;
                          })}
                        </div>
                      ) : (
                        <p className="text-gray-500 italic">No preferred qualifications specified</p>
                      )}
                    </div>
                  </section>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="benefits" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Benefits & Perks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-gray max-w-none">
                  {position.benefits ? (
                    <div className="space-y-2">
                      {position.benefits.split('\n').map((item, index) => {
                        const trimmedItem = item.trim();
                        if (trimmedItem.startsWith('•')) {
                          return (
                            <div key={index} className="flex items-start">
                              <span className="text-gray-500 mr-2">•</span>
                              <span className="text-gray-700">{trimmedItem.substring(1).trim()}</span>
                            </div>
                          );
                        }
                        return trimmedItem ? <p key={index} className="text-gray-700">{trimmedItem}</p> : null;
                      })}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">No benefits information available</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="candidates" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Candidates</CardTitle>
                <CardDescription>Candidates who have applied or been interviewed for this position</CardDescription>
              </CardHeader>
              <CardContent>
                {candidates.length > 0 ? (
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
                            <Link to={`/candidates/${candidate.id}`} className="text-primary hover:underline">
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
                ) : (
                  <p className="text-muted-foreground text-center py-8">No candidates have applied for this position yet.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
};

export default PositionDetail;
