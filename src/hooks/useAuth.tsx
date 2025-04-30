import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../integrations/supabase/client';

// Define the context types
interface AuthContextType {
  user: User | null;
  session: Session | null;
  tenantId: string | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, tenantId: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

// Create the authentication context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create a provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const fetchSession = async () => {
      setIsLoading(true);
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error fetching session:', error);
      } else {
        setSession(data.session);
        setUser(data.session?.user || null);
        setTenantId(data.session?.user?.app_metadata?.tenant_id || null);
      }
      
      setIsLoading(false);
    };

    fetchSession();

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event, newSession) => {
      console.log('Auth state changed:', { 
        event, 
        user: newSession?.user,
        metadata: newSession?.user?.app_metadata,
        tenantId: newSession?.user?.app_metadata?.tenant_id 
      });
      
      setSession(newSession);
      setUser(newSession?.user || null);
      
      // If tenantId is not in app_metadata, try to fetch it from the database
      const userTenantId = newSession?.user?.app_metadata?.tenant_id;
      if (newSession?.user && !userTenantId) {
        console.log('Tenant ID not found in app_metadata, checking database...');
        // Fetch tenant ID from users table
        supabase
          .from('users')
          .select('tenant_id')
          .eq('id', newSession.user.id)
          .single()
          .then(({ data, error }) => {
            if (error) {
              console.error('Error fetching tenant ID from database:', error);
            } else if (data?.tenant_id) {
              console.log('Found tenant ID in database:', data.tenant_id);
              setTenantId(data.tenant_id);
            }
          });
      } else {
        setTenantId(userTenantId);
      }
      
      setIsLoading(false);
    });

    // Cleanup subscription
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Sign in with email/password
  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setIsLoading(false);
    
    if (error) {
      throw error;
    }
  };

  // Sign up with email/password
  const signUp = async (email: string, password: string, tenantId: string) => {
    setIsLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          tenant_id: tenantId,
        },
      },
    });
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
    isLoading,
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
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

// Custom hook to check if user is authenticated
export const useRequireAuth = (redirectTo = '/login') => {
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