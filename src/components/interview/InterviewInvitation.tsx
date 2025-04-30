import React, { useState } from 'react';
import { toast } from 'sonner';
import { Copy, Mail, RefreshCw } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { format } from 'date-fns';
import { supabase, getCurrentTenantId } from '@/integrations/supabase/client';

interface InterviewInvitationProps {
  sessionId: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  positionTitle: string;
  scheduledTime: string;
  tokenValue?: string;
  expiresAt?: string;
  status?: string;
  onInvitationSent?: () => void;
}

const InterviewInvitation: React.FC<InterviewInvitationProps> = ({
  sessionId,
  candidateId,
  candidateName,
  candidateEmail,
  positionTitle,
  scheduledTime,
  tokenValue,
  expiresAt,
  status = 'pending',
  onInvitationSent
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [invitationUrl, setInvitationUrl] = useState<string>(
    tokenValue 
      ? `${window.location.origin}/interview/join/${tokenValue}`
      : ''
  );

  const generateInvitation = async () => {
    try {
      setIsGenerating(true);
      
      // Calculate expiration date (7 days from now)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      
      // Get the current tenant ID
      const tenantId = await getCurrentTenantId();
      if (!tenantId) {
        throw new Error('Tenant ID not found in auth context');
      }
      
      // Create invitation record
      const { data, error } = await supabase
        .from('interview_invitations')
        .insert({
          tenant_id: tenantId,
          session_id: sessionId,
          candidate_id: candidateId,
          expires_at: expiresAt.toISOString(),
          status: 'pending'
        })
        .select('token')
        .single();
      
      if (error) throw error;
      
      // Set the invitation URL
      const newInvitationUrl = `${window.location.origin}/interview/join/${data.token}`;
      setInvitationUrl(newInvitationUrl);
      
      toast.success('Invitation link generated successfully!');
      if (onInvitationSent) {
        onInvitationSent();
      }
    } catch (error) {
      console.error('Error generating invitation:', error);
      toast.error('Failed to generate invitation link');
    } finally {
      setIsGenerating(false);
    }
  };

  const sendEmailInvitation = async () => {
    // In a real implementation, this would call an edge function
    // to send an email with the invitation link
    
    try {
      setIsSending(true);
      // Mock sending email
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update invitation status
      if (tokenValue) {
        await supabase
          .from('interview_invitations')
          .update({ status: 'sent' })
          .eq('token', tokenValue);
      }
      
      toast.success(`Invitation sent to ${candidateEmail}`);
      if (onInvitationSent) {
        onInvitationSent();
      }
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast.error('Failed to send invitation email');
    } finally {
      setIsSending(false);
    }
  };

  const copyInvitationLink = () => {
    if (invitationUrl) {
      navigator.clipboard.writeText(invitationUrl);
      toast.success('Invitation link copied to clipboard');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Interview Invitation</CardTitle>
        <CardDescription>
          Generate and send an invitation link to the candidate
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <p className="text-sm font-medium">Candidate</p>
          <p className="text-sm">{candidateName} ({candidateEmail})</p>
        </div>
        
        <div className="space-y-1">
          <p className="text-sm font-medium">Position</p>
          <p className="text-sm">{positionTitle}</p>
        </div>
        
        <div className="space-y-1">
          <p className="text-sm font-medium">Scheduled Time</p>
          <p className="text-sm">
            {scheduledTime ? format(new Date(scheduledTime), 'PPP p') : 'Not scheduled'}
          </p>
        </div>
        
        {expiresAt && (
          <div className="space-y-1">
            <p className="text-sm font-medium">Expires</p>
            <p className="text-sm">
              {format(new Date(expiresAt), 'PPP')}
            </p>
          </div>
        )}
        
        {status && (
          <div className="space-y-1">
            <p className="text-sm font-medium">Status</p>
            <div className="flex items-center space-x-2">
              <div className={`h-2 w-2 rounded-full ${
                status === 'pending' ? 'bg-yellow-500' :
                status === 'sent' ? 'bg-blue-500' :
                status === 'accepted' ? 'bg-green-500' :
                status === 'expired' ? 'bg-gray-500' : 'bg-red-500'
              }`}></div>
              <p className="text-sm capitalize">{status}</p>
            </div>
          </div>
        )}
        
        {invitationUrl && (
          <div className="pt-2">
            <label className="text-sm font-medium">Invitation Link</label>
            <div className="mt-1 flex">
              <Input 
                value={invitationUrl} 
                readOnly
                className="flex-1"
              />
              <Button
                variant="outline"
                size="icon"
                className="ml-2"
                onClick={copyInvitationLink}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        {!invitationUrl ? (
          <Button 
            onClick={generateInvitation} 
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              'Generate Invitation Link'
            )}
          </Button>
        ) : (
          <>
            <Button 
              variant="outline" 
              onClick={generateInvitation}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Regenerating...
                </>
              ) : (
                'Regenerate Link'
              )}
            </Button>
            
            <Button 
              onClick={sendEmailInvitation}
              disabled={isSending || status === 'sent' || status === 'accepted'}
            >
              {isSending ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Send Email
                </>
              )}
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
};

export default InterviewInvitation; 