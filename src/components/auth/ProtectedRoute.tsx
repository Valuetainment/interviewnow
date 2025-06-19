import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  requireSystemAdmin?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles = [],
  requireSystemAdmin = false,
}) => {
  const { user, role, isLoading, isSystemAdmin } = useAuth();

  // Wait for auth state to be fully loaded, including role data
  // If user exists but role is still null, keep loading
  if (isLoading || (user && role === null)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireSystemAdmin && !isSystemAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  if (allowedRoles.length > 0 && role && !allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
