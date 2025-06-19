import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Plus, Search } from "lucide-react";
import CompanyList from "@/components/companies/CompanyList";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useCompany } from "@/contexts/CompanyContext";

const Companies = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const { role } = useAuth();
  const { companies, loading: isLoading } = useCompany();

  const filteredCompanies =
    companies?.filter((company) =>
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
          {role === "tenant_admin" && (
            <Button onClick={() => navigate("/companies/new")}>
              <Plus className="h-4 w-4 mr-2" />
              Add Company
            </Button>
          )}
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
