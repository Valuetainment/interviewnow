
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { type Company } from "@/pages/Companies";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";

interface CompanySelectProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const CompanySelect: React.FC<CompanySelectProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const { data: companies, isLoading } = useQuery({
    queryKey: ["companies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("id, name")
        .order("name", { ascending: true });

      if (error) throw error;
      return data as Pick<Company, "id" | "name">[];
    },
  });

  return (
    <div className="flex gap-2 items-start">
      <Select
        value={value}
        onValueChange={onChange}
        disabled={disabled || isLoading}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a company" />
        </SelectTrigger>
        <SelectContent>
          {companies?.map((company) => (
            <SelectItem key={company.id} value={company.id}>
              {company.name}
            </SelectItem>
          ))}
          {companies?.length === 0 && (
            <div className="text-sm p-2 text-center text-muted-foreground">
              No companies found
            </div>
          )}
        </SelectContent>
      </Select>
      <Link to="/companies/new" tabIndex={-1}>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-10 w-10"
        >
          <Plus className="h-4 w-4" />
          <span className="sr-only">New Company</span>
        </Button>
      </Link>
    </div>
  );
};

export default CompanySelect;
