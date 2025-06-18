import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useInterviewerAccess } from "@/hooks/useInterviewerAccess";
import { toast } from "sonner";

interface Company {
  id: string;
  name: string;
  logo_url?: string;
  created_at: string;
  updated_at: string;
}

interface CompanyContextType {
  companies: Company[];
  selectedCompany: Company | null;
  setSelectedCompany: (company: Company | null) => void;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export const useCompany = () => {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error("useCompany must be used within a CompanyProvider");
  }
  return context;
};

export const CompanyProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { tenantId, isTenantInterviewer } = useAuth();
  const { getAccessibleCompanyIds, isLoading: accessLoading } =
    useInterviewerAccess();

  const fetchCompanies = async () => {
    if (!tenantId) {
      setLoading(false);
      return;
    }

    // Wait for interviewer access to load if user is an interviewer
    if (isTenantInterviewer && accessLoading) {
      return;
    }

    try {
      setLoading(true);

      let query = supabase
        .from("companies")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("name");

      // If user is a tenant interviewer, filter by accessible companies
      if (isTenantInterviewer) {
        const accessibleCompanyIds = getAccessibleCompanyIds();
        if (accessibleCompanyIds.length > 0) {
          query = query.in("id", accessibleCompanyIds);
        } else {
          // No accessible companies, return empty
          setCompanies([]);
          setLoading(false);
          return;
        }
      }

      const { data, error } = await query;

      if (error) throw error;

      setCompanies(data || []);

      // If there's only one company, auto-select it
      if (data && data.length === 1) {
        setSelectedCompany(data[0]);
      }
    } catch (err) {
      setError(err as Error);
      console.error("Error fetching companies:", err);
      toast.error("Failed to load companies");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, [tenantId, isTenantInterviewer, accessLoading]);

  const value = {
    companies,
    selectedCompany,
    setSelectedCompany,
    loading,
    error,
    refetch: fetchCompanies,
  };

  return (
    <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>
  );
};
