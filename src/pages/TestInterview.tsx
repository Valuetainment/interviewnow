
import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from "sonner";

// Mock data for candidates and positions
const MOCK_CANDIDATES = [
  { id: 1, name: 'John Doe', email: 'john@example.com', skills: ['React', 'TypeScript', 'Node.js'] },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', skills: ['Python', 'Django', 'AWS'] },
  { id: 3, name: 'Robert Johnson', email: 'robert@example.com', skills: ['Angular', 'Java', 'Spring Boot'] }
];

const MOCK_POSITIONS = [
  { id: 1, title: 'Senior Frontend Developer', requiredSkills: ['React', 'TypeScript', 'Redux'] },
  { id: 2, title: 'Backend Engineer', requiredSkills: ['Node.js', 'MongoDB', 'Express'] },
  { id: 3, title: 'Full Stack Developer', requiredSkills: ['React', 'Node.js', 'PostgreSQL'] }
];

const TestInterview = () => {
  const [selectedCandidate, setSelectedCandidate] = useState<number | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<number | null>(null);
  const [isStartingInterview, setIsStartingInterview] = useState(false);

  const handleStartInterview = () => {
    if (!selectedCandidate || !selectedPosition) {
      toast.error('Please select both a candidate and a position');
      return;
    }

    // In a real implementation, we would navigate to the interview room
    // or set up the interview session here
    setIsStartingInterview(true);

    // Simulate API call
    setTimeout(() => {
      setIsStartingInterview(false);
      toast.success('Interview prepared successfully!');
      
      // Mock interview preparation - in a real app, we would redirect to the interview room
      toast.info('Redirecting to interview room...', {
        duration: 2000,
      });
    }, 2000);
  };

  const candidate = selectedCandidate ? MOCK_CANDIDATES.find(c => c.id === selectedCandidate) : null;
  const position = selectedPosition ? MOCK_POSITIONS.find(p => p.id === selectedPosition) : null;

  const getSkillMatch = () => {
    if (!candidate || !position) return null;
    
    const matchedSkills = candidate.skills.filter(skill => 
      position.requiredSkills.includes(skill)
    );
    
    return {
      matchedCount: matchedSkills.length,
      totalRequired: position.requiredSkills.length,
      matchPercentage: Math.round((matchedSkills.length / position.requiredSkills.length) * 100)
    };
  };

  const skillMatch = getSkillMatch();

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex-grow container mx-auto px-4 py-24 md:py-32">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold mb-8">Test Interview Session</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Select Candidate</CardTitle>
                <CardDescription>
                  Choose a candidate to interview
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Select 
                  onValueChange={(value) => setSelectedCandidate(Number(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a candidate" />
                  </SelectTrigger>
                  <SelectContent>
                    {MOCK_CANDIDATES.map(candidate => (
                      <SelectItem key={candidate.id} value={candidate.id.toString()}>
                        {candidate.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {candidate && (
                  <div className="mt-6 space-y-4">
                    <div className="border rounded-md p-4">
                      <h3 className="font-semibold text-lg">{candidate.name}</h3>
                      <p className="text-sm text-muted-foreground">{candidate.email}</p>
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
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Select Position</CardTitle>
                <CardDescription>
                  Choose a position for the interview
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Select 
                  onValueChange={(value) => setSelectedPosition(Number(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a position" />
                  </SelectTrigger>
                  <SelectContent>
                    {MOCK_POSITIONS.map(position => (
                      <SelectItem key={position.id} value={position.id.toString()}>
                        {position.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {position && (
                  <div className="mt-6 space-y-4">
                    <div className="border rounded-md p-4">
                      <h3 className="font-semibold text-lg">{position.title}</h3>
                      <div className="mt-2">
                        <h4 className="text-sm font-medium">Required Skills:</h4>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {position.requiredSkills.map((skill, index) => (
                            <span 
                              key={index} 
                              className="bg-secondary/10 text-secondary px-2 py-1 rounded-md text-xs"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {candidate && position && (
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
                            <span className="font-medium">{skillMatch?.matchPercentage}%</span>
                            <span className="text-sm text-muted-foreground ml-2">
                              ({skillMatch?.matchedCount}/{skillMatch?.totalRequired} skills)
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            Candidate has {candidate.skills.length} relevant skills
                          </span>
                        </TableCell>
                        <TableCell>
                          <ul className="list-disc list-inside text-sm">
                            {position.requiredSkills.map((skill, index) => (
                              <li key={index}>
                                {skill} {candidate.skills.includes(skill) ? '✓' : ''}
                              </li>
                            ))}
                          </ul>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button 
                  onClick={handleStartInterview} 
                  disabled={!selectedCandidate || !selectedPosition || isStartingInterview}
                >
                  {isStartingInterview ? 'Preparing...' : 'Start Interview'}
                </Button>
              </CardFooter>
            </Card>
          )}
          
          <Card>
            <CardHeader>
              <CardTitle>Interview Settings</CardTitle>
              <CardDescription>
                Configure the interview parameters
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Interview Duration</label>
                    <Select defaultValue="30">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="45">45 minutes</SelectItem>
                        <SelectItem value="60">60 minutes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Difficulty Level</label>
                    <Select defaultValue="medium">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                        <SelectItem value="expert">Expert</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Interview Mode</label>
                  <Select defaultValue="ai_interviewer">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ai_interviewer">AI Interviewer</SelectItem>
                      <SelectItem value="human_assisted">Human-Assisted</SelectItem>
                      <SelectItem value="questions_only">Questions Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default TestInterview;
