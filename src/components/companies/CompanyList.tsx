
import React from "react";
import { type Company } from "@/pages/Companies";
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
          <Card key={i} className="p-6 space-y-4">
            <div className="h-6 bg-muted rounded w-3/4 animate-pulse"></div>
            <div className="h-4 bg-muted rounded w-full animate-pulse"></div>
            <div className="h-4 bg-muted rounded w-2/3 animate-pulse"></div>
            <div className="flex gap-2 mt-2">
              <div className="h-6 bg-muted rounded w-16 animate-pulse"></div>
              <div className="h-6 bg-muted rounded w-16 animate-pulse"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (companies.length === 0) {
    // Empty state
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="p-4 rounded-full bg-muted mb-4">
          <Building className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-medium mb-2">No companies found</h3>
        <p className="text-muted-foreground max-w-md">
          Create your first company to start adding positions and interviewing candidates.
        </p>
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
