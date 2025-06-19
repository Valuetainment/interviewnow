import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Mail,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Copy,
  Trash2,
} from "lucide-react";

interface TenantInvitation {
  id: string;
  email: string;
  tenant_name: string;
  company_code: string;
  tenancy_type: string;
  invited_by: string;
  created_at: string;
  expires_at: string;
  accepted_at: string | null;
  tenant_id: string | null;
}

export const SystemAdminInvitations: React.FC = () => {
  const [invitations, setInvitations] = useState<TenantInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [sendingInvitation, setSendingInvitation] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    email: "",
    tenant_name: "",
    tenancy_type: "enterprise",
  });

  useEffect(() => {
    fetchInvitations();
  }, []);

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("tenant_invitations")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setInvitations(data || []);
    } catch (error) {
      console.error("Error fetching invitations:", error);
      toast.error("Failed to load invitations");
    } finally {
      setLoading(false);
    }
  };

  const generateCompanyCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const sendInvitation = async () => {
    try {
      setSendingInvitation(true);

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const companyCode = generateCompanyCode();
      const invitationUrl = `${window.location.origin}/onboarding?code=${companyCode}`;

      // Create invitation record
      const { data: invitation, error: inviteError } = await supabase
        .from("tenant_invitations")
        .insert({
          email: formData.email,
          tenant_name: formData.tenant_name,
          company_code: companyCode,
          tenancy_type: formData.tenancy_type,
          invited_by: user.id,
        })
        .select()
        .single();

      if (inviteError) throw inviteError;

      // Send email via edge function
      const { error: emailError } = await supabase.functions.invoke(
        "send-tenant-invitation",
        {
          body: {
            to: formData.email,
            tenantName: formData.tenant_name,
            invitationUrl,
            companyCode,
          },
        }
      );

      if (emailError) throw emailError;

      toast.success("Invitation sent successfully!");
      setIsCreateDialogOpen(false);
      resetForm();
      fetchInvitations();
    } catch (error) {
      console.error("Error sending invitation:", error);
      toast.error("Failed to send invitation");
    } finally {
      setSendingInvitation(false);
    }
  };

  const resendInvitation = async (invitation: TenantInvitation) => {
    try {
      const invitationUrl = `${window.location.origin}/onboarding?code=${invitation.company_code}`;

      // Send email via edge function
      const { error } = await supabase.functions.invoke(
        "send-tenant-invitation",
        {
          body: {
            to: invitation.email,
            tenantName: invitation.tenant_name,
            invitationUrl,
            companyCode: invitation.company_code,
          },
        }
      );

      if (error) throw error;

      toast.success("Invitation resent successfully!");
    } catch (error) {
      console.error("Error resending invitation:", error);
      toast.error("Failed to resend invitation");
    }
  };

  const deleteInvitation = async (id: string) => {
    if (!confirm("Are you sure you want to delete this invitation?")) return;

    try {
      const { error } = await supabase
        .from("tenant_invitations")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Invitation deleted");
      fetchInvitations();
    } catch (error) {
      console.error("Error deleting invitation:", error);
      toast.error("Failed to delete invitation");
    }
  };

  const copyInvitationLink = (companyCode: string) => {
    const invitationUrl = `${window.location.origin}/onboarding?code=${companyCode}`;
    navigator.clipboard.writeText(invitationUrl);
    toast.success("Invitation link copied to clipboard");
  };

  const resetForm = () => {
    setFormData({
      email: "",
      tenant_name: "",
      tenancy_type: "enterprise",
    });
  };

  const getStatusBadge = (invitation: TenantInvitation) => {
    if (invitation.accepted_at) {
      return (
        <Badge className="bg-green-100 text-green-800">
          <CheckCircle className="mr-1 h-3 w-3" />
          Accepted
        </Badge>
      );
    }

    const isExpired = new Date(invitation.expires_at) < new Date();
    if (isExpired) {
      return (
        <Badge className="bg-red-100 text-red-800">
          <XCircle className="mr-1 h-3 w-3" />
          Expired
        </Badge>
      );
    }

    return (
      <Badge className="bg-yellow-100 text-yellow-800">
        <Clock className="mr-1 h-3 w-3" />
        Pending
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Tenant Invitations</h1>
          <p className="text-gray-600 mt-2">
            Invite new tenant organizations to InterviewNow
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Send className="mr-2 h-4 w-4" />
          Send Invitation
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Invitations
            </CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{invitations.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {
                invitations.filter(
                  (inv) =>
                    !inv.accepted_at && new Date(inv.expires_at) > new Date()
                ).length
              }
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accepted</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {invitations.filter((inv) => inv.accepted_at).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expired</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {
                invitations.filter(
                  (inv) =>
                    !inv.accepted_at && new Date(inv.expires_at) < new Date()
                ).length
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invitations List */}
      <Card>
        <CardHeader>
          <CardTitle>All Invitations</CardTitle>
          <CardDescription>
            Manage tenant invitations and track their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Tenant Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sent</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Loading invitations...
                    </TableCell>
                  </TableRow>
                ) : invitations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      No invitations sent yet
                    </TableCell>
                  </TableRow>
                ) : (
                  invitations.map((invitation) => (
                    <TableRow key={invitation.id}>
                      <TableCell className="font-medium">
                        {invitation.email}
                      </TableCell>
                      <TableCell>{invitation.tenant_name}</TableCell>
                      <TableCell className="capitalize">
                        {invitation.tenancy_type}
                      </TableCell>
                      <TableCell>{getStatusBadge(invitation)}</TableCell>
                      <TableCell>
                        {format(new Date(invitation.created_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        {format(new Date(invitation.expires_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              copyInvitationLink(invitation.company_code)
                            }
                            title="Copy invitation link"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          {!invitation.accepted_at && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => resendInvitation(invitation)}
                                title="Resend invitation"
                              >
                                <RefreshCw className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteInvitation(invitation.id)}
                                className="text-red-600 hover:text-red-700"
                                title="Delete invitation"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create Invitation Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Tenant Invitation</DialogTitle>
            <DialogDescription>
              Invite a new organization to join InterviewNow
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="admin@company.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tenant_name">Organization Name</Label>
              <Input
                id="tenant_name"
                value={formData.tenant_name}
                onChange={(e) =>
                  setFormData({ ...formData, tenant_name: e.target.value })
                }
                placeholder="Acme Corporation"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tenancy_type">Tenancy Type</Label>
              <Select
                value={formData.tenancy_type}
                onValueChange={(value) =>
                  setFormData({ ...formData, tenancy_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                  <SelectItem value="self-service">Self-Service</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
              disabled={sendingInvitation}
            >
              Cancel
            </Button>
            <Button
              onClick={sendInvitation}
              disabled={
                sendingInvitation || !formData.email || !formData.tenant_name
              }
            >
              {sendingInvitation ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Invitation
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
