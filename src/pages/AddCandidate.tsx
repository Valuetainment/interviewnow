import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  ChevronLeft,
  User,
  Briefcase,
  GraduationCap,
  FileText,
  Globe,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import CompanySelect from "@/components/companies/CompanySelect";

// Helper function to format phone number to E.164 format
const formatPhoneToE164 = (phone: string | null | undefined): string | null => {
  if (!phone) return null;

  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, "");

  // If empty after removing non-digits, return null
  if (!digits) return null;

  // Handle US numbers (10 digits)
  if (digits.length === 10) {
    return `+1${digits}`;
  }

  // Handle US numbers with country code (11 digits starting with 1)
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`;
  }

  // Handle numbers that already have country code (more than 10 digits)
  if (digits.length > 10 && !digits.startsWith("+")) {
    return `+${digits}`;
  }

  // For other formats, try to preserve as is if it's between 7-15 digits
  if (digits.length >= 7 && digits.length <= 15) {
    // If it doesn't start with a country code, assume US
    if (digits.length <= 10) {
      return `+1${digits}`;
    }
    return `+${digits}`;
  }

  // If we can't format it properly, return null to avoid constraint violation
  console.warn(`Unable to format phone number to E.164: ${phone}`);
  return null;
};

// Form validation schema
const candidateSchema = z.object({
  company_id: z.string().min(1, "Company is required"),
  email: z.string().email("Invalid email address"),
  phone: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^\+?[1-9]\d{1,14}$/.test(formatPhoneToE164(val) || ""),
      "Phone must be a valid phone number"
    ),
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  current_title: z.string().optional(),
  current_company: z.string().optional(),
  linkedin_url: z.string().url().optional().or(z.literal("")),
  education: z.string().optional(),
  skills: z.string().optional(), // Will be converted to array
  experience: z.string().optional(), // Will be converted to JSON
  resume_text: z.string().optional(),
  resume_url: z.string().url().optional().or(z.literal("")),
});

type CandidateFormData = z.infer<typeof candidateSchema>;

const AddCandidate = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, tenantId } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CandidateFormData>({
    resolver: zodResolver(candidateSchema),
  });

  const onSubmit = async (data: CandidateFormData) => {
    if (!tenantId) {
      toast({
        title: "Error",
        description: "Unable to determine tenant",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Convert skills string to array
      const skillsArray = data.skills
        ? data.skills
            .split(",")
            .map((skill) => skill.trim())
            .filter(Boolean)
        : [];

      // Convert experience string to JSON
      let experienceJson = null;
      if (data.experience) {
        try {
          experienceJson = JSON.parse(data.experience);
        } catch {
          // If not valid JSON, store as a simple object
          experienceJson = { description: data.experience };
        }
      }

      // Format phone number to E.164 format
      const formattedPhone = formatPhoneToE164(data.phone);

      // Prepare the candidate data
      const candidateData = {
        tenant_id: tenantId,
        company_id: data.company_id,
        email: data.email,
        phone: formattedPhone,
        first_name: data.first_name,
        last_name: data.last_name,
        current_title: data.current_title || null,
        current_company: data.current_company || null,
        linkedin_url: data.linkedin_url || null,
        education: data.education || null,
        skills: skillsArray,
        experience: experienceJson,
        resume_text: data.resume_text || null,
        resume_url: data.resume_url || null,
      };

      const { error } = await supabase
        .from("candidates")
        .insert([candidateData]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Candidate added successfully",
      });

      navigate("/candidates");
    } catch (error) {
      console.error("Error adding candidate:", error);
      toast({
        title: "Error",
        description: "Failed to add candidate",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/candidates")}
          className="mb-4"
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Candidates
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add New Candidate</CardTitle>
          <CardDescription>
            Enter the candidate's information to add them to your database
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Company Selection */}
            <div className="space-y-2">
              <Label htmlFor="company_id">Company *</Label>
              <Controller
                name="company_id"
                control={control}
                render={({ field }) => (
                  <CompanySelect
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
              {errors.company_id && (
                <p className="text-sm text-red-500">
                  {errors.company_id.message}
                </p>
              )}
            </div>

            {/* Personal Information Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <User className="h-5 w-5" />
                Personal Information
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name *</Label>
                  <Input
                    id="first_name"
                    {...register("first_name")}
                    placeholder="John"
                  />
                  {errors.first_name && (
                    <p className="text-sm text-red-500">
                      {errors.first_name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name *</Label>
                  <Input
                    id="last_name"
                    {...register("last_name")}
                    placeholder="Doe"
                  />
                  {errors.last_name && (
                    <p className="text-sm text-red-500">
                      {errors.last_name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register("email")}
                    placeholder="john.doe@example.com"
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    {...register("phone")}
                    placeholder="+1 (555) 123-4567"
                  />
                  {errors.phone && (
                    <p className="text-sm text-red-500">
                      {errors.phone.message}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Any phone format accepted (will be converted to
                    international format)
                  </p>
                </div>
              </div>
            </div>

            {/* Professional Information Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <Briefcase className="h-5 w-5" />
                Professional Information
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="current_title">Current Title</Label>
                  <Input
                    id="current_title"
                    {...register("current_title")}
                    placeholder="Software Engineer"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="current_company">Current Company</Label>
                  <Input
                    id="current_company"
                    {...register("current_company")}
                    placeholder="Tech Corp"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="skills">Skills (comma-separated)</Label>
                <Input
                  id="skills"
                  {...register("skills")}
                  placeholder="JavaScript, React, Node.js, Python"
                />
                <p className="text-sm text-muted-foreground">
                  Enter skills separated by commas
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="experience">Experience</Label>
                <Textarea
                  id="experience"
                  {...register("experience")}
                  placeholder="Describe work experience or paste JSON data"
                  rows={4}
                />
                <p className="text-sm text-muted-foreground">
                  Enter experience description or JSON formatted data
                </p>
              </div>
            </div>

            {/* Education Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <GraduationCap className="h-5 w-5" />
                Education
              </div>

              <div className="space-y-2">
                <Label htmlFor="education">Education</Label>
                <Textarea
                  id="education"
                  {...register("education")}
                  placeholder="Bachelor of Science in Computer Science, University Name (2020)"
                  rows={3}
                />
              </div>
            </div>

            {/* Additional Information Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <Globe className="h-5 w-5" />
                Additional Information
              </div>

              <div className="space-y-2">
                <Label htmlFor="linkedin_url">LinkedIn URL</Label>
                <Input
                  id="linkedin_url"
                  type="url"
                  {...register("linkedin_url")}
                  placeholder="https://linkedin.com/in/johndoe"
                />
                {errors.linkedin_url && (
                  <p className="text-sm text-red-500">
                    {errors.linkedin_url.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="resume_url">Resume URL</Label>
                <Input
                  id="resume_url"
                  type="url"
                  {...register("resume_url")}
                  placeholder="https://example.com/resume.pdf"
                />
                {errors.resume_url && (
                  <p className="text-sm text-red-500">
                    {errors.resume_url.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="resume_text">Resume Text</Label>
                <Textarea
                  id="resume_text"
                  {...register("resume_text")}
                  placeholder="Paste resume content here..."
                  rows={6}
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/candidates")}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Adding..." : "Add Candidate"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddCandidate;
