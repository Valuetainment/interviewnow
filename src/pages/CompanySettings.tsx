import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  Building,
  Users,
  Settings,
  CreditCard,
  Plus,
  Trash2,
  Edit,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { InterviewerAccessManagement } from "@/components/settings/InterviewerAccessManagement";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";

interface TenantUser {
  id: string;
  email: string;
  role: string;
  created_at: string;
}

interface PendingInvitation {
  id: string;
  email: string;
  role: string;
  created_at: string;
  expires_at: string;
  company_code: string;
}

const CompanySettings = () => {
  const { toast } = useToast();
  const { isTenantAdmin, tenantId, user } = useAuth();
  const [companyName, setCompanyName] = useState("InterviewAI");
  const [companyEmail, setCompanyEmail] = useState("contact@interviewai.com");
  const [loading, setLoading] = useState(false);
  const [tenantUsers, setTenantUsers] = useState<TenantUser[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<
    PendingInvitation[]
  >([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // Dialog states
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<TenantUser | null>(null);

  // Form states
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState<string>("tenant_interviewer");
  const [editUserRole, setEditUserRole] = useState("");
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<Set<string>>(
    new Set()
  );
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>(
    []
  );

  // Tab states
  const [activeTab, setActiveTab] = useState("profile");

  // Fetch tenant users when component mounts or when we're on the users tab
  useEffect(() => {
    if (tenantId && activeTab === "users") {
      // Fetch data once when tab becomes active
      const fetchData = async () => {
        await fetchTenantUsers();
        await fetchPendingInvitations();
        await fetchCompanies();
      };

      fetchData();
    }
  }, [tenantId, activeTab]);

  const fetchTenantUsers = async () => {
    if (!tenantId) return;

    setLoadingUsers(true);
    try {
      // Use the secure function that handles RLS properly
      const { data, error } = await supabase.rpc("get_tenant_users", {
        p_tenant_id: tenantId,
      });

      if (error) {
        console.error("Error fetching users:", error);
        toast({
          title: "Error",
          description: "Failed to load users",
          variant: "destructive",
        });
      } else {
        setTenantUsers(data || []);
        return data || [];
      }
    } finally {
      setLoadingUsers(false);
    }
    return [];
  };

  const fetchPendingInvitations = async () => {
    try {
      // Get current tenant users using the secure function
      const { data: currentUsers } = await supabase.rpc("get_tenant_users", {
        p_tenant_id: tenantId,
      });

      const existingEmails =
        currentUsers?.map((u) => u.email).filter(Boolean) || [];

      // Now fetch invitations that are not accepted and email not in existing users
      const { data, error } = await supabase
        .from("tenant_invitations")
        .select("*")
        .eq("tenant_id", tenantId)
        .is("accepted_at", null)
        .gte("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching invitations:", error);
        toast({
          title: "Error",
          description: "Failed to load pending invitations",
          variant: "destructive",
        });
      } else {
        // Filter out invitations where the user already exists
        const pendingOnly = (data || []).filter(
          (invitation) => !existingEmails.includes(invitation.email)
        );
        setPendingInvitations(pendingOnly);
      }
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Failed to load pending invitations",
        variant: "destructive",
      });
    }
  };

  const fetchCompanies = async () => {
    if (!tenantId) return;

    const { data, error } = await supabase
      .from("companies")
      .select("id, name")
      .eq("tenant_id", tenantId)
      .order("name");

    if (error) {
      console.error("Error fetching companies:", error);
    } else {
      setCompanies(data || []);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "tenant_admin":
        return <Badge>Admin</Badge>;
      case "tenant_interviewer":
        return <Badge variant="secondary">Interviewer</Badge>;
      case "tenant_candidate":
        return <Badge variant="outline">Candidate</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  const handleAddUser = async () => {
    if (!newUserEmail) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }

    // For interviewers, at least one company must be selected
    if (newUserRole === "tenant_interviewer" && selectedCompanyIds.size === 0) {
      toast({
        title: "Error",
        description: "Please select at least one company for the interviewer",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      // Get tenant name for email
      const { data: tenantData } = await supabase
        .from("tenants")
        .select("name")
        .eq("id", tenantId)
        .single();

      // Get user's name
      const { data: userData } = await supabase.auth.getUser();

      // Convert selected company IDs to array
      const companyIdsArray =
        newUserRole === "tenant_interviewer"
          ? Array.from(selectedCompanyIds)
          : null;

      // Call the updated add_tenant_user function with company IDs
      const { data, error } = await supabase.rpc("add_tenant_user", {
        p_email: newUserEmail,
        p_role: newUserRole,
        p_send_invite: true,
        p_company_ids: companyIdsArray,
      });

      if (error) throw error;

      if (data.success) {
        // Generate the invitation link
        const invitationLink = `${window.location.origin}/signup?code=${data.invitation_code}`;

        // Get company names for the email
        const selectedCompanyNames = companies
          .filter((company) => selectedCompanyIds.has(company.id))
          .map((company) => company.name);

        // Send invitation email
        const { error: emailError } = await supabase.functions.invoke(
          "send-tenant-user-invitation",
          {
            body: {
              to: newUserEmail,
              inviterName:
                userData?.user?.user_metadata?.full_name ||
                userData?.user?.email ||
                "A team member",
              tenantName: tenantData?.name || "your organization",
              invitationUrl: invitationLink,
              companyCode: data.invitation_code,
              role: newUserRole,
              companyNames: selectedCompanyNames,
            },
          }
        );

        if (emailError) {
          console.error("Error sending email:", emailError);
          toast({
            title: "Warning",
            description:
              "Invitation created but email could not be sent. You can copy the link to share manually.",
            duration: 10000,
          });
        } else {
          toast({
            title: "Success",
            description: "Invitation sent successfully via email!",
          });
        }

        setShowAddDialog(false);
        setNewUserEmail("");
        setNewUserRole("tenant_interviewer");
        setSelectedCompanyIds(new Set());
        fetchTenantUsers();
        fetchPendingInvitations();
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to add user",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error adding user:", error);
      toast({
        title: "Error",
        description: "Failed to add user",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = async () => {
    if (!selectedUser) return;

    try {
      setLoading(true);
      const { data, error } = await supabase.rpc("update_tenant_user", {
        p_user_id: selectedUser.id,
        p_role: editUserRole,
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Success",
          description: data.message || "User updated successfully",
        });
        setShowEditDialog(false);
        setSelectedUser(null);
        setEditUserRole("");
        fetchTenantUsers();
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to update user",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating user:", error);
      toast({
        title: "Error",
        description: "Failed to update user",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      setLoading(true);
      const { data, error } = await supabase.rpc("delete_tenant_user", {
        p_user_id: selectedUser.id,
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Success",
          description: data.message || "User deleted successfully",
        });
        setShowDeleteDialog(false);
        setSelectedUser(null);
        fetchTenantUsers();
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to delete user",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (user: TenantUser) => {
    setSelectedUser(user);
    setEditUserRole(user.role);
    setShowEditDialog(true);
  };

  const openDeleteDialog = (user: TenantUser) => {
    setSelectedUser(user);
    setShowDeleteDialog(true);
  };

  const saveCompanyProfile = () => {
    setLoading(true);

    // Mock API call
    setTimeout(() => {
      setLoading(false);
      toast({
        title: "Settings saved",
        description: "Your company profile has been updated successfully",
      });
    }, 1000);
  };

  const saveUserSettings = () => {
    setLoading(true);

    // Mock API call
    setTimeout(() => {
      setLoading(false);
      toast({
        title: "User settings saved",
        description: "User settings have been updated successfully",
      });
    }, 1000);
  };

  const saveAppSettings = () => {
    setLoading(true);

    // Mock API call
    setTimeout(() => {
      setLoading(false);
      toast({
        title: "App settings saved",
        description: "Application settings have been updated successfully",
      });
    }, 1000);
  };

  const updatePaymentMethod = () => {
    setLoading(true);

    // Mock API call
    setTimeout(() => {
      setLoading(false);
      toast({
        title: "Payment method updated",
        description: "Your payment information has been updated successfully",
      });
    }, 1000);
  };

  const changePlan = (plan: string) => {
    setLoading(true);

    // Mock API call
    setTimeout(() => {
      setLoading(false);
      toast({
        title: "Plan updated",
        description: `Successfully switched to ${plan} plan`,
      });
    }, 1000);
  };

  const copyInvitationLink = (code: string) => {
    const link = `${window.location.origin}/signup?code=${code}`;
    navigator.clipboard.writeText(link).then(() => {
      toast({
        title: "Link copied!",
        description: "The invitation link has been copied to your clipboard.",
      });
    });
  };

  const cancelInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from("tenant_invitations")
        .delete()
        .eq("id", invitationId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Invitation cancelled",
      });

      // Refresh both lists in case the invitation was partially accepted
      fetchPendingInvitations();
      fetchTenantUsers();
    } catch (error) {
      console.error("Error cancelling invitation:", error);
      toast({
        title: "Error",
        description: "Failed to cancel invitation",
        variant: "destructive",
      });
    }
  };

  const toggleCompanySelection = (companyId: string) => {
    const newSelection = new Set(selectedCompanyIds);
    if (newSelection.has(companyId)) {
      newSelection.delete(companyId);
    } else {
      newSelection.add(companyId);
    }
    setSelectedCompanyIds(newSelection);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold mb-8">
          Company Settings
        </h1>

        <Tabs
          defaultValue="profile"
          className="space-y-6"
          onValueChange={setActiveTab}
        >
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <Building size={16} />
              <span>Company Profile</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users size={16} />
              <span>Users</span>
            </TabsTrigger>
            <TabsTrigger value="billing" className="flex items-center gap-2">
              <CreditCard size={16} />
              <span>Billing</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings size={16} />
              <span>App Settings</span>
            </TabsTrigger>
          </TabsList>

          {/* Company Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Company Profile</CardTitle>
                <CardDescription>
                  Manage your company information and branding
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="company-name">Company Name</Label>
                  <Input
                    id="company-name"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Your company name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company-email">Company Email</Label>
                  <Input
                    id="company-email"
                    type="email"
                    value={companyEmail}
                    onChange={(e) => setCompanyEmail(e.target.value)}
                    placeholder="contact@company.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company-logo">Company Logo</Label>
                  <div className="border border-dashed border-input rounded-md p-6 flex flex-col items-center justify-center">
                    <p className="text-sm text-muted-foreground mb-2">
                      Upload your company logo (SVG, PNG or JPG)
                    </p>
                    <Button variant="outline">Upload Logo</Button>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={saveCompanyProfile}
                  disabled={loading}
                  className="ml-auto"
                >
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Manage Users</CardTitle>
                      <CardDescription>
                        Add, edit, or remove users from your organization
                      </CardDescription>
                    </div>
                    {isTenantAdmin && (
                      <Button onClick={() => setShowAddDialog(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add User
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-md border">
                    <div className="p-4">
                      <div className="grid grid-cols-12 font-medium">
                        <div className="col-span-5">Email</div>
                        <div className="col-span-3">Role</div>
                        <div className="col-span-2">Joined</div>
                        <div className="col-span-2 text-right">Actions</div>
                      </div>
                    </div>
                    <Separator />
                    {loadingUsers ? (
                      <div className="p-8 text-center text-muted-foreground">
                        Loading users...
                      </div>
                    ) : tenantUsers.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground">
                        No users found
                      </div>
                    ) : (
                      <div className="divide-y">
                        {tenantUsers.map((tenantUser) => (
                          <div key={tenantUser.id} className="p-4">
                            <div className="grid grid-cols-12 items-center">
                              <div
                                className="col-span-5 font-medium truncate pr-4"
                                title={tenantUser.email}
                              >
                                {tenantUser.email || "No email"}
                              </div>
                              <div className="col-span-3">
                                {getRoleBadge(tenantUser.role)}
                              </div>
                              <div className="col-span-2 text-sm text-muted-foreground">
                                {new Date(
                                  tenantUser.created_at
                                ).toLocaleDateString()}
                              </div>
                              <div className="col-span-2 text-right space-x-2">
                                {isTenantAdmin && (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => openEditDialog(tenantUser)}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        openDeleteDialog(tenantUser)
                                      }
                                      disabled={tenantUser.id === user?.id}
                                      className={
                                        tenantUser.id === user?.id
                                          ? "opacity-50"
                                          : "text-red-600 hover:text-red-700"
                                      }
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Pending Invitations */}
              {isTenantAdmin && pendingInvitations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Pending Invitations</CardTitle>
                    <CardDescription>
                      Users who have been invited but haven't created their
                      account yet
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md border">
                      <div className="p-4">
                        <div className="grid grid-cols-12 font-medium">
                          <div className="col-span-5">Email</div>
                          <div className="col-span-3">Role</div>
                          <div className="col-span-2">Expires</div>
                          <div className="col-span-2 text-right">Actions</div>
                        </div>
                      </div>
                      <Separator />
                      <div className="divide-y">
                        {pendingInvitations.map((invitation) => (
                          <div key={invitation.id} className="p-4">
                            <div className="grid grid-cols-12 items-center">
                              <div
                                className="col-span-5 font-medium truncate pr-4"
                                title={invitation.email}
                              >
                                {invitation.email}
                              </div>
                              <div className="col-span-3">
                                {getRoleBadge(invitation.role)}
                              </div>
                              <div className="col-span-2 text-sm text-muted-foreground">
                                {new Date(
                                  invitation.expires_at
                                ).toLocaleDateString()}
                              </div>
                              <div className="col-span-2 text-right space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    copyInvitationLink(invitation.company_code)
                                  }
                                  title="Copy invitation link"
                                >
                                  Copy Link
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    cancelInvitation(invitation.id)
                                  }
                                  className="text-red-600 hover:text-red-700"
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Interviewer Access Management - Only visible to Tenant Admins */}
              {isTenantAdmin && <InterviewerAccessManagement />}
            </div>
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing">
            <div className="space-y-6">
              {/* Current Plan */}
              <Card>
                <CardHeader>
                  <CardTitle>Current Plan</CardTitle>
                  <CardDescription>
                    Manage your subscription and billing preferences
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="rounded-lg border p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold">
                            Professional Plan
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            $99/month • Billed monthly
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold">$99</p>
                          <p className="text-sm text-muted-foreground">
                            per month
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm">✓ Unlimited interviews</p>
                        <p className="text-sm">✓ Advanced AI analytics</p>
                        <p className="text-sm">✓ 50 team members</p>
                        <p className="text-sm">✓ Priority support</p>
                      </div>
                    </div>

                    {/* Plan Options */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                      <div className="border rounded-lg p-4">
                        <h4 className="font-semibold mb-2">Starter</h4>
                        <p className="text-2xl font-bold mb-2">
                          $49<span className="text-sm font-normal">/mo</span>
                        </p>
                        <p className="text-sm text-muted-foreground mb-4">
                          Perfect for small teams
                        </p>
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => changePlan("Starter")}
                        >
                          Downgrade
                        </Button>
                      </div>

                      <div className="border-2 border-primary rounded-lg p-4">
                        <h4 className="font-semibold mb-2">Professional</h4>
                        <p className="text-2xl font-bold mb-2">
                          $99<span className="text-sm font-normal">/mo</span>
                        </p>
                        <p className="text-sm text-muted-foreground mb-4">
                          Current plan
                        </p>
                        <Button variant="secondary" className="w-full" disabled>
                          Current Plan
                        </Button>
                      </div>

                      <div className="border rounded-lg p-4">
                        <h4 className="font-semibold mb-2">Enterprise</h4>
                        <p className="text-2xl font-bold mb-2">
                          $299<span className="text-sm font-normal">/mo</span>
                        </p>
                        <p className="text-sm text-muted-foreground mb-4">
                          Unlimited everything
                        </p>
                        <Button
                          className="w-full"
                          onClick={() => changePlan("Enterprise")}
                        >
                          Upgrade
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Method */}
              <Card>
                <CardHeader>
                  <CardTitle>Payment Method</CardTitle>
                  <CardDescription>
                    Update your payment information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-lg border p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <CreditCard className="h-8 w-8 text-muted-foreground" />
                      <div>
                        <p className="font-medium">•••• •••• •••• 4242</p>
                        <p className="text-sm text-muted-foreground">
                          Expires 12/25
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" onClick={updatePaymentMethod}>
                      Update
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label>Billing Email</Label>
                    <Input defaultValue="billing@company.com" />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="ml-auto" onClick={updatePaymentMethod}>
                    Save Payment Details
                  </Button>
                </CardFooter>
              </Card>

              {/* Billing History */}
              <Card>
                <CardHeader>
                  <CardTitle>Billing History</CardTitle>
                  <CardDescription>
                    View and download your past invoices
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <div className="p-4">
                      <div className="grid grid-cols-4 font-medium text-sm">
                        <div>Date</div>
                        <div>Description</div>
                        <div>Amount</div>
                        <div className="text-right">Invoice</div>
                      </div>
                    </div>
                    <Separator />
                    <div className="divide-y">
                      <div className="p-4">
                        <div className="grid grid-cols-4 items-center text-sm">
                          <div>Dec 1, 2024</div>
                          <div>Professional Plan</div>
                          <div>$99.00</div>
                          <div className="text-right">
                            <Button variant="ghost" size="sm">
                              Download
                            </Button>
                          </div>
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="grid grid-cols-4 items-center text-sm">
                          <div>Nov 1, 2024</div>
                          <div>Professional Plan</div>
                          <div>$99.00</div>
                          <div className="text-right">
                            <Button variant="ghost" size="sm">
                              Download
                            </Button>
                          </div>
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="grid grid-cols-4 items-center text-sm">
                          <div>Oct 1, 2024</div>
                          <div>Professional Plan</div>
                          <div>$99.00</div>
                          <div className="text-right">
                            <Button variant="ghost" size="sm">
                              Download
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* App Settings Tab */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Application Settings</CardTitle>
                <CardDescription>
                  Configure how InterviewAI works for your organization
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="ai-model">Default AI Model</Label>
                  <select
                    id="ai-model"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="gpt-4">GPT-4</option>
                    <option value="gpt-3.5">GPT-3.5</option>
                    <option value="claude-3">Claude 3</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="interview-duration">
                    Default Interview Duration
                  </Label>
                  <select
                    id="interview-duration"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="30">30 minutes</option>
                    <option value="45">45 minutes</option>
                    <option value="60">60 minutes</option>
                    <option value="90">90 minutes</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="recording-consent">
                      Require Candidate Consent
                    </Label>
                    <input
                      type="checkbox"
                      id="recording-consent"
                      className="h-4 w-4 rounded border-gray-300 focus:ring-primary"
                      defaultChecked
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Ask candidates for consent before recording interviews
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="auto-assessment">
                      Automatic Assessment
                    </Label>
                    <input
                      type="checkbox"
                      id="auto-assessment"
                      className="h-4 w-4 rounded border-gray-300 focus:ring-primary"
                      defaultChecked
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Generate AI assessment reports immediately after interviews
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={saveAppSettings}
                  disabled={loading}
                  className="ml-auto"
                >
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add User Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Invite a new user to your organization
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={newUserRole} onValueChange={setNewUserRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tenant_admin">Admin</SelectItem>
                  <SelectItem value="tenant_interviewer">
                    Interviewer
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            {newUserRole === "tenant_interviewer" && (
              <div className="space-y-2">
                <Label>
                  Company Access <span className="text-red-500">*</span>
                </Label>
                <div className="text-sm text-muted-foreground mb-2">
                  Select which companies this interviewer can access (required)
                </div>
                <div className="border rounded-lg p-4 max-h-60 overflow-y-auto space-y-2">
                  {companies.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">
                      No companies found. Create a company first.
                    </p>
                  ) : (
                    companies.map((company) => (
                      <div
                        key={company.id}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={`company-${company.id}`}
                          checked={selectedCompanyIds.has(company.id)}
                          onCheckedChange={() =>
                            toggleCompanySelection(company.id)
                          }
                        />
                        <label
                          htmlFor={`company-${company.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {company.name}
                        </label>
                      </div>
                    ))
                  )}
                </div>
                {selectedCompanyIds.size === 0 && (
                  <Alert className="mt-2">
                    <AlertDescription className="text-sm">
                      You must select at least one company for the interviewer
                      to access.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddUser}
              disabled={
                loading ||
                (newUserRole === "tenant_interviewer" &&
                  selectedCompanyIds.size === 0)
              }
            >
              {loading ? "Adding..." : "Add User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user role for {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-role">Role</Label>
              <Select value={editUserRole} onValueChange={setEditUserRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tenant_admin">Admin</SelectItem>
                  <SelectItem value="tenant_interviewer">
                    Interviewer
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditUser} disabled={loading}>
              {loading ? "Updating..." : "Update User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {selectedUser?.email} from your
              organization? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading ? "Deleting..." : "Delete User"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CompanySettings;
