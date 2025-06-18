import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface AccessibleCompany {
  company_id: string;
  granted_at: string;
  granted_by: string;
  company: {
    id: string;
    name: string;
  };
}

export const useInterviewerAccess = () => {
  const { user, isTenantInterviewer } = useAuth();
  const [accessibleCompanies, setAccessibleCompanies] = useState<
    AccessibleCompany[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user || !isTenantInterviewer) {
      setAccessibleCompanies([]);
      setIsLoading(false);
      return;
    }

    fetchAccessibleCompanies();
  }, [user, isTenantInterviewer]);

  const fetchAccessibleCompanies = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("interviewer_company_access")
        .select(
          `
          company_id,
          granted_at,
          granted_by,
          companies (
            id,
            name
          )
        `
        )
        .eq("user_id", user!.id);

      if (error) throw error;
      setAccessibleCompanies(data || []);
    } catch (err) {
      setError(err as Error);
      console.error("Error fetching accessible companies:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const hasAccessToCompany = (companyId: string): boolean => {
    if (!isTenantInterviewer) return true; // Non-interviewers have access to all companies
    return accessibleCompanies.some(
      (access) => access.company_id === companyId
    );
  };

  const getAccessibleCompanyIds = (): string[] => {
    if (!isTenantInterviewer) return []; // Return empty array for non-interviewers (no filtering needed)
    return accessibleCompanies.map((access) => access.company_id);
  };

  return {
    accessibleCompanies,
    isLoading,
    error,
    hasAccessToCompany,
    getAccessibleCompanyIds,
    refetch: fetchAccessibleCompanies,
  };
};
