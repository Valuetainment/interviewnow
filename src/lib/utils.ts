import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { supabase } from "@/integrations/supabase/client";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a full name from first and last names
 * @param firstName - The first name
 * @param lastName - The last name
 * @returns The formatted full name
 */
export function formatFullName(
  firstName?: string | null,
  lastName?: string | null
): string {
  const parts = [firstName, lastName].filter(Boolean);
  return parts.join(" ") || "Unknown";
}

/**
 * Transform a resume URL for local development
 * In development, this creates a fresh signed URL and replaces local URLs with tunnel URLs
 * @param resumeUrl - The original resume URL from the database
 * @returns Promise<string | null> - The transformed URL or null if transformation fails
 */
export async function getResumeUrl(
  resumeUrl: string | null | undefined
): Promise<string | null> {
  if (!resumeUrl) return null;

  // In production, return the URL as-is
  if (import.meta.env.MODE !== "development") {
    return resumeUrl;
  }

  try {
    // Extract the file path from the URL
    // The URL might be in format: https://[bucket-url]/object/public/resumes/[path]
    // or https://[bucket-url]/object/sign/resumes/[path]?token=...
    const urlParts = resumeUrl.split("/resumes/");
    if (urlParts.length < 2) {
      console.warn("Unable to extract file path from resume URL:", resumeUrl);
      return resumeUrl;
    }

    // Get the file path, removing any query parameters
    const filePath = urlParts[1].split("?")[0];
    const fullPath = `resumes/${filePath}`;

    // Check if we have a tunnel URL configured
    const TUNNEL_MOLE_URL = import.meta.env.VITE_TUNNEL_MOLE_URL;
    if (!TUNNEL_MOLE_URL) {
      console.warn("TUNNEL_MOLE_URL not configured for local development");
      // Try to create a signed URL anyway
      const { data, error } = await supabase.storage
        .from("resumes")
        .createSignedUrl(filePath, 3600); // 1 hour expiration

      if (error || !data) {
        console.error("Error creating signed URL:", error);
        return resumeUrl;
      }

      return data.signedUrl;
    }

    // Create a new signed URL with longer expiration
    const { data, error } = await supabase.storage
      .from("resumes")
      .createSignedUrl(filePath, 3600); // 1 hour expiration

    if (error || !data) {
      console.error("Error creating signed URL:", error);
      return resumeUrl;
    }

    // Replace local URL with tunnel URL
    const LOCAL_S3_URL = "http://127.0.0.1:54321";
    const newUrl = data.signedUrl.replace(LOCAL_S3_URL, TUNNEL_MOLE_URL);

    console.log("Transformed resume URL for local development:", {
      original: resumeUrl,
      signed: data.signedUrl,
      transformed: newUrl,
    });

    return newUrl;
  } catch (error) {
    console.error("Error transforming resume URL:", error);
    return resumeUrl; // Return original URL as fallback
  }
}
