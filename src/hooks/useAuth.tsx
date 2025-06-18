import React, { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "../integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

// Define the context types
interface AuthContextType {
  user: User | null;
  session: Session | null;
  tenantId: string | null;
  role: string | null;
  isLoading: boolean;
  isSystemAdmin: boolean;
  isTenantAdmin: boolean;
  isTenantInterviewer: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

// Create the authentication context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create a provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Get initial session
    const fetchSession = async () => {
      setIsLoading(true);
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error("Error fetching session:", error);
      } else {
        setSession(data.session);
        setUser(data.session?.user || null);
        setTenantId(data.session?.user?.app_metadata?.tenant_id || null);
        setRole(data.session?.user?.app_metadata?.role || null);
      }

      setIsLoading(false);
    };

    fetchSession();

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        console.log("Auth state changed:", {
          event,
          user: newSession?.user,
          metadata: newSession?.user?.app_metadata,
          tenantId: newSession?.user?.app_metadata?.tenant_id,
          role: newSession?.user?.app_metadata?.role,
        });

        setSession(newSession);
        setUser(newSession?.user || null);

        // If tenantId is not in app_metadata, try to fetch it from the database
        const userTenantId = newSession?.user?.app_metadata?.tenant_id;
        if (newSession?.user && !userTenantId) {
          console.log(
            "Tenant ID not found in app_metadata, checking database..."
          );
          // Fetch tenant ID from users table
          supabase
            .from("users")
            .select("tenant_id, role")
            .eq("id", newSession.user.id)
            .single()
            .then(({ data, error }) => {
              if (error) {
                console.error("Error fetching user data:", error);
              } else if (data) {
                console.log("Found user data in database:", data);
                setTenantId(data.tenant_id);
                setRole(data.role);
              }
            });
        } else {
          setTenantId(userTenantId);
        }

        setIsLoading(false);
      }
    );

    // Cleanup subscription
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Sign in with email/password
  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setIsLoading(false);

    if (error) {
      throw error;
    }

    if (data.user) {
      // Fetch user role after sign in
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("tenant_id, role")
        .eq("id", data.user.id)
        .single();

      if (userError) {
        console.error("Error fetching user data after sign in:", userError);
      } else if (userData) {
        setTenantId(userData.tenant_id);
        setRole(userData.role);

        // Route based on role
        if (userData.role === "system_admin") {
          navigate("/system-admin");
        } else {
          navigate("/dashboard");
        }
      }
    }
  };

  // Sign up with email/password
  const signUp = async (email: string, password: string) => {
    setIsLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    setIsLoading(false);

    if (error) {
      throw error;
    }
  };

  // Sign out
  const signOut = async () => {
    setIsLoading(true);
    const { error } = await supabase.auth.signOut();
    setIsLoading(false);

    if (error) {
      throw error;
    }

    setTenantId(null);
    setRole(null);
    navigate("/");
    toast.success("Signed out successfully");
  };

  // Reset password
  const resetPassword = async (email: string) => {
    setIsLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    setIsLoading(false);

    if (error) {
      throw error;
    }
  };

  // Create the value object for the context
  const value = {
    user,
    session,
    tenantId,
    role,
    isLoading,
    isSystemAdmin: role === "system_admin",
    isTenantAdmin: role === "tenant_admin",
    isTenantInterviewer: role === "tenant_interviewer",
    signIn,
    signUp,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};

// Custom hook to check if user is authenticated
export const useRequireAuth = (redirectTo = "/login") => {
  const { user, isLoading } = useAuth();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        window.location.href = redirectTo;
      } else {
        setIsReady(true);
      }
    }
  }, [user, isLoading, redirectTo]);

  return { user, isReady };
};

export default useAuth;
