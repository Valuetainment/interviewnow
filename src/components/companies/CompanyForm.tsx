
import React, { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { X, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

// Form validation schema
const formSchema = z.object({
  name: z.string().min(1, { message: "Company name is required" }),
  culture: z.string().optional().nullable(),
  story: z.string().optional().nullable(),
  values: z.string().optional().nullable(),
  benefits: z.string().optional().nullable(),
  core_values: z.array(z.string()).optional().nullable(),
  benefits_list: z.array(z.string()).optional().nullable(),
});

interface CompanyFormProps {
  initialData?: z.infer<typeof formSchema>;
  onSubmit: (data: z.infer<typeof formSchema>) => void;
  isSubmitting: boolean;
}

const CompanyForm: React.FC<CompanyFormProps> = ({
  initialData,
  onSubmit,
  isSubmitting,
}) => {
  const [newCoreValue, setNewCoreValue] = useState("");
  const [newBenefit, setNewBenefit] = useState("");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      name: "",
      culture: "",
      story: "",
      values: "",
      benefits: "",
      core_values: [],
      benefits_list: [],
    },
  });

  const handleAddCoreValue = () => {
    if (!newCoreValue.trim()) return;
    
    const currentValues = form.getValues("core_values") || [];
    form.setValue("core_values", [...currentValues, newCoreValue.trim()]);
    setNewCoreValue("");
  };

  const handleRemoveCoreValue = (index: number) => {
    const currentValues = form.getValues("core_values") || [];
    form.setValue(
      "core_values",
      currentValues.filter((_, i) => i !== index)
    );
  };

  const handleAddBenefit = () => {
    if (!newBenefit.trim()) return;
    
    const currentBenefits = form.getValues("benefits_list") || [];
    form.setValue("benefits_list", [...currentBenefits, newBenefit.trim()]);
    setNewBenefit("");
  };

  const handleRemoveBenefit = (index: number) => {
    const currentBenefits = form.getValues("benefits_list") || [];
    form.setValue(
      "benefits_list",
      currentBenefits.filter((_, i) => i !== index)
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter company name" {...field} />
                    </FormControl>
                    <FormDescription>
                      The official name of the organization
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="culture"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Culture</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the company culture"
                        className="min-h-[100px]"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormDescription>
                      Describe the work environment and company culture
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="story"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Story</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Share the company's history"
                        className="min-h-[100px]"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormDescription>
                      Share the company's history, founding, and journey
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="values"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Values</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the company's values"
                        className="min-h-[100px]"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormDescription>
                      Explain what principles guide the company
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="benefits"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>General Benefits</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the general benefits package"
                        className="min-h-[100px]"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormDescription>
                      Give an overview of the company's benefits package
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="core_values"
                render={() => (
                  <FormItem>
                    <FormLabel>Core Values List</FormLabel>
                    <div className="flex gap-2">
                      <Input
                        value={newCoreValue}
                        onChange={(e) => setNewCoreValue(e.target.value)}
                        placeholder="Add a core value"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddCoreValue();
                          }
                        }}
                      />
                      <Button
                        type="button"
                        onClick={handleAddCoreValue}
                        variant="secondary"
                      >
                        <Plus className="h-4 w-4 mr-1" /> Add
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {form.watch("core_values")?.map((value, index) => (
                        <Badge
                          key={`${value}-${index}`}
                          className="flex items-center gap-1 py-1.5"
                          variant="secondary"
                        >
                          {value}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4 ml-1 rounded-full"
                            onClick={() => handleRemoveCoreValue(index)}
                          >
                            <X className="h-3 w-3" />
                            <span className="sr-only">Remove {value}</span>
                          </Button>
                        </Badge>
                      ))}
                    </div>
                    <FormDescription>
                      Add specific core values like "Innovation", "Teamwork", etc.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="benefits_list"
                render={() => (
                  <FormItem>
                    <FormLabel>Benefits List</FormLabel>
                    <div className="flex gap-2">
                      <Input
                        value={newBenefit}
                        onChange={(e) => setNewBenefit(e.target.value)}
                        placeholder="Add a benefit"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddBenefit();
                          }
                        }}
                      />
                      <Button
                        type="button"
                        onClick={handleAddBenefit}
                        variant="secondary"
                      >
                        <Plus className="h-4 w-4 mr-1" /> Add
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {form.watch("benefits_list")?.map((benefit, index) => (
                        <Badge
                          key={`${benefit}-${index}`}
                          className="flex items-center gap-1 py-1.5"
                          variant="outline"
                        >
                          {benefit}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4 ml-1 rounded-full"
                            onClick={() => handleRemoveBenefit(index)}
                          >
                            <X className="h-3 w-3" />
                            <span className="sr-only">Remove {benefit}</span>
                          </Button>
                        </Badge>
                      ))}
                    </div>
                    <FormDescription>
                      Add specific benefits like "Health Insurance", "Remote Work", etc.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4 justify-end">
          <Link to="/companies">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : initialData ? "Update Company" : "Create Company"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default CompanyForm;
