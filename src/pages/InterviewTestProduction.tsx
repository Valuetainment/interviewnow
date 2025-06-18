import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { supabase, getCurrentTenantId } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useToast } from '@/hooks/use-toast';
import { formatFullName } from '@/lib/utils';

// Define proper types for our data
interface Candidate {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
}

interface Position {
  id: string;
  title: string;
  description?: string;
}

const InterviewTestProduction = () => {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  // Fetch candidates and positions on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch candidates
        const { data: candidatesData, error: candidatesError } = await supabase
          .from('candidates')
          .select('id, first_name, last_name, email');

        if (candidatesError) throw candidatesError;
        setCandidates(candidatesData || []);

        // Fetch positions
        const { data: positionsData, error: positionsError } = await supabase
          .from('positions')
          .select('id, title, description');

        if (positionsError) throw positionsError;
        setPositions(positionsData || []);

        setLoadingData(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load candidates or positions');
        setLoadingData(false);
      }
    };

    fetchData();
  }, []);

  const handleStartInterview = async () => {
    if (!selectedCandidate || !selectedPosition) {
      toast.error('Please select both a candidate and a position');
      return;
    }

    setLoading(true);
    try {
      // Get the current tenant ID
      const tenantId = await getCurrentTenantId();
      if (!tenantId) {
        throw new Error('Tenant ID not found');
      }

      // Create a temporary interview session for testing
      const { data: session, error } = await supabase
        .from('interview_sessions')
        .insert({
          tenant_id: tenantId,
          candidate_id: selectedCandidate,
          position_id: selectedPosition,
          status: 'in_progress',
          start_time: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (error) throw error;

      // Navigate to the interview room with session ID - fixed path to match App.tsx
      navigate(`/interview-room/${session.id}`);
    } catch (error) {
      console.error('Error creating interview session:', error);
      toast.error('Failed to create interview session');
      setLoading(false);
    }
  };

  const selectedCandidateData = selectedCandidate 
    ? candidates.find(c => c.id === selectedCandidate)
    : null;
    
  const selectedPositionData = selectedPosition
    ? positions.find(p => p.id === selectedPosition)
    : null;

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex-grow container mx-auto px-4 py-24 md:py-32">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold mb-8">Production Interview Test</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Select Candidate</CardTitle>
                <CardDescription>
                  Choose a candidate to interview
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingData ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <>
                    <Select 
                      onValueChange={(value) => setSelectedCandidate(value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a candidate" />
                      </SelectTrigger>
                      <SelectContent>
                        {candidates.map(candidate => (
                          <SelectItem key={candidate.id} value={candidate.id}>
                            {formatFullName(candidate.first_name, candidate.last_name)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    {selectedCandidateData && (
                      <div className="mt-6 space-y-4">
                        <div className="border rounded-md p-4">
                          <h3 className="font-semibold text-lg">{formatFullName(selectedCandidateData.first_name, selectedCandidateData.last_name)}</h3>
                          <p className="text-sm text-muted-foreground">{selectedCandidateData.email}</p>
                        </div>
                      </div>
                    )}
                  </>
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
                {loadingData ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <>
                    <Select 
                      onValueChange={(value) => setSelectedPosition(value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a position" />
                      </SelectTrigger>
                      <SelectContent>
                        {positions.map(position => (
                          <SelectItem key={position.id} value={position.id}>
                            {position.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    {selectedPositionData && (
                      <div className="mt-6 space-y-4">
                        <div className="border rounded-md p-4">
                          <h3 className="font-semibold text-lg">{selectedPositionData.title}</h3>
                          {selectedPositionData.description && (
                            <p className="text-sm mt-2">{selectedPositionData.description}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Start Production Interview</CardTitle>
              <CardDescription>
                Begin a real-time interview with WebRTC audio
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                This will create a live interview session using the WebRTC integration. 
                You'll be able to speak directly with an AI interviewer and see the transcript in real-time.
              </p>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button 
                onClick={handleStartInterview} 
                disabled={!selectedCandidate || !selectedPosition || loading || loadingData}
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Starting Interview...
                  </>
                ) : (
                  'Start Production Interview'
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default InterviewTestProduction; 