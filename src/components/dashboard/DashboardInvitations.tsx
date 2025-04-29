
import React, { useState } from 'react';
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

// Mock data for candidates and positions
const MOCK_CANDIDATES = [
  { id: "1", name: "Ben Pappas", email: "ben.pappas@example.com" },
  { id: "2", name: "Sarah Johnson", email: "sarah.j@example.com" },
  { id: "3", name: "Alex Wong", email: "alex.wong@example.com" },
  { id: "4", name: "Maria Garcia", email: "maria.garcia@example.com" },
];

const MOCK_POSITIONS = [
  { id: "1", title: "Frontend Engineer" },
  { id: "2", title: "Backend Node Engineer" },
  { id: "3", title: "Digital Marketing Media Buyer" },
  { id: "4", title: "Cursor AI Engineer" },
  { id: "5", title: "President" },
];

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
  const form = useForm<InvitationFormValues>({
    resolver: zodResolver(invitationSchema),
    defaultValues: {
      candidateEmail: "",
      expirationHours: 72,
    },
  });

  const handleSelectCandidate = (candidateId: string) => {
    const candidate = MOCK_CANDIDATES.find(c => c.id === candidateId);
    if (candidate) {
      form.setValue("candidateEmail", candidate.email);
    }
  };

  const onSubmit = (data: InvitationFormValues) => {
    const candidate = MOCK_CANDIDATES.find(c => c.id === data.candidateId);
    const position = MOCK_POSITIONS.find(p => p.id === data.positionId);
    
    toast.success(`Invitation sent to ${candidate?.name} for ${position?.title} position.`, {
      description: `The invitation will expire in ${data.expirationHours} hours.`,
    });
    
    console.log("Invitation data:", data);
    form.reset({
      candidateId: "",
      positionId: "",
      candidateEmail: "",
      expirationHours: 72,
    });
  };
  
  return (
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
                      {MOCK_CANDIDATES.map((candidate) => (
                        <SelectItem key={candidate.id} value={candidate.id}>
                          {candidate.name}
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
                      {MOCK_POSITIONS.map((position) => (
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
            
            <Button type="submit" className="w-full sm:w-auto">
              Send Invitation
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default DashboardInvitations;
