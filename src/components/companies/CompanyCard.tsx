
import React from "react";
import { type Company } from "@/pages/Companies";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Building, Calendar, Edit, Users } from "lucide-react";
import { format } from "date-fns";

interface CompanyCardProps {
  company: Company;
}

const CompanyCard: React.FC<CompanyCardProps> = ({ company }) => {
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow border-l-4 border-l-primary">
      <CardHeader className="pb-2 bg-gradient-to-r from-slate-50 to-transparent">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <Building className="h-5 w-5 text-primary" />
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
          {company.core_values?.slice(0, 3).map((value, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {value}
            </Badge>
          ))}

          {company.benefits_list?.slice(0, 3).map((benefit, index) => (
            <Badge key={`benefit-${index}`} variant="outline" className="text-xs bg-slate-50">
              {benefit}
            </Badge>
          ))}
          
          {(company.core_values?.length ?? 0) + (company.benefits_list?.length ?? 0) > 6 && (
            <Badge variant="secondary" className="text-xs">
              +{(company.core_values?.length ?? 0) + (company.benefits_list?.length ?? 0) - 6} more
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
