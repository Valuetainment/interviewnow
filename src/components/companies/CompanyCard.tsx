import React from "react";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Building2, Calendar, Edit, Users } from "lucide-react";
import { format } from "date-fns";
import { Company } from "@/types/company";

interface CompanyCardProps {
  company: Company;
}

const CompanyCard: React.FC<CompanyCardProps> = ({ company }) => {
  const totalItems = (company.values_data?.items?.length || 0) + (company.benefits_data?.items?.length || 0);
  const displayLimit = 6;
  
  // Combine values and benefits for display
  const allItems = [
    ...(company.values_data?.items || []).map(item => ({ text: item, type: 'value' as const })),
    ...(company.benefits_data?.items || []).map(item => ({ text: item, type: 'benefit' as const }))
  ];
  
  const displayItems = allItems.slice(0, displayLimit);
  const remainingCount = totalItems - displayLimit;

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow border-l-4 border-l-primary">
      <CardHeader className="pb-2 bg-gradient-to-r from-slate-50 to-transparent">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold text-lg line-clamp-1">{company.name}</h3>
          </div>
          <Link to={`/companies/${company.id}/edit`}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Edit className="h-4 w-4" />
              <span className="sr-only">Edit</span>
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {company.culture || "No company description available."}
        </p>
        
        <div className="flex flex-wrap gap-1.5">
          {displayItems.map((item, index) => (
            <Badge
              key={index}
              variant={item.type === 'value' ? 'secondary' : 'outline'}
            >
              {item.text}
            </Badge>
          ))}
          {remainingCount > 0 && (
            <Badge variant="secondary" className="bg-muted">
              +{remainingCount} more
            </Badge>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-2 text-xs text-muted-foreground flex items-center justify-between border-t border-slate-100">
        <div className="flex items-center gap-1.5">
          <Calendar className="h-3 w-3" />
          {company.created_at && format(new Date(company.created_at), "MMM d, yyyy")}
        </div>
        <div className="flex items-center gap-1.5">
          <Users className="h-3 w-3" />
          <span>4 positions</span>
        </div>
      </CardFooter>
    </Card>
  );
};

export default CompanyCard;
