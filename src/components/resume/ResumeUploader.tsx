import React, { useState, useRef, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  Upload,
  FileText,
  AlertCircle,
  CheckCircle,
  X,
  File,
  Loader2,
  FileUp,
  CheckCircle2,
} from "lucide-react";
import { formatFullName } from "@/lib/utils";
import { useCompany } from "@/contexts/CompanyContext";

// Maximum file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_FILE_TYPES = ["application/pdf"];

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

interface ResumeUploaderProps {
  onUploadComplete?: (fileUrl: string, fileName: string) => void;
  onUploadError?: (error: Error) => void;
  onFileSelect?: (file: File) => void;
}

const ResumeUploader: React.FC<ResumeUploaderProps> = ({
  onUploadComplete,
  onUploadError,
  onFileSelect,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const { toast } = useToast();
  const { user, tenantId } = useAuth();
  const { selectedCompany } = useCompany();
  const navigate = useNavigate();

  // For tracking upload progress
  const uploadProgressInterval = useRef<NodeJS.Timeout | null>(null);

  // Clean up the file preview URL when component unmounts
  React.useEffect(() => {
    return () => {
      if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
      if (uploadProgressInterval.current)
        clearInterval(uploadProgressInterval.current);
    };
  }, [filePreviewUrl]);

  // File validation function
  const validateFile = (file: File): { valid: boolean; error?: string } => {
    // Check file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: "Only PDF files are allowed.",
      };
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `File size must be less than ${
          MAX_FILE_SIZE / (1024 * 1024)
        }MB.`,
      };
    }

    return { valid: true };
  };

  // Handle file drop
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];
      const validation = validateFile(file);

      if (!validation.valid) {
        setUploadError(validation.error || "Invalid file");
        toast({
          variant: "destructive",
          title: "Invalid File",
          description: validation.error,
        });
        return;
      }

      // Clear previous errors and success state
      setUploadError(null);
      setUploadSuccess(false);
      setUploadProgress(0);

      // Create a preview URL for PDF
      const previewUrl = URL.createObjectURL(file);
      setFilePreviewUrl(previewUrl);
      setFile(file);

      // Notify parent component if needed
      if (onFileSelect) onFileSelect(file);
    },
    [onFileSelect, toast]
  );

  // Configure dropzone
  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    useDropzone({
      onDrop,
      accept: {
        "application/pdf": [".pdf"],
      },
      maxFiles: 1,
      multiple: false,
    });

  // Handle file upload to Supabase
  const handleUpload = async () => {
    // Add debug logs
    console.log("Upload initiated with:", {
      fileExists: !!file,
      userExists: !!user,
      userInfo: user,
      tenantIdExists: !!tenantId,
      tenantId,
    });

    // Temporary workaround: If tenant ID is missing, try to fetch the first one from the database
    let effectiveTenantId = tenantId;
    if (!effectiveTenantId && user) {
      console.log("Attempting to fetch a fallback tenant ID");
      try {
        // First try to get the user's tenant ID from the database
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("tenant_id")
          .eq("id", user.id)
          .single();

        if (userData?.tenant_id) {
          console.log("Found tenant ID in users table:", userData.tenant_id);
          effectiveTenantId = userData.tenant_id;
        } else {
          // If not found, get any tenant ID as a fallback
          const { data: tenantData, error: tenantError } = await supabase
            .from("tenants")
            .select("id")
            .limit(1)
            .single();

          if (tenantData?.id) {
            console.log("Using fallback tenant ID:", tenantData.id);
            effectiveTenantId = tenantData.id;
          }
        }
      } catch (error) {
        console.error("Error getting fallback tenant ID:", error);
      }
    }

    if (!file || !user) {
      setUploadError("Missing file or user information");
      console.error("Upload error: Missing file or user information", {
        file: !!file,
        user: !!user,
      });
      return;
    }

    // If we still don't have a tenant ID, use the user ID as a fallback path
    const uploadPath = effectiveTenantId
      ? `${effectiveTenantId}/${Date.now()}_${file.name}`
      : `${user.id}/${Date.now()}_${file.name}`;

    console.log("Using upload path:", uploadPath);

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate progress for better UX
      uploadProgressInterval.current = setInterval(() => {
        setUploadProgress((prev) => {
          // Increment progress but stop at 90% until actual completion
          if (prev < 90) return prev + 5;
          return prev;
        });
      }, 200);

      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from("resumes")
        .upload(uploadPath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      // Clear interval
      if (uploadProgressInterval.current) {
        clearInterval(uploadProgressInterval.current);
        uploadProgressInterval.current = null;
      }

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("resumes")
        .getPublicUrl(uploadPath);
      console.log(`Original Public URL: ${urlData.publicUrl}`);
      // Check to see if we are running in dev. If so, we need to use out TunnelMole IP address
      if (import.meta.env.MODE === "development") {
        const TUNNEL_MOLE_URL = import.meta.env.VITE_TUNNEL_MOLE_URL;
        if (!TUNNEL_MOLE_URL) {
          throw new Error("TUNNEL_MOLE_URL is not set");
        }
        const { data, error } = await supabase.storage
          .from("resumes")
          .createSignedUrl(uploadPath, 60); // expires in 60 seconds
        const LOCAL_S3_URL = "http://127.0.0.1:54321";
        const newUrl = data.signedUrl.replace(LOCAL_S3_URL, TUNNEL_MOLE_URL);
        console.log(`Updated Public URL: ${newUrl}`);
        urlData.publicUrl = newUrl;
      }

      // Set progress to 100% and mark as success
      setUploadProgress(100);
      setUploadSuccess(true);
      toast({
        title: "Resume Uploaded",
        description: "Resume was successfully uploaded.",
      });

      // Trigger resume processing
      try {
        const candidateId = await processResume(urlData.publicUrl, file.name);

        // Notify parent component with the URL and new candidate ID
        if (onUploadComplete) onUploadComplete(urlData.publicUrl, file.name);
      } catch (processingError) {
        // Processing error is handled inside processResume
        // We don't need to throw here since the upload was successful
        console.error("Processing error:", processingError);
      }
    } catch (error) {
      console.error("Upload error:", error);
      setUploadError(
        error instanceof Error ? error.message : "Failed to upload file"
      );

      if (onUploadError && error instanceof Error) {
        onUploadError(error);
      }

      toast({
        variant: "destructive",
        title: "Upload Failed",
        description:
          error instanceof Error ? error.message : "Failed to upload file",
      });
    } finally {
      setIsUploading(false);
      if (uploadProgressInterval.current) {
        clearInterval(uploadProgressInterval.current);
        uploadProgressInterval.current = null;
      }
    }
  };

  // Process the resume (mock function for now)
  const processResume = async (fileUrl: string, fileName: string) => {
    try {
      // Get the Supabase URL and key
      const supabaseUrl =
        import.meta.env.VITE_SUPABASE_URL ||
        "https://gypnutyegqxelvsqjedu.supabase.co";
      const supabaseKey =
        import.meta.env.VITE_SUPABASE_ANON_KEY ||
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5cG51dHllZ3F4ZWx2c3FqZWR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU4NzQ1MTUsImV4cCI6MjA2MTQ1MDUxNX0.1GnoF-EZ5jr_DJgcgeCJcqy-NASlEFGt1XavwbiIELA";

      // Get current session for auth token, if available
      const { data: sessionData } = await supabase.auth.getSession();
      const authToken = sessionData?.session?.access_token;

      console.log(
        "Processing resume using direct fetch instead of client.functions.invoke"
      );

      console.log(`Resume URL: ${fileUrl}`);

      // Step 1: Call process-resume function directly with fetch to extract text from PDF
      const processResumeResponse = await fetch(
        `${supabaseUrl}/functions/v1/process-resume`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: supabaseKey,
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
          },
          body: JSON.stringify({ pdfUrl: fileUrl }),
        }
      );

      if (!processResumeResponse.ok) {
        const errorText = await processResumeResponse.text();
        console.error(
          "Process resume error:",
          processResumeResponse.status,
          errorText
        );
        throw new Error(
          `Failed to extract text from resume: ${processResumeResponse.status}`
        );
      }

      const processedData = await processResumeResponse.json();

      if (!processedData?.success || !processedData?.text) {
        throw new Error("Failed to extract text from resume");
      }

      // Step 2: Call analyze-resume function directly with fetch to structure the resume data
      const analyzeResumeResponse = await fetch(
        `${supabaseUrl}/functions/v1/analyze-resume`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: supabaseKey,
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
          },
          body: JSON.stringify({ resumeText: processedData.text }),
        }
      );

      if (!analyzeResumeResponse.ok) {
        const errorText = await analyzeResumeResponse.text();
        console.error(
          "Analyze resume error:",
          analyzeResumeResponse.status,
          errorText
        );
        throw new Error(
          `Failed to analyze resume: ${analyzeResumeResponse.status}`
        );
      }

      const analysisData = await analyzeResumeResponse.json();

      if (!analysisData?.analysis) {
        throw new Error("Failed to analyze resume data");
      }

      // Parse the analysis data if it's a string (from response_format: "json_object")
      let parsedAnalysis;
      try {
        parsedAnalysis =
          typeof analysisData.analysis === "string"
            ? JSON.parse(analysisData.analysis)
            : analysisData.analysis;
      } catch (parseError) {
        console.error("Error parsing analysis data:", parseError);
        throw new Error("Failed to parse resume analysis data");
      }

      // Step 3: Store candidate data in the database
      // Use the same tenant ID fallback logic as in upload
      let effectiveTenantId = tenantId;
      if (!effectiveTenantId && user) {
        try {
          // First try to get from users table
          const { data: userData } = await supabase
            .from("users")
            .select("tenant_id")
            .eq("id", user.id)
            .single();

          if (userData?.tenant_id) {
            effectiveTenantId = userData.tenant_id;
          } else {
            // If not found, get any tenant ID as fallback
            const { data: tenantData } = await supabase
              .from("tenants")
              .select("id")
              .limit(1)
              .single();

            if (tenantData?.id) {
              effectiveTenantId = tenantData.id;
            }
          }
        } catch (error) {
          console.error("Error getting fallback tenant ID:", error);
        }
      }

      // If we still don't have a tenant ID and must have one, use a UUID
      if (!effectiveTenantId) {
        console.error("No tenant ID available, cannot create candidate");
        throw new Error("Missing tenant ID for candidate creation");
      }

      // Use the selected company if available, otherwise get the first company for this tenant
      let companyId: string;

      if (selectedCompany) {
        companyId = selectedCompany.id;
      } else {
        const { data: companyData, error: companyError } = await supabase
          .from("companies")
          .select("id")
          .eq("tenant_id", effectiveTenantId)
          .order("created_at", { ascending: true })
          .limit(1)
          .single();

        if (companyError || !companyData?.id) {
          console.error("No company found for tenant, cannot create candidate");
          throw new Error(
            "No company found for this tenant. Please create a company first."
          );
        }

        companyId = companyData.id;
      }

      // Extract first and last name from full name
      const nameParts = parsedAnalysis.personal_info.full_name.split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      // Format phone number to E.164 format
      const formattedPhone = formatPhoneToE164(
        parsedAnalysis.personal_info.phone
      );

      const { data: candidate, error: candidateError } = await supabase
        .from("candidates")
        .insert({
          tenant_id: effectiveTenantId,
          company_id: companyId,
          first_name: firstName,
          last_name: lastName,
          email: parsedAnalysis.personal_info.email,
          phone: formattedPhone,
          resume_url: fileUrl,
          resume_text: processedData.text,
          skills: parsedAnalysis.skills || [],
          experience: parsedAnalysis.experience || {},
          education: parsedAnalysis.education || "",
          resume_analysis: parsedAnalysis,
        })
        .select()
        .single();

      if (candidateError) throw candidateError;

      console.log("Candidate created with ID:", candidate.id);

      // Step 4: Enrich candidate profile with PDL data
      try {
        toast({
          title: "Enriching Profile",
          description: "Enhancing candidate profile with additional data...",
        });

        // Step 4: Call enrich-candidate function directly with fetch
        const enrichCandidateResponse = await fetch(
          `${supabaseUrl}/functions/v1/enrich-candidate`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: supabaseKey,
              ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
            },
            body: JSON.stringify({
              candidate_id: candidate.id,
              email: parsedAnalysis.personal_info.email,
              name: formatFullName(firstName, lastName),
              phone: formattedPhone,
            }),
          }
        );

        if (!enrichCandidateResponse.ok) {
          console.error(
            "Profile enrichment error (non-critical):",
            enrichCandidateResponse.status
          );
          toast({
            title: "Enrichment Notice",
            description:
              "Basic profile created. Additional data enrichment unavailable.",
            variant: "default",
          });
        } else {
          const enrichmentData = await enrichCandidateResponse.json();
          console.log("Profile enrichment completed:", enrichmentData);
          toast({
            title: "Profile Enriched",
            description: "Enhanced profile data successfully added.",
            variant: "default",
          });
        }
      } catch (enrichmentError) {
        // Non-critical error, log but continue
        console.error("Profile enrichment error (caught):", enrichmentError);
        toast({
          title: "Enrichment Notice",
          description:
            "Basic profile created. Additional data enrichment unavailable.",
          variant: "default",
        });
      }

      // Notify user of successful processing
      toast({
        title: "Resume Processed",
        description: "Resume analysis complete and candidate created.",
      });

      // After successful candidate creation, navigate to the candidate profile
      navigate(`/candidates/${candidate.id}`);

      return candidate.id;
    } catch (error) {
      console.error("Resume processing error:", error);
      toast({
        variant: "destructive",
        title: "Processing Failed",
        description:
          error instanceof Error ? error.message : "Failed to process resume",
      });
      throw error;
    }
  };

  // Clear the selected file
  const handleClearFile = () => {
    if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
    setFile(null);
    setFilePreviewUrl(null);
    setUploadError(null);
    setUploadSuccess(false);
    setUploadProgress(0);
  };

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      {!file && (
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-10 text-center cursor-pointer
            transition-colors duration-200 ease-in-out
            ${
              isDragActive
                ? "border-primary bg-primary/5"
                : "border-gray-300 hover:border-primary/50"
            }
            ${isDragReject ? "border-red-500 bg-red-50" : ""}
          `}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="p-3 bg-primary/10 rounded-full">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">
                {isDragActive
                  ? "Drop the resume here..."
                  : "Drag & drop a resume, or click to browse"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Supports PDF files up to 10MB
              </p>
            </div>
          </div>
        </div>
      )}

      {/* File Preview */}
      {file && (
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="p-4 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-md">
                  <File className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <Label className="font-medium block">{file.name}</Label>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB - {file.type}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClearFile}
                disabled={isUploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* PDF Embed Preview */}
            {filePreviewUrl && (
              <div className="h-[400px] border-t">
                <object
                  data={filePreviewUrl}
                  type="application/pdf"
                  width="100%"
                  height="100%"
                  className="w-full h-full"
                >
                  <p className="p-4 text-center text-muted-foreground">
                    Your browser doesn't support PDF preview.
                    <a
                      href={filePreviewUrl}
                      className="text-primary hover:underline ml-1"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Click here to view the PDF.
                    </a>
                  </p>
                </object>
              </div>
            )}

            {/* Upload Progress */}
            {isUploading && (
              <div className="p-4 border-t">
                <div className="flex justify-between mb-1 text-xs">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}

            {/* Error Message */}
            {uploadError && (
              <Alert variant="destructive" className="mx-4 my-3">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{uploadError}</AlertDescription>
              </Alert>
            )}

            {/* Success Message */}
            {uploadSuccess && (
              <Alert className="mx-4 my-3 border-green-500 text-green-500">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Resume uploaded successfully!
                </AlertDescription>
              </Alert>
            )}

            {/* Upload Button */}
            <div className="p-4 border-t flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={handleClearFile}
                disabled={isUploading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={isUploading || uploadSuccess}
                className="gap-2"
              >
                {isUploading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <span>Uploading...</span>
                  </>
                ) : uploadSuccess ? (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    <span>Uploaded</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    <span>Upload Resume</span>
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ResumeUploader;
