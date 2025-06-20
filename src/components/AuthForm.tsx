import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Mail, Lock, User, Building2 } from "lucide-react";
import { toast } from "sonner";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/useAuth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";

// Define the validation schemas
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  rememberMe: z.boolean().optional(),
});

const signupSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string(),
    companyCode: z.string().optional(),
    acceptTerms: z.literal(true, {
      errorMap: () => ({ message: "You must accept the terms and conditions" }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type LoginFormValues = z.infer<typeof loginSchema>;
type SignupFormValues = z.infer<typeof signupSchema>;

interface AuthFormProps {
  mode: "login" | "signup";
}

interface InvitationInfo {
  tenant_name: string;
  role: string;
  expires_at: string;
  email: string;
}

export const AuthForm: React.FC<AuthFormProps> = ({ mode }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [invitationInfo, setInvitationInfo] = useState<InvitationInfo | null>(
    null
  );
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signIn, signUp } = useAuth();

  // Get company code from URL if present
  const urlCompanyCode = searchParams.get("code");

  // Use the appropriate schema based on the form mode
  const form = useForm<LoginFormValues | SignupFormValues>({
    resolver: zodResolver(mode === "login" ? loginSchema : signupSchema),
    defaultValues:
      mode === "login"
        ? { email: "", password: "", rememberMe: false }
        : {
            name: "",
            email: "",
            password: "",
            confirmPassword: "",
            companyCode: urlCompanyCode || "",
            acceptTerms: false as any,
          },
  });

  // Update form when URL params change
  useEffect(() => {
    if (mode === "signup" && urlCompanyCode) {
      form.setValue("companyCode", urlCompanyCode);
    }
  }, [urlCompanyCode, mode, form]);

  // Fetch invitation info when company code is provided
  useEffect(() => {
    const fetchInvitationInfo = async () => {
      if (mode === "signup" && urlCompanyCode) {
        try {
          // Check if it's a tenant invitation
          const { data: inviteData, error } = await supabase
            .from("tenant_invitations")
            .select("tenant_name, role, expires_at, email")
            .eq("company_code", urlCompanyCode)
            .gte("expires_at", new Date().toISOString())
            .is("accepted_at", null)
            .single();

          if (inviteData && !error) {
            setInvitationInfo(inviteData);
            // Pre-fill the email if available
            if (inviteData.email) {
              form.setValue("email", inviteData.email);
            }
          }
        } catch (error) {
          console.error("Error fetching invitation info:", error);
        }
      }
    };

    fetchInvitationInfo();
  }, [urlCompanyCode, mode, form]);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const onSubmit = async (data: LoginFormValues | SignupFormValues) => {
    setIsLoading(true);
    setAuthError(null);

    try {
      if (mode === "login") {
        const { email, password } = data as LoginFormValues;
        await signIn(email, password);
        toast.success("Successfully logged in!");
        // signIn already handles navigation based on role
      } else {
        const { email, password, name, companyCode } = data as SignupFormValues;

        // If company code is provided, check both invitation types
        let tenantId: string | null = null;
        let userRole: string = "tenant_admin"; // Default role
        let invitationId: string | null = null;

        if (companyCode) {
          // First, check if it's a tenant invitation (from existing tenant admin)
          const { data: inviteData, error: inviteError } = await supabase
            .from("tenant_invitations")
            .select("*")
            .eq("company_code", companyCode)
            .eq("email", email) // Email must match invitation
            .gte("expires_at", new Date().toISOString())
            .is("accepted_at", null) // Not already accepted
            .single();

          if (inviteData && !inviteError) {
            // This is a tenant invitation
            tenantId = inviteData.tenant_id;
            userRole = inviteData.role || "tenant_interviewer";
            invitationId = inviteData.id;
          } else {
            // If not a tenant invitation, check if it's a company code (system admin invitation)
            const { data: codeData, error: codeError } = await supabase
              .from("company_codes")
              .select("tenant_id")
              .eq("code", companyCode)
              .single();

            if (codeError || !codeData) {
              // Check if invitation exists but email doesn't match
              const { data: anyInvite } = await supabase
                .from("tenant_invitations")
                .select("email")
                .eq("company_code", companyCode)
                .single();

              if (anyInvite) {
                setAuthError(
                  `This invitation is for ${anyInvite.email}. Please use the correct email address.`
                );
              } else {
                setAuthError(
                  "Invalid or expired invitation code. Please check with your administrator."
                );
              }
              return;
            }

            tenantId = codeData.tenant_id;
            // For company codes, keep default role as tenant_admin
          }
        }

        // Create the auth user
        const { error: signUpError, data: authData } =
          await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                full_name: name,
              },
            },
          });

        if (signUpError) throw signUpError;

        // For invited users, use the complete_tenant_onboarding function
        if (authData.user && companyCode) {
          // First, sign in the user so they're authenticated
          const { error: signInError } = await supabase.auth.signInWithPassword(
            {
              email,
              password,
            }
          );

          if (signInError) {
            console.error("Error signing in after signup:", signInError);
            toast.success("Account created successfully! Please log in.");
            navigate("/login");
            return;
          }

          // Now that user is authenticated, complete the onboarding
          console.log(
            "Calling complete_tenant_onboarding with code:",
            companyCode
          );
          const { data: onboardingResult, error: onboardingError } =
            await supabase.rpc("complete_tenant_onboarding", {
              p_company_code: companyCode,
            });

          if (onboardingError) {
            console.error("Error completing onboarding:", onboardingError);
            console.error("Onboarding error details:", {
              code: onboardingError.code,
              message: onboardingError.message,
              details: onboardingError.details,
              hint: onboardingError.hint,
            });
            // Fallback to manual creation
            const { error: userError } = await supabase.from("users").insert([
              {
                id: authData.user.id,
                tenant_id: tenantId,
                role: userRole,
              },
            ]);

            if (userError) {
              console.error("Error creating user record:", userError);
            }
          } else {
            console.log("Onboarding completed successfully:", onboardingResult);
            if (onboardingResult && !onboardingResult.success) {
              console.error(
                "Onboarding returned error:",
                onboardingResult.error
              );
            }
          }

          toast.success("Account created successfully!");
          // Navigate based on role
          if (userRole === "tenant_admin") {
            navigate("/dashboard");
          } else {
            // For interviewers, go to dashboard
            navigate("/dashboard");
          }
        } else if (authData.user) {
          // No company code - regular signup
          const { error: userError } = await supabase.from("users").insert([
            {
              id: authData.user.id,
              tenant_id: null,
              role: "user",
            },
          ]);

          if (userError) {
            console.error("Error creating user record:", userError);
          }

          toast.success(
            "Account created successfully! Please check your email to verify."
          );
          navigate("/login");
        }
      }
    } catch (error: any) {
      console.error("Authentication error:", error);
      setAuthError(error.message || "Authentication failed. Please try again.");
      toast.error(
        mode === "login"
          ? "Failed to log in. Please check your credentials."
          : "Failed to create account. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-card/50 backdrop-blur-sm p-8 rounded-lg border shadow-sm">
      {authError && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{authError}</AlertDescription>
        </Alert>
      )}

      {invitationInfo && mode === "signup" && (
        <Alert className="mb-6 bg-blue-50 border-blue-200">
          <AlertDescription>
            <div className="space-y-3">
              <h3 className="font-semibold text-lg text-blue-900">
                You've been invited to join {invitationInfo.tenant_name}
              </h3>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  {invitationInfo.role === "tenant_admin"
                    ? "Administrator"
                    : "Interviewer"}
                </span>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {mode === "signup" && (
            <>
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Enter your name"
                          className="pl-10"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {!invitationInfo && (
                <FormField
                  control={form.control}
                  name="companyCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Code (Optional)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Enter company code if provided"
                            className="pl-10"
                            {...field}
                            disabled={!!urlCompanyCode}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                      {urlCompanyCode && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Company code provided via invitation link
                        </p>
                      )}
                    </FormItem>
                  )}
                />
              )}
            </>
          )}

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      className="pl-10"
                      {...field}
                      disabled={mode === "signup" && !!invitationInfo?.email}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder={
                        mode === "login"
                          ? "Enter your password"
                          : "Create a password"
                      }
                      className="pl-10 pr-10"
                      {...field}
                      autoComplete={
                        mode === "login" ? "current-password" : "new-password"
                      }
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                      onClick={togglePasswordVisibility}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
                {mode === "signup" && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Password must be at least 8 characters and include
                    uppercase, lowercase, and numbers.
                  </p>
                )}
              </FormItem>
            )}
          />

          {mode === "signup" && (
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Confirm your password"
                        className="pl-10 pr-10"
                        {...field}
                        autoComplete="new-password"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {mode === "login" ? (
            <div className="flex items-center justify-between">
              <FormField
                control={form.control}
                name="rememberMe"
                render={({ field }) => (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="rememberMe"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                    <label
                      htmlFor="rememberMe"
                      className="text-sm font-medium cursor-pointer"
                    >
                      Remember me
                    </label>
                  </div>
                )}
              />
              <a
                href="/reset-password"
                className="text-sm text-primary hover:underline"
              >
                Forgot password?
              </a>
            </div>
          ) : (
            <FormField
              control={form.control}
              name="acceptTerms"
              render={({ field }) => (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="acceptTerms"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                  <div className="space-y-1 leading-none">
                    <label
                      htmlFor="acceptTerms"
                      className="text-sm font-medium cursor-pointer"
                    >
                      I accept the{" "}
                      <a href="/terms" className="text-primary hover:underline">
                        terms and conditions
                      </a>
                    </label>
                    <FormMessage />
                  </div>
                </div>
              )}
            />
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                {mode === "login" ? "Signing in..." : "Creating account..."}
              </span>
            ) : (
              <span>{mode === "login" ? "Sign in" : "Create account"}</span>
            )}
          </Button>

          {mode === "signup" && (
            <div className="text-xs text-muted-foreground text-center">
              By creating an account, you agree to our{" "}
              <a href="/terms" className="text-primary hover:underline">
                Terms of Service
              </a>{" "}
              and acknowledge our{" "}
              <a href="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </a>
              .
            </div>
          )}
        </form>
      </Form>
    </div>
  );
};
