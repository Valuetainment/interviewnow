import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { supabase, getCurrentTenantId } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, Loader2 } from 'lucide-react';

// Define proper types for our data
interface Candidate {
  id: string;
  full_name: string;
  email: string;
}

interface Position {
  id: string;
  title: string;
}

// Define the form schema using Zod for validation
const formSchema = z.object({
  candidateId: z.string().uuid('Please select a candidate'),
  positionId: z.string().uuid('Please select a position'),
  scheduledTime: z.date({
    required_error: 'Please select a date and time',
  }),
  duration: z.string().min(1, 'Please select duration'),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const CreateSession = () => {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  // Initialize form with react-hook-form and Zod validation
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      notes: '',
    },
  });

  // Fetch candidates and positions on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch candidates
        const { data: candidatesData, error: candidatesError } = await supabase
          .from('candidates')
          .select('id, full_name, email');

        if (candidatesError) throw candidatesError;
        setCandidates(candidatesData || []);

        // Fetch positions
        const { data: positionsData, error: positionsError } = await supabase
          .from('positions')
          .select('id, title');

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

  const handleSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      // Get tenant ID
      const tenantId = await getCurrentTenantId();
      if (!tenantId) {
        throw new Error('Tenant ID not found in auth context');
      }
      
      // Create the interview session
      const { data: session, error: sessionError } = await supabase
        .from('interview_sessions')
        .insert({
          tenant_id: tenantId,
          candidate_id: values.candidateId,
          position_id: values.positionId,
          start_time: values.scheduledTime.toISOString(),
          status: 'scheduled',
        })
        .select('id')
        .single();

      if (sessionError) throw sessionError;

      // Create interview invitation
      // Calculate expires_at as 7 days from now
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const { error: invitationError } = await supabase
        .from('interview_invitations')
        .insert({
          tenant_id: tenantId,
          session_id: session.id,
          candidate_id: values.candidateId,
          expires_at: expiresAt.toISOString(),
          status: 'pending',
        });

      if (invitationError) throw invitationError;

      // Record usage event
      await supabase
        .from('usage_events')
        .insert({
          tenant_id: tenantId,
          event_type: 'session_created',
          quantity: 1,
        });

      toast.success('Interview session created successfully');
      // Navigate to the session details page
      navigate(`/sessions/${session.id}`);
    } catch (error) {
      console.error('Error creating session:', error);
      toast.error('Failed to create interview session');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex-grow container mx-auto px-4 py-24 md:py-32">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold mb-8">Create Interview Session</h1>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)}>
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Interview Details</CardTitle>
                  <CardDescription>
                    Set up a new interview session by selecting a candidate and position
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {loadingData ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <>
                      <FormField
                        control={form.control}
                        name="candidateId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Candidate</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a candidate" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {candidates.map((candidate) => (
                                  <SelectItem key={candidate.id} value={candidate.id}>
                                    {candidate.full_name} ({candidate.email})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              The candidate to be interviewed
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="positionId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Position</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a position" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {positions.map((position) => (
                                  <SelectItem key={position.id} value={position.id}>
                                    {position.title}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              The position being interviewed for
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="scheduledTime"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Scheduled Date & Time</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    className="w-full pl-3 text-left font-normal"
                                  >
                                    {field.value ? (
                                      format(field.value, "PPP p")
                                    ) : (
                                      <span>Pick a date and time</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  initialFocus
                                />
                                <div className="p-3 border-t border-border">
                                  <Input
                                    type="time"
                                    onChange={(e) => {
                                      const date = field.value || new Date();
                                      const [hours, minutes] = e.target.value.split(':');
                                      date.setHours(parseInt(hours, 10));
                                      date.setMinutes(parseInt(minutes, 10));
                                      field.onChange(date);
                                    }}
                                  />
                                </div>
                              </PopoverContent>
                            </Popover>
                            <FormDescription>
                              When the interview will take place
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="duration"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Duration</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select duration" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="15">15 minutes</SelectItem>
                                <SelectItem value="30">30 minutes</SelectItem>
                                <SelectItem value="45">45 minutes</SelectItem>
                                <SelectItem value="60">60 minutes</SelectItem>
                                <SelectItem value="90">90 minutes</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              How long the interview will last
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Additional Notes</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Any additional information for the interviewer"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Optional notes for the interview
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}
                </CardContent>
                <CardFooter className="flex justify-end space-x-4">
                  <Button
                    variant="outline"
                    onClick={() => navigate('/dashboard')}
                    type="button"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={loading || loadingData}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Interview Session'
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </form>
          </Form>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default CreateSession; 