import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Company {
  id: string;
  name: string;
}

interface CompanyContextType {
  companies: Company[];
  selectedCompany: Company | null;
  setSelectedCompany: (company: Company | null) => void;
  loading: boolean;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export const CompanyProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { tenantId } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompanies = async () => {
      if (!tenantId) return;

      try {
        const { data, error } = await supabase
          .from("companies")
          .select("id, name")
          .eq("tenant_id", tenantId)
          .order("name");

        if (error) {
          console.error("Error fetching companies:", error);
        } else {
          setCompanies(data || []);
          // Set the first company as selected if none is selected
          if (data && data.length > 0 && !selectedCompany) {
            setSelectedCompany(data[0]);
          }
        }
      } catch (error) {
        console.error("Error fetching companies:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanies();
  }, [tenantId]);

  return (
    <CompanyContext.Provider
      value={{ companies, selectedCompany, setSelectedCompany, loading }}
    >
      {children}
    </CompanyContext.Provider>
  );
};

export const useCompany = () => {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error("useCompany must be used within a CompanyProvider");
  }
  return context;
};
