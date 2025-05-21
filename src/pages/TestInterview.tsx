import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from "sonner";
import { supabase, getCurrentTenantId } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { Json } from "@/integrations/supabase/types";

interface Candidate {
  id: string;
  full_name: string;
  email: string;
  skills?: string[] | null;
  resume_analysis?: Json | null;
}

interface Position {
  id: string;
  title: string;
  description: string | null;
  // Since competencies might not be directly available, we'll handle it in the code
}

interface Tenant {
  id: string;
  name: string;
}

const TestInterview = () => {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null);
  const [selectedTenant, setSelectedTenant] = useState<string | null>(null);
  const [isStartingInterview, setIsStartingInterview] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  
  // For skill matching logic - we'll store position competencies separately
  const [positionSkills, setPositionSkills] = useState<Record<string, string[]>>({});

  // Fetch tenant, candidate, and position data when component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setLoadingError(null);

        // Get current tenant ID to use as default
        console.log("Attempting to get current tenant ID...");
        const currentTenantId = await getCurrentTenantId();
        
        // Use a test tenant ID if not found - this is for development/testing only
        const testTenantId = "11111111-1111-1111-1111-111111111111";
        
        const effectiveTenantId = currentTenantId || testTenantId;
        console.log("Using tenant ID:", effectiveTenantId, currentTenantId ? "(from auth)" : "(fallback test ID)");
        
        if (!effectiveTenantId) {
          throw new Error("No tenant ID found and no fallback available");
        }

        // Fetch tenants - this should now work with our fixed RLS policies
        console.log("Fetching tenants from database...");
        const { data: tenantsData, error: tenantsError } = await supabase
          .from('tenants')
          .select('id, name');

        if (tenantsError) {
          console.error("Error fetching tenants:", tenantsError);
          // If we still have issues, fall back to the local approach
          console.log("Falling back to local tenant object");
          setTenants([{
            id: effectiveTenantId,
            name: currentTenantId ? "Your Company" : "Test Company"
          }]);
        } else {
          console.log("Successfully fetched tenants:", tenantsData?.length || 0);
          // If we have no tenants, add our test tenant to the list
          if (!tenantsData || tenantsData.length === 0) {
            console.log("No tenants found, adding test tenant");
            setTenants([{
              id: testTenantId,
              name: "Test Tenant (Auto-added)"
            }]);
          } else {
            setTenants(tenantsData);
          }
        }
        
        // Set default tenant based on current auth context
        if (effectiveTenantId) {
          setSelectedTenant(effectiveTenantId);
        }
        
        // Fetch candidates for the current tenant
        const { data: candidatesData, error: candidatesError } = await supabase
          .from('candidates')
          .select('id, full_name, email, skills, resume_analysis')
          .eq('tenant_id', effectiveTenantId);

        if (candidatesError) throw new Error(`Error fetching candidates: ${candidatesError.message}`);
        console.log("Fetched candidates:", candidatesData?.length || 0);

        // Fetch positions for the current tenant
        const { data: positionsData, error: positionsError } = await supabase
          .from('positions')
          .select('id, title, description')
          .eq('tenant_id', effectiveTenantId);

        if (positionsError) throw new Error(`Error fetching positions: ${positionsError.message}`);
        console.log("Fetched positions:", positionsData?.length || 0);
        
        // Process candidates data
        const processedCandidates = candidatesData?.map(candidate => {
          // Extract skills from resume_analysis if available
          let candidateSkills = candidate.skills || [];
          
          // Safely extract skills from resume_analysis
          if (!candidateSkills.length && candidate.resume_analysis) {
            // Check if resume_analysis is an object and has a skills property
            if (typeof candidate.resume_analysis === 'object' && 
                candidate.resume_analysis !== null &&
                'skills' in candidate.resume_analysis) {
              const skills = (candidate.resume_analysis as Record<string, unknown>).skills;
              if (Array.isArray(skills)) {
                candidateSkills = skills;
              }
            }
          }
          
          return {
            ...candidate,
            skills: candidateSkills
          };
        }) || [];
        
        setCandidates(processedCandidates);
        setPositions(positionsData || []);

        // For simplicity, we'll use static competencies for each position
        // In a real implementation, you would fetch this from your database
        const skills: Record<string, string[]> = {};
        positionsData?.forEach(position => {
          // This is a mock implementation - in reality, fetch actual competencies for each position
          skills[position.id] = [
            'JavaScript', 'TypeScript', 'React', 'Node.js', 'SQL'
          ];
        });
        setPositionSkills(skills);

        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoadingError(error instanceof Error ? error.message : 'Unknown error loading data');
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleStartInterview = async () => {
    if (!selectedCandidate || !selectedPosition || !selectedTenant) {
      toast.error('Please select a candidate, position, and tenant');
      return;
    }

    try {
      setIsStartingInterview(true);

      // Create a session record in the database
      const { data: sessionData, error: sessionError } = await supabase
        .from('interview_sessions')
        .insert({
          tenant_id: selectedTenant,
          candidate_id: selectedCandidate,
          position_id: selectedPosition,
          status: 'scheduled',
          start_time: new Date().toISOString()
        })
        .select('id')
        .single();

      if (sessionError) {
        throw new Error(`Error creating interview session: ${sessionError.message}`);
      }

      // Use the real session ID if available, or create a test ID if not
      const sessionId = sessionData?.id || `test-${Date.now()}`;

      setIsStartingInterview(false);
      toast.success('Interview created successfully!');
      
      // Navigate to the full WebRTC test page with real session details
      navigate(`/test/full?session=${sessionId}&candidate=${selectedCandidate}&position=${selectedPosition}&tenant=${selectedTenant}`);
    } catch (error) {
      console.error('Error starting interview:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to start interview');
      setIsStartingInterview(false);
    }
  };

  // Get the selected entities for display
  const candidate = selectedCandidate ? candidates.find(c => c.id === selectedCandidate) : null;
  const position = selectedPosition ? positions.find(p => p.id === selectedPosition) : null;
  const tenant = selectedTenant ? tenants.find(t => t.id === selectedTenant) : null;

  // Calculate skill match if both candidate and position are selected
  const getSkillMatch = () => {
    if (!candidate || !position || !selectedPosition) return null;
    
    // Get the competencies/skills for this position from our state
    const requiredSkills = positionSkills[selectedPosition] || [];
    
    // Find matching skills (case insensitive)
    const candidateSkills = candidate.skills || [];
    const matchedSkills = candidateSkills.filter(skill => 
      requiredSkills.some(req => req.toLowerCase() === skill.toLowerCase())
    );
    
    return {
      matchedCount: matchedSkills.length,
      totalRequired: requiredSkills.length,
      matchPercentage: requiredSkills.length === 0 ? 0 : 
        Math.round((matchedSkills.length / requiredSkills.length) * 100)
    };
  };

  const skillMatch = getSkillMatch();

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-grow container mx-auto px-4 py-24 md:py-32 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-lg">Loading interview data...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Error state
  if (loadingError) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-grow container mx-auto px-4 py-24 md:py-32 flex items-center justify-center">
          <div className="text-center">
            <div className="bg-destructive/10 text-destructive p-6 rounded-lg max-w-md">
              <h3 className="text-xl font-bold mb-2">Error Loading Data</h3>
              <p>{loadingError}</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => window.location.reload()}
              >
                Try Again
              </Button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex-grow container mx-auto px-4 py-24 md:py-32">
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold">Test Interview Session</h1>
            <Button 
              size="lg"
              onClick={handleStartInterview} 
              disabled={!selectedCandidate || !selectedPosition || !selectedTenant || isStartingInterview}
              className="px-8"
            >
              {isStartingInterview ? 'Starting...' : 'Start Interview'}
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
            {/* Tenant Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Select Company/Tenant</CardTitle>
                <CardDescription>
                  Choose the company for this interview
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Select 
                  value={selectedTenant || undefined}
                  onValueChange={setSelectedTenant}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a company" />
                  </SelectTrigger>
                  <SelectContent>
                    {tenants.map(tenant => (
                      <SelectItem key={tenant.id} value={tenant.id}>
                        {tenant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {tenant && (
                  <div className="mt-6 space-y-4">
                    <div className="border rounded-md p-4">
                      <h3 className="font-semibold text-lg">{tenant.name}</h3>
                      <p className="text-sm text-muted-foreground">Tenant ID: {tenant.id}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Candidate Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Select Candidate</CardTitle>
                <CardDescription>
                  Choose a candidate to interview
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Select 
                  value={selectedCandidate || undefined}
                  onValueChange={setSelectedCandidate}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a candidate" />
                  </SelectTrigger>
                  <SelectContent>
                    {candidates.length === 0 ? (
                      <SelectItem value="no-candidates" disabled>No candidates available</SelectItem>
                    ) : (
                      candidates.map(candidate => (
                        <SelectItem key={candidate.id} value={candidate.id}>
                          {candidate.full_name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                
                {candidate && (
                  <div className="mt-6 space-y-4">
                    <div className="border rounded-md p-4">
                      <h3 className="font-semibold text-lg">{candidate.full_name}</h3>
                      <p className="text-sm text-muted-foreground">{candidate.email}</p>
                      {candidate.skills && candidate.skills.length > 0 && (
                        <div className="mt-2">
                          <h4 className="text-sm font-medium">Skills:</h4>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {candidate.skills.map((skill, index) => (
                              <span 
                                key={index} 
                                className="bg-primary/10 text-primary px-2 py-1 rounded-md text-xs"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Position Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Select Position</CardTitle>
                <CardDescription>
                  Choose a position for the interview
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Select 
                  value={selectedPosition || undefined}
                  onValueChange={setSelectedPosition}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a position" />
                  </SelectTrigger>
                  <SelectContent>
                    {positions.length === 0 ? (
                      <SelectItem value="no-positions" disabled>No positions available</SelectItem>
                    ) : (
                      positions.map(position => (
                        <SelectItem key={position.id} value={position.id}>
                          {position.title}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                
                {position && selectedPosition && (
                  <div className="mt-6 space-y-4">
                    <div className="border rounded-md p-4">
                      <h3 className="font-semibold text-lg">{position.title}</h3>
                      {position.description && (
                        <p className="text-sm text-muted-foreground mt-1">{position.description}</p>
                      )}
                      {positionSkills[selectedPosition] && positionSkills[selectedPosition].length > 0 && (
                        <div className="mt-2">
                          <h4 className="text-sm font-medium">Required Skills:</h4>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {positionSkills[selectedPosition].map((skill, index) => (
                              <span 
                                key={index} 
                                className="bg-secondary/10 text-secondary px-2 py-1 rounded-md text-xs"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {candidate && position && selectedPosition && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Interview Compatibility</CardTitle>
                <CardDescription>
                  Analysis of candidate compatibility with the selected position
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Skill Match</TableHead>
                        <TableHead>Experience</TableHead>
                        <TableHead>Recommended Topics</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>
                          <div className="flex items-center">
                            <span className="font-medium">{skillMatch?.matchPercentage || 0}%</span>
                            <span className="text-sm text-muted-foreground ml-2">
                              ({skillMatch?.matchedCount || 0}/{skillMatch?.totalRequired || 0} skills)
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            Candidate has {candidate.skills?.length || 0} relevant skills
                          </span>
                        </TableCell>
                        <TableCell>
                          <ul className="list-disc list-inside text-sm">
                            {positionSkills[selectedPosition]?.map((skill, index) => (
                              <li key={index}>
                                {skill} {candidate.skills?.some(s => s.toLowerCase() === skill.toLowerCase()) ? '✓' : ''}
                              </li>
                            ))}
                          </ul>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
              <CardFooter className="flex justify-center">
                <Button 
                  size="lg"
                  onClick={handleStartInterview} 
                  disabled={!selectedCandidate || !selectedPosition || !selectedTenant || isStartingInterview}
                  className="px-12"
                >
                  {isStartingInterview ? 'Starting...' : 'Start Interview Now'}
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default TestInterview;
