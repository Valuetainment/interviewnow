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
  refreshUserData: (userId?: string) => Promise<void>;
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

        // Try to get tenant_id and role from app_metadata first
        const appMetadataTenantId = data.session?.user?.app_metadata?.tenant_id;
        const appMetadataRole = data.session?.user?.app_metadata?.role;

        if (data.session?.user) {
          // If role or tenant_id not in app_metadata, fetch from database
          if (!appMetadataRole || !appMetadataTenantId) {
            const { data: userData, error: userError } = await supabase
              .from("users")
              .select("tenant_id, role")
              .eq("id", data.session.user.id)
              .maybeSingle();

            if (userError) {
              console.error("Error fetching user data:", userError);
              setTenantId(appMetadataTenantId || null);
              setRole(appMetadataRole || null);
            } else if (userData) {
              console.log("Fetched user data from database:", userData);
              setTenantId(userData.tenant_id || appMetadataTenantId || null);
              setRole(userData.role || appMetadataRole || null);
            } else {
              // No user data found yet, use defaults
              console.log("No user data found yet, using defaults");
              setTenantId(appMetadataTenantId || null);
              setRole(appMetadataRole || null);
            }
          } else {
            setTenantId(appMetadataTenantId);
            setRole(appMetadataRole);
          }
        } else {
          setTenantId(null);
          setRole(null);
        }
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

        // Get metadata values
        const userTenantId = newSession?.user?.app_metadata?.tenant_id;
        const userRole = newSession?.user?.app_metadata?.role;

        if (newSession?.user) {
          // If role or tenantId is not in app_metadata, try to fetch from database
          if (!userRole || !userTenantId) {
            console.log(
              "Role or Tenant ID not found in app_metadata, checking database..."
            );
            // Fetch from users table
            supabase
              .from("users")
              .select("tenant_id, role")
              .eq("id", newSession.user.id)
              .maybeSingle()
              .then(({ data, error }) => {
                if (error) {
                  console.error("Error fetching user data:", error);
                  // Set whatever we have from app_metadata
                  setTenantId(userTenantId || null);
                  setRole(userRole || null);
                } else if (data) {
                  console.log("Found user data in database:", data);
                  console.log(
                    "Setting tenantId:",
                    data.tenant_id || userTenantId || null
                  );
                  console.log("Setting role:", data.role || userRole || null);
                  setTenantId(data.tenant_id || userTenantId || null);
                  setRole(data.role || userRole || null);
                } else {
                  // No user data found yet, use defaults
                  console.log("No user data found yet in auth state change");
                  setTenantId(userTenantId || null);
                  setRole(userRole || null);
                }
              });
          } else {
            // We have both from app_metadata
            setTenantId(userTenantId);
            setRole(userRole);
          }
        } else {
          // No user, clear everything
          setTenantId(null);
          setRole(null);
        }

        setIsLoading(false);
      }
    );

    // Cleanup subscription
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Function to refresh user data from database
  const refreshUserData = async (userId?: string) => {
    const targetUserId = userId || user?.id || session?.user?.id;
    if (!targetUserId) {
      console.error("No user ID available for refreshing data");
      return;
    }

    console.log("Refreshing user data for user:", targetUserId);
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("tenant_id, role")
      .eq("id", targetUserId)
      .maybeSingle();

    if (userError) {
      console.error("Error refreshing user data:", userError);
    } else if (userData) {
      console.log("Refreshed user data:", userData);
      setTenantId(userData.tenant_id);
      setRole(userData.role);
    } else {
      console.log("No user data found when refreshing");
    }
  };

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
        .maybeSingle();

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
    refreshUserData,
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
