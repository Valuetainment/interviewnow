
import React from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import CompanyForm from "@/components/companies/CompanyForm";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const NewCompany = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const createCompany = useMutation({
    mutationFn: async (data: any) => {
      const { data: result, error } = await supabase
        .from("companies")
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result;
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
        <h1 className="text-3xl font-bold mb-8">Create New Company</h1>
        
        <CompanyForm 
          onSubmit={(data) => createCompany.mutate(data)}
          isSubmitting={createCompany.isPending}
        />
      </div>
    </div>
  );
};

export default NewCompany;
