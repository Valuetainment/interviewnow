
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Building, Plus } from "lucide-react";
import CompanyList from "@/components/companies/CompanyList";

export type Company = {
  id: string;
  name: string;
  culture: string | null;
  story: string | null;
  values: string | null;
  benefits: string | null;
  core_values: string[] | null;
  benefits_list: string[] | null;
  created_at: string;
  updated_at: string;
};

const Companies = () => {
  const { data: companies, isLoading } = useQuery({
    queryKey: ["companies"],
    queryFn: async () => {
      // This is a mock implementation; it will need to be updated
      // when the actual Supabase table is created
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      return data as Company[];
    },
  });

  return (
    <div className="container mx-auto px-4 py-24">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Companies</h1>
          <p className="text-muted-foreground mt-2">
            Manage your organization profiles
          </p>
        </div>
        <Link to="/companies/new">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Company
          </Button>
        </Link>
      </div>

      <CompanyList companies={companies || []} isLoading={isLoading} />
    </div>
  );
};

export default Companies;
