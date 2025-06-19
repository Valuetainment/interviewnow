import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import CompanyForm from "@/components/companies/CompanyForm";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Company } from "@/types/company";
import { useAuth } from "@/hooks/useAuth";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { Loader2 } from "lucide-react";

const EditCompany: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, role } = useAuth();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const { data: company, isLoading } = useQuery({
    queryKey: ["company", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      // Transform the data to match the new structure if needed
      return {
        ...data,
        benefits_data: data.benefits_data || {
          description: data.benefits || "",
          items: data.benefits_list || [],
        },
        values_data: data.values_data || {
          description: data.values || "",
          items: data.core_values || [],
        },
      } as Company;
    },
  });

  const handleSubmit = async (
    data: Omit<Company, "id" | "tenant_id" | "created_at" | "updated_at">
  ) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("companies")
        .update({
          name: data.name,
          culture: data.culture,
          story: data.story,
          benefits_data: data.benefits_data,
          values_data: data.values_data,
        })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Company updated successfully",
      });

      navigate("/companies");
    } catch (error) {
      console.error("Error updating company:", error);
      toast({
        title: "Error",
        description: "Failed to update company",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteCompany = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("companies" as any)
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast({
        title: "Company deleted",
        description: "Company has been successfully deleted.",
      });
      navigate("/companies");
    },
    onError: (error) => {
      console.error("Error deleting company:", error);
      toast({
        title: "Error deleting company",
        description:
          "There was an error deleting the company. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="container max-w-4xl py-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="container max-w-4xl py-8">
        <p>Company not found</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-24">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Edit Company</h1>

          {role === "tenant_admin" && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Company
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete
                    the company and remove associated data.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteCompany.mutate()}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        <CompanyForm
          initialData={{
            name: company.name,
            culture: company.culture,
            story: company.story,
            benefits_data: company.benefits_data,
            values_data: company.values_data,
          }}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
};

export default EditCompany;
