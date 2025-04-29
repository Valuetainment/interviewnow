
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Building, Plus, Search } from "lucide-react";
import CompanyList from "@/components/companies/CompanyList";
import { Input } from "@/components/ui/input";

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
  const [searchTerm, setSearchTerm] = useState("");
  
  const { data: companies, isLoading } = useQuery({
    queryKey: ["companies"],
    queryFn: async () => {
      // Use type assertion since we're mocking the DB call for now
      const { data, error } = await supabase
        .from("companies" as any)
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      return data as Company[];
    },
  });

  const filteredCompanies = companies?.filter(company => 
    company.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="container mx-auto px-4 py-24">
      <div className="max-w-screen-xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
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

        <div className="mb-8 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search companies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <CompanyList companies={filteredCompanies} isLoading={isLoading} />
      </div>
    </div>
  );
};

export default Companies;
