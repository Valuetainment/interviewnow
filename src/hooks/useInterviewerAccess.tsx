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
    console.log(
      "useInterviewerAccess: Effect triggered, user:",
      user?.id,
      "isTenantInterviewer:",
      isTenantInterviewer
    );
    if (!user || !isTenantInterviewer) {
      console.log(
        "useInterviewerAccess: No user or not interviewer, setting empty"
      );
      setAccessibleCompanies([]);
      setIsLoading(false);
      return;
    }

    fetchAccessibleCompanies();
  }, [user, isTenantInterviewer]);

  const fetchAccessibleCompanies = async () => {
    try {
      setIsLoading(true);
      console.log("useInterviewerAccess: Fetching for user:", user?.id);

      const { data, error } = await supabase
        .from("interviewer_company_access")
        .select(
          `
          company_id,
          created_at,
          granted_by,
          companies (
            id,
            name
          )
        `
        )
        .eq("user_id", user!.id);

      if (error) {
        console.error("useInterviewerAccess: Query error:", error);
        throw error;
      }

      console.log("useInterviewerAccess: Raw data:", data);

      // Transform the data to match the expected structure
      const transformedData = (data || []).map((item) => ({
        ...item,
        granted_at: item.created_at,
        company: item.companies,
      }));

      console.log("useInterviewerAccess: Transformed data:", transformedData);
      setAccessibleCompanies(transformedData);
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
    if (!isTenantInterviewer) {
      console.log(
        "useInterviewerAccess: getAccessibleCompanyIds - not interviewer, returning empty"
      );
      return [];
    }
    const ids = accessibleCompanies.map((access) => access.company_id);
    console.log(
      "useInterviewerAccess: getAccessibleCompanyIds returning:",
      ids
    );
    return ids;
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
