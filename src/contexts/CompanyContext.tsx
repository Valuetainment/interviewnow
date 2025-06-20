import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useInterviewerAccess } from "@/hooks/useInterviewerAccess";
import { toast } from "sonner";
import { Company } from "@/types/company";

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
  const { tenantId, isTenantInterviewer, isTenantAdmin } = useAuth();
  const { getAccessibleCompanyIds, isLoading: accessLoading } =
    useInterviewerAccess();

  const fetchCompanies = async () => {
    if (!tenantId) {
      console.log("CompanyContext: No tenantId, skipping fetch");
      setLoading(false);
      return;
    }

    // Wait for interviewer access to load if user is an interviewer
    if (isTenantInterviewer && accessLoading) {
      console.log("CompanyContext: Waiting for interviewer access to load");
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
        console.log(
          "CompanyContext: Interviewer accessible companies:",
          accessibleCompanyIds
        );

        if (accessibleCompanyIds.length > 0) {
          query = query.in("id", accessibleCompanyIds);
        } else {
          // No accessible companies, return empty
          console.log(
            "CompanyContext: No accessible companies for interviewer"
          );
          setCompanies([]);
          setLoading(false);
          return;
        }
      }

      const { data, error } = await query;

      if (error) throw error;

      console.log("CompanyContext: Fetched companies:", data);

      // Transform data to ensure compatibility with Company type
      const transformedData = (data || []).map((company) => ({
        ...company,
        about: company.about || null,
        mission: company.mission || null,
        vision: company.vision || null,
        benefits_data: company.benefits_data || { description: "", items: [] },
        values_data: company.values_data || { description: "", items: [] },
        culture: company.culture || null,
        story: company.story || null,
      })) as Company[];

      setCompanies(transformedData);

      // Auto-select a company if none is selected
      if (transformedData && transformedData.length > 0) {
        // If no company is selected, or the selected company is no longer in the list
        if (
          !selectedCompany ||
          !transformedData.find((c) => c.id === selectedCompany.id)
        ) {
          console.log(
            "CompanyContext: Auto-selecting first company:",
            transformedData[0]
          );
          setSelectedCompany(transformedData[0]);
        }
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

  // Custom setter that prevents clearing selection for tenant admins
  const handleSetSelectedCompany = (company: Company | null) => {
    // For tenant admins, don't allow clearing the selection if companies exist
    if (isTenantAdmin && !company && companies.length > 0) {
      // Keep the current selection or select the first company
      if (!selectedCompany) {
        setSelectedCompany(companies[0]);
      }
      return;
    }
    setSelectedCompany(company);
  };

  const value = {
    companies,
    selectedCompany,
    setSelectedCompany: handleSetSelectedCompany,
    loading,
    error,
    refetch: fetchCompanies,
  };

  return (
    <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>
  );
};
