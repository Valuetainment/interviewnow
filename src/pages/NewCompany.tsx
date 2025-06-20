import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import CompanyForm from "@/components/companies/CompanyForm";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Company } from "@/types/company";
import { useAuth } from "@/hooks/useAuth";

const NewCompany: React.FC = () => {
  const navigate = useNavigate();
  const { isTenantAdmin, isSystemAdmin } = useAuth();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  useEffect(() => {
    // Redirect if user doesn't have permission to create companies
    if (!isTenantAdmin && !isSystemAdmin) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to create companies",
        variant: "destructive",
      });
      navigate("/dashboard");
    }
  }, [isTenantAdmin, isSystemAdmin, navigate]);

  const handleSubmit = async (
    data: Omit<Company, "id" | "tenant_id" | "created_at" | "updated_at">
  ) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("companies").insert({
        name: data.name,
        about: data.about,
        mission: data.mission,
        vision: data.vision,
        culture: data.culture,
        story: data.story,
        benefits_data: data.benefits_data,
        values_data: data.values_data,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Company created successfully",
      });

      navigate("/companies");
    } catch (error) {
      console.error("Error creating company:", error);
      toast({
        title: "Error",
        description: "Failed to create company",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container max-w-4xl py-8">
      <h1 className="text-3xl font-bold mb-8">Create New Company</h1>
      <CompanyForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
    </div>
  );
};

export default NewCompany;
