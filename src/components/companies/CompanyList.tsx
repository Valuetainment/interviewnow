import React from "react";
import { type Company } from "@/types/company";
import CompanyCard from "./CompanyCard";
import { Card } from "@/components/ui/card";
import { Building } from "lucide-react";

interface CompanyListProps {
  companies: Company[];
  isLoading: boolean;
}

const CompanyList: React.FC<CompanyListProps> = ({ companies, isLoading }) => {
  if (isLoading) {
    // Skeleton loading state
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="p-6 space-y-4 border-l-4 border-l-muted animate-pulse">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded-full bg-muted"></div>
              <div className="h-6 bg-muted rounded w-3/4"></div>
            </div>
            <div className="h-4 bg-muted rounded w-full"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
            <div className="flex gap-2 mt-2">
              <div className="h-6 bg-muted rounded w-16"></div>
              <div className="h-6 bg-muted rounded w-16"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (companies.length === 0) {
    // Empty state
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="p-6 rounded-full bg-slate-50 mb-6 border border-slate-200">
          <Building className="h-12 w-12 text-primary/60" />
        </div>
        <h3 className="text-2xl font-medium mb-3">No companies found</h3>
        <p className="text-muted-foreground max-w-md mb-8">
          Create your first company to start adding positions and interviewing candidates.
        </p>
        <div className="w-48 h-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {companies.map((company) => (
        <CompanyCard key={company.id} company={company} />
      ))}
    </div>
  );
};

export default CompanyList;
