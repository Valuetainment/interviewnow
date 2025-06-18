import React, { useState, useEffect } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Table, TableHeader, TableHead, TableRow, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Clock, Mail, User, Briefcase } from "lucide-react";
import { formatFullName } from '@/lib/utils';

// Form schema
const invitationSchema = z.object({
  candidateId: z.string({
    required_error: "Please select a candidate.",
  }),
  positionId: z.string({
    required_error: "Please select a position.",
  }),
  candidateEmail: z.string()
    .email("Please enter a valid email address."),
  expirationHours: z.coerce.number()
    .min(1, "Expiration must be at least 1 hour.")
    .max(168, "Expiration cannot exceed 7 days (168 hours)."),
});

type InvitationFormValues = z.infer<typeof invitationSchema>;

const DashboardInvitations: React.FC = () => {
  const { tenantId } = useAuth();
  const [candidates, setCandidates] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<InvitationFormValues>({
    resolver: zodResolver(invitationSchema),
    defaultValues: {
      candidateEmail: "",
      expirationHours: 72,
    },
  });

  useEffect(() => {
    if (tenantId) {
      fetchData();
    }
  }, [tenantId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchCandidates(),
        fetchPositions(),
        fetchInvitations()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCandidates = async () => {
    const { data, error } = await supabase
      .from('candidates')
      .select('id, first_name, last_name, email')
      .eq('tenant_id', tenantId)
      .order('first_name');
    
    if (error) {
      console.error('Error fetching candidates:', error);
    } else {
      setCandidates(data || []);
    }
  };

  const fetchPositions = async () => {
    const { data, error } = await supabase
      .from('positions')
      .select('id, title')
      .eq('tenant_id', tenantId)
      .order('title');
    
    if (error) {
      console.error('Error fetching positions:', error);
    } else {
      setPositions(data || []);
    }
  };

  const fetchInvitations = async () => {
    const { data, error } = await supabase
      .from('interview_invitations')
      .select(`
        token,
        status,
        expires_at,
        created_at,
        candidates (
          id,
          first_name,
          last_name,
          email
        ),
        interview_sessions (
          id,
          positions (
            id,
            title
          )
        )
      `)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) {
      console.error('Error fetching invitations:', error);
    } else {
      setInvitations(data || []);
    }
  };

  const handleSelectCandidate = (candidateId: string) => {
    const candidate = candidates.find(c => c.id === candidateId);
    if (candidate) {
      form.setValue("candidateEmail", candidate.email);
    }
  };

  const onSubmit = async (data: InvitationFormValues) => {
    setSubmitting(true);
    try {
      // First create the interview session
      const { data: sessionData, error: sessionError } = await supabase
        .from('interview_sessions')
        .insert({
          tenant_id: tenantId,
          position_id: data.positionId,
          candidate_id: data.candidateId,
          status: 'scheduled',
          start_time: new Date(Date.now() + data.expirationHours * 60 * 60 * 1000).toISOString()
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Then create the invitation
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + data.expirationHours);

      const { data: invitationData, error: invitationError } = await supabase
        .from('interview_invitations')
        .insert({
          tenant_id: tenantId,
          session_id: sessionData.id,
          candidate_id: data.candidateId,
          expires_at: expiresAt.toISOString(),
          status: 'pending'
        })
        .select()
        .single();

      if (invitationError) throw invitationError;

      const candidate = candidates.find(c => c.id === data.candidateId);
      const position = positions.find(p => p.id === data.positionId);
      
      toast.success(`Invitation sent to ${formatFullName(candidate?.first_name, candidate?.last_name)} for ${position?.title} position.`, {
        description: `The invitation will expire in ${data.expirationHours} hours.`,
      });
      
      form.reset({
        candidateId: "",
        positionId: "",
        candidateEmail: "",
        expirationHours: 72,
      });

      // Refresh invitations list
      fetchInvitations();
    } catch (error) {
      console.error('Error creating invitation:', error);
      toast.error('Failed to send invitation', {
        description: 'Please try again later.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Send Interview Invitation</CardTitle>
          <CardDescription>Create and send an AI interview invitation to a candidate</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="candidateId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Candidate</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        handleSelectCandidate(value);
                      }}
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
                              {formatFullName(candidate.first_name, candidate.last_name)}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
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
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="candidateEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Candidate Email</FormLabel>
                    <FormControl>
                      <Input placeholder="candidate@example.com" {...field} />
                    </FormControl>
                    <FormDescription>
                      The interview invitation will be sent to this email address.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="expirationHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expiration Time (hours)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormDescription>
                      The invitation will expire after this many hours (default: 72).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button type="submit" className="w-full sm:w-auto" disabled={submitting}>
                {submitting ? 'Sending...' : 'Send Invitation'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Invitations</CardTitle>
          <CardDescription>Track the status of sent interview invitations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Candidate</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Sent</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.length > 0 ? (
                  invitations.map((invitation) => {
                    const expired = isExpired(invitation.expires_at);
                    const status = expired && invitation.status === 'pending' ? 'expired' : invitation.status;
                    
                    return (
                      <TableRow key={invitation.token}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                                                          <div>
                                <div className="font-medium">{formatFullName(invitation.candidates?.first_name, invitation.candidates?.last_name)}</div>
                                <div className="text-sm text-muted-foreground">{invitation.candidates?.email}</div>
                              </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Briefcase className="h-4 w-4 text-muted-foreground" />
                            {invitation.interview_sessions?.positions?.title || 'Unknown Position'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                            {new Date(invitation.created_at).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                            {new Date(invitation.expires_at).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(status)}>
                            {status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No invitations sent yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardInvitations;
