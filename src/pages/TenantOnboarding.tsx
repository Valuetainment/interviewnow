import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import {
  Building2,
  Loader2,
  CheckCircle,
  Mail,
  Lock,
  User,
} from "lucide-react";

interface InvitationData {
  id: string;
  email: string;
  tenant_name: string;
  tenancy_type: string;
  expires_at: string;
  accepted_at: string | null;
}

export const TenantOnboarding: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const companyCode = searchParams.get("code");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
  });

  useEffect(() => {
    if (companyCode) {
      fetchInvitation();
    } else {
      setError("Invalid invitation link");
      setLoading(false);
    }
  }, [companyCode]);

  const fetchInvitation = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from("tenant_invitations")
        .select("*")
        .eq("company_code", companyCode)
        .single();

      if (fetchError || !data) {
        setError("Invalid or expired invitation");
        setLoading(false);
        return;
      }

      // Check if invitation is expired
      if (new Date(data.expires_at) < new Date()) {
        setError("This invitation has expired");
        setLoading(false);
        return;
      }

      // Check if invitation was already accepted
      if (data.accepted_at) {
        setError("This invitation has already been used");
        setLoading(false);
        return;
      }

      setInvitation(data);
      setFormData((prev) => ({ ...prev, email: data.email }));
    } catch (err) {
      console.error("Error fetching invitation:", err);
      setError("Failed to load invitation");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!invitation) return;

    // Validate form
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    try {
      setSubmitting(true);

      // 1. First sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
          },
        },
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error("Failed to create user account");
      }

      // 2. Sign in the user immediately to get authenticated
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (signInError) throw signInError;

      // 3. Create user profile first (without tenant_id)
      const { error: createUserError } = await supabase.from("users").insert({
        id: authData.user.id,
        tenant_id: null,
        role: "tenant_admin",
      });

      if (createUserError && createUserError.code !== "23505") {
        // Ignore duplicate key errors
        console.error("Error creating user profile:", createUserError);
        throw createUserError;
      }

      // 4. Now create the tenant (user exists and is authenticated)
      const { data: tenant, error: tenantError } = await supabase
        .from("tenants")
        .insert({
          name: invitation.tenant_name,
          plan_tier: "free", // Default to free plan
          tenancy_type: invitation.tenancy_type,
        })
        .select()
        .single();

      if (tenantError) {
        console.error("Error creating tenant:", tenantError);
        throw tenantError;
      }

      // 5. Update user profile with tenant_id
      const { error: updateUserError } = await supabase
        .from("users")
        .update({
          tenant_id: tenant.id,
        })
        .eq("id", authData.user.id);

      if (updateUserError) {
        console.error("Error updating user profile:", updateUserError);
        throw updateUserError;
      }

      // 6. Update the invitation as accepted
      const { error: updateError } = await supabase
        .from("tenant_invitations")
        .update({
          accepted_at: new Date().toISOString(),
          tenant_id: tenant.id,
        })
        .eq("id", invitation.id);

      if (updateError) throw updateError;

      // 7. Refresh the session to trigger metadata sync
      // This ensures the auth.users app_metadata is updated with tenant_id and role
      await supabase.auth.refreshSession();

      // 8. Show success message
      toast.success("Account created successfully!");

      // 9. Wait a brief moment for auth state to fully propagate
      // This prevents any race conditions with the dashboard loading
      setTimeout(() => {
        navigate("/dashboard");
      }, 200);
    } catch (err) {
      console.error("Error during onboarding:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to create account"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-red-600">Invitation Error</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => navigate("/")}>Go to Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-blue-100 rounded-full inline-block">
            <Building2 className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Welcome to InterviewNow!</CardTitle>
          <CardDescription className="text-lg">
            Complete your account setup for {invitation?.tenant_name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit}
            className="space-y-6"
            autoComplete="on"
            name="onboardingForm"
          >
            <Alert className="bg-blue-50 border-blue-200">
              <CheckCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                You're creating the admin account for your organization. You'll
                be able to invite team members after setup.
              </AlertDescription>
            </Alert>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="firstName"
                    name="firstName"
                    type="text"
                    autoComplete="given-name"
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="lastName"
                    name="lastName"
                    type="text"
                    autoComplete="family-name"
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="off"
                  value={formData.email}
                  className="pl-10"
                  disabled
                  readOnly
                />
              </div>
              <p className="text-sm text-gray-500">
                This email was used for your invitation
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="pl-10"
                    required
                    minLength={6}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        confirmPassword: e.target.value,
                      })
                    }
                    className="pl-10"
                    required
                    minLength={6}
                  />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                "Create Account & Continue"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
