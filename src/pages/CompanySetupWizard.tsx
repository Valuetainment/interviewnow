import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/CompanyContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import {
  Building2,
  Users,
  Target,
  ArrowRight,
  CheckCircle,
  Loader2,
  Plus,
} from "lucide-react";

interface CompanyFormData {
  name: string;
  about: string;
  mission: string;
  vision: string;
  benefits_description: string;
  benefits_items: string[];
  values_description: string;
  values_items: string[];
}

export const CompanySetupWizard: React.FC = () => {
  const navigate = useNavigate();
  const { refetch } = useCompany();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [checkingExisting, setCheckingExisting] = useState(true);
  const [hasExistingCompany, setHasExistingCompany] = useState(false);

  const [formData, setFormData] = useState<CompanyFormData>({
    name: "",
    about: "",
    mission: "",
    vision: "",
    benefits_description: "",
    benefits_items: [""],
    values_description: "",
    values_items: [""],
  });

  useEffect(() => {
    checkExistingCompany();
  }, []);

  const checkExistingCompany = async () => {
    try {
      // Get the current user's tenant_id
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("tenant_id")
        .single();

      if (userError) {
        console.error("Error getting user data:", userError);
        setCheckingExisting(false);
        return;
      }

      // Check if the tenant already has a company
      let query = supabase.from("companies").select("id");

      // Filter by tenant_id if user has one
      if (userData?.tenant_id) {
        query = query.eq("tenant_id", userData.tenant_id);
      }

      const { data: companies, error } = await query.limit(1);

      if (error) throw error;

      if (companies && companies.length > 0) {
        // Tenant already has a company, just note it but don't redirect
        setHasExistingCompany(true);
      }
    } catch (error) {
      console.error("Error checking existing company:", error);
    } finally {
      setCheckingExisting(false);
    }
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const addItem = (field: "benefits_items" | "values_items") => {
    setFormData({
      ...formData,
      [field]: [...formData[field], ""],
    });
  };

  const removeItem = (
    field: "benefits_items" | "values_items",
    index: number
  ) => {
    setFormData({
      ...formData,
      [field]: formData[field].filter((_, i) => i !== index),
    });
  };

  const updateItem = (
    field: "benefits_items" | "values_items",
    index: number,
    value: string
  ) => {
    const items = [...formData[field]];
    items[index] = value;
    setFormData({ ...formData, [field]: items });
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      // Get current user for tenant_id
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Prepare company data
      const companyData = {
        name: formData.name,
        about: formData.about,
        mission: formData.mission,
        vision: formData.vision,
        benefits_data: {
          description: formData.benefits_description,
          items: formData.benefits_items.filter((item) => item.trim() !== ""),
        },
        values_data: {
          description: formData.values_description,
          items: formData.values_items.filter((item) => item.trim() !== ""),
        },
      };

      const { error } = await supabase.from("companies").insert(companyData);

      if (error) throw error;

      toast.success("Company created successfully!");

      // Refresh the company context to pick up the new company
      await refetch();

      navigate("/dashboard");
    } catch (error) {
      console.error("Error creating company:", error);
      toast.error("Failed to create company");
    } finally {
      setLoading(false);
    }
  };

  if (checkingExisting) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.name.trim() !== "" && formData.about.trim() !== "";
      case 2:
        return formData.mission.trim() !== "" && formData.vision.trim() !== "";
      case 3:
        return (
          formData.benefits_description.trim() !== "" &&
          formData.values_description.trim() !== "" &&
          formData.benefits_items.some((item) => item.trim() !== "") &&
          formData.values_items.some((item) => item.trim() !== "")
        );
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        {/* Welcome Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">
            Welcome to InterviewNow! 🎉
          </h1>
          <p className="text-xl text-gray-600">
            Let's set up your first company in just a few steps
          </p>
        </div>

        {/* Alert if company already exists */}
        {hasExistingCompany && (
          <Alert className="mb-6">
            <AlertDescription>
              You already have a company set up. You can{" "}
              <Button
                variant="link"
                className="p-0 h-auto font-semibold"
                onClick={() => navigate("/dashboard")}
              >
                return to your dashboard
              </Button>{" "}
              or continue to create another company.
            </AlertDescription>
          </Alert>
        )}

        {/* Progress Bar */}
        <div className="mb-8">
          <Progress
            value={(currentStep / 3) * 100}
            className="h-3 bg-gray-200 [&>div]:bg-blue-600"
          />
          <div className="flex justify-between mt-3">
            <span
              className={`text-sm font-medium transition-colors flex items-center gap-1 ${
                currentStep > 1
                  ? "text-green-700"
                  : currentStep === 1
                  ? "text-blue-700"
                  : "text-gray-300"
              }`}
            >
              {currentStep > 1 && (
                <CheckCircle className="h-4 w-4 text-green-600" />
              )}
              Basic Info
            </span>
            <span
              className={`text-sm font-medium transition-colors flex items-center gap-1 ${
                currentStep > 2
                  ? "text-green-700"
                  : currentStep === 2
                  ? "text-blue-700"
                  : "text-gray-300"
              }`}
            >
              {currentStep > 2 && (
                <CheckCircle className="h-4 w-4 text-green-600" />
              )}
              Mission & Vision
            </span>
            <span
              className={`text-sm font-medium transition-colors flex items-center gap-1 ${
                currentStep > 3
                  ? "text-green-700"
                  : currentStep === 3
                  ? "text-blue-700"
                  : "text-gray-300"
              }`}
            >
              {currentStep > 3 && (
                <CheckCircle className="h-4 w-4 text-green-600" />
              )}
              Culture & Benefits
            </span>
          </div>
        </div>

        {/* Step 1: Basic Information */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-600 rounded-lg">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle>Basic Company Information</CardTitle>
                  <CardDescription>Tell us about your company</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Company Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., Acme Corporation"
                  className="text-lg"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="about">About Your Company *</Label>
                <Textarea
                  id="about"
                  value={formData.about}
                  onChange={(e) =>
                    setFormData({ ...formData, about: e.target.value })
                  }
                  placeholder="Describe what your company does, your products/services, and what makes you unique..."
                  rows={6}
                />
                <p className="text-sm text-gray-500">
                  This will help candidates understand your company better
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Mission & Vision */}
        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-600 rounded-lg">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle>Mission & Vision</CardTitle>
                  <CardDescription>
                    Define your company's purpose and goals
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="mission">Mission Statement *</Label>
                <Textarea
                  id="mission"
                  value={formData.mission}
                  onChange={(e) =>
                    setFormData({ ...formData, mission: e.target.value })
                  }
                  placeholder="What is your company's core purpose? Why do you exist?"
                  rows={4}
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vision">Vision Statement *</Label>
                <Textarea
                  id="vision"
                  value={formData.vision}
                  onChange={(e) =>
                    setFormData({ ...formData, vision: e.target.value })
                  }
                  placeholder="Where do you see your company in the future? What are your long-term goals?"
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Culture & Benefits */}
        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-600 rounded-lg">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle>Culture & Benefits</CardTitle>
                  <CardDescription>
                    Showcase what makes your company a great place to work
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Company Benefits Section */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-base font-semibold">
                    Company Benefits
                  </Label>
                  <p className="text-sm text-gray-500">
                    Describe and list the benefits you offer to employees
                  </p>
                </div>

                {/* Benefits Description */}
                <div className="space-y-2">
                  <Label htmlFor="benefits_description">
                    Benefits Summary *
                  </Label>
                  <Textarea
                    id="benefits_description"
                    value={formData.benefits_description}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        benefits_description: e.target.value,
                      })
                    }
                    placeholder="Brief overview of your benefits package (e.g., 'We offer comprehensive benefits to support our employees' well-being and growth')"
                    rows={3}
                    autoFocus
                  />
                </div>

                {/* Benefits List */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Benefit Items *</Label>
                  <p className="text-xs text-gray-500">
                    Add at least one benefit
                  </p>
                  {formData.benefits_items.map((item, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={item}
                        onChange={(e) =>
                          updateItem("benefits_items", index, e.target.value)
                        }
                        placeholder="e.g., Health insurance, 401k matching, Flexible work hours..."
                      />
                      {formData.benefits_items.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => removeItem("benefits_items", index)}
                        >
                          ×
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addItem("benefits_items")}
                    className="w-full sm:w-auto"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Another Benefit
                  </Button>
                </div>
              </div>

              <div className="border-t" />

              {/* Core Values Section */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-base font-semibold">Core Values</Label>
                  <p className="text-sm text-gray-500">
                    Define the values that drive your company culture
                  </p>
                </div>

                {/* Values Description */}
                <div className="space-y-2">
                  <Label htmlFor="values_description">Values Statement *</Label>
                  <Textarea
                    id="values_description"
                    value={formData.values_description}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        values_description: e.target.value,
                      })
                    }
                    placeholder="Brief description of what your values mean to your organization (e.g., 'Our values guide every decision we make')"
                    rows={3}
                  />
                </div>

                {/* Values List */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Value Items *</Label>
                  <p className="text-xs text-gray-500">
                    Add at least one core value
                  </p>
                  {formData.values_items.map((item, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={item}
                        onChange={(e) =>
                          updateItem("values_items", index, e.target.value)
                        }
                        placeholder="e.g., Innovation, Integrity, Teamwork, Customer First..."
                      />
                      {formData.values_items.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => removeItem("values_items", index)}
                        >
                          ×
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addItem("values_items")}
                    className="w-full sm:w-auto"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Another Value
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
          >
            Back
          </Button>

          {currentStep < 3 ? (
            <Button onClick={handleNext} disabled={!isStepValid()}>
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={!isStepValid() || loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Complete Setup
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
