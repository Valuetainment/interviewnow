import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Search } from "lucide-react";
import CompanyList from "@/components/companies/CompanyList";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import CompanyCard from "@/components/companies/CompanyCard";
import { Company } from "@/types/company";

const Companies = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  
  const { data: companies, isLoading } = useQuery({
    queryKey: ["companies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      
      // Transform the data to match the new structure if needed
      // This handles backward compatibility for data that hasn't been migrated yet
      return (data || []).map(company => ({
        ...company,
        benefits_data: company.benefits_data || {
          description: company.benefits || "",
          items: company.benefits_list || []
        },
        values_data: company.values_data || {
          description: company.values || "",
          items: company.core_values || []
        }
      })) as Company[];
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
          <Button onClick={() => navigate("/companies/new")}>
            <Plus className="h-4 w-4 mr-2" />
            Add Company
          </Button>
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
