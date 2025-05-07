import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import CompanyForm from "@/components/companies/CompanyForm";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Define the Company type based on the database schema
export type CompanyData = {
  name: string;
  culture?: string;
  story?: string;
  values?: string;
  benefits?: string;
  core_values?: string[];
  benefits_list?: string[];
  tenant_id?: string;
};

const NewCompany = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tenantId, setTenantId] = useState<string | null>(null);

  // Fetch tenant ID when component mounts
  useEffect(() => {
    const fetchTenantId = async () => {
      // First try to get from auth session
      const { data } = await supabase.auth.getSession();
      let tenant = data.session?.user?.app_metadata?.tenant_id;
      
      if (!tenant) {
        // If not in auth metadata, get from database
        console.log("Tenant ID not found in app_metadata, checking database...");
        const { data: userData, error } = await supabase
          .from('users')
          .select('tenant_id')
          .eq('id', data.session?.user?.id)
          .single();
          
        if (error) {
          console.error("Error fetching tenant_id:", error);
          return;
        }
        
        if (userData?.tenant_id) {
          tenant = userData.tenant_id;
          console.log("Found tenant ID in database:", tenant);
        } else {
          console.log("No tenant ID found in database");
        }
      } else {
        console.log("Found tenant ID in app_metadata:", tenant);
      }
      
      setTenantId(tenant);
    };
    
    fetchTenantId();
  }, []);

  const createCompany = useMutation({
    mutationFn: async (data: CompanyData) => {
      // Log authentication state for debugging
      const { data: sessionData } = await supabase.auth.getSession();
      console.log("Auth session details:", {
        userId: sessionData.session?.user?.id,
        email: sessionData.session?.user?.email,
        tenantInMetadata: sessionData.session?.user?.app_metadata?.tenant_id,
        isDevelopment: import.meta.env.DEV,
        supabaseUrl: import.meta.env.DEV ? 
          "http://127.0.0.1:54321" : 
          "https://gypnutyegqxelvsqjedu.supabase.co"
      });
      
      // Include the tenant_id in the data
      const companyData = {
        ...data,
        tenant_id: tenantId
      };
      
      console.log("Creating company with data:", companyData);
      
      try {
        // Cast the table name to any to bypass TypeScript error until Supabase types are properly set up
        const { data: result, error } = await supabase
          .from('companies' as any)
          .insert(companyData as any)
          .select()
          .single();

        if (error) {
          console.error("Company insertion error:", error);
          throw error;
        }
        
        console.log("Company created successfully:", result);
        return result;
      } catch (error) {
        console.error("Detailed error during company creation:", error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Company created",
        description: "Company has been successfully created.",
      });
      navigate("/companies");
    },
    onError: (error) => {
      console.error("Error creating company:", error);
      toast({
        title: "Error creating company",
        description: "There was an error creating the company. Please try again.",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="container mx-auto px-4 py-24">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Create New Company</h1>
          <p className="text-muted-foreground mt-2">
            Add a new organization to your system
          </p>
        </div>
        
        <div className="bg-slate-50 border border-slate-100 rounded-lg p-6">
          <CompanyForm 
            onSubmit={(data) => createCompany.mutate(data as CompanyData)}
            isSubmitting={createCompany.isPending}
          />
        </div>
      </div>
    </div>
  );
};

export default NewCompany;
