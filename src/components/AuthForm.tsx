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

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  companyCode: z.string().optional(),
  acceptTerms: z.literal(true, {
    errorMap: () => ({ message: "You must accept the terms and conditions" }),
  }),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type SignupFormValues = z.infer<typeof signupSchema>;

interface AuthFormProps {
  mode: "login" | "signup";
}

export const AuthForm: React.FC<AuthFormProps> = ({ mode }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
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

        // If company code is provided, verify it exists
        let tenantId: string | null = null;

        if (companyCode) {
          const { data: codeData, error: codeError } = await supabase
            .from("company_codes")
            .select("tenant_id")
            .eq("code", companyCode)
            .single();

          if (codeError || !codeData) {
            setAuthError(
              "Invalid company code. Please check with your administrator."
            );
            return;
          }

          tenantId = codeData.tenant_id;
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

        // Create user record in public.users table
        if (authData.user) {
          const { error: userError } = await supabase.from("users").insert([
            {
              id: authData.user.id,
              tenant_id: tenantId,
              role: "tenant_admin", // Default role for invited users
            },
          ]);

          if (userError) {
            console.error("Error creating user record:", userError);
          }
        }

        toast.success(
          "Account created successfully! Please check your email to verify."
        );
        navigate("/login");
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
