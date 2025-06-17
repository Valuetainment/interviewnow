import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Mail, Phone, Briefcase, FileText, ExternalLink, LinkedinIcon, GithubIcon, AlertCircle } from 'lucide-react';
import { Json } from '@/integrations/supabase/types';

// Define types for better type safety
interface JobPosition {
  title: string;
  company: string;
  start_date?: string;
  end_date?: string;
  dates?: string;
  responsibilities?: string | string[];
  achievements?: string[];
}

interface Education {
  degree: string;
  institution: string;
  start_date?: string;
  end_date?: string;
}

// Add type for raw education string format from OpenAI
type RawEducation = string | Education;

interface ResumeAnalysis {
  personal_info: {
    full_name: string;
    email: string;
    phone?: string;
    geographic_location?: string;
  } | Record<string, unknown>; // Allow flexible structure for personal_info
  professional_summary?: string;
  skills?: string[];
  experience?: {
    positions_held?: JobPosition[];
    years?: string;
    industries?: string[];
  } | Record<string, unknown>; // Allow flexible structure for experience
  education?: RawEducation[] | Record<string, unknown>; // Allow flexible structure for education
  areas_specialization?: string[];
  notable_achievements?: string[];
  [key: string]: unknown; // Allow any additional fields with unknown type
}

// Database type
type ExperienceData = JobPosition[] | { positions_held?: JobPosition[]; years?: string; industries?: string[] } | string;
type EducationData = Education[] | string;

interface Candidate {
  id: string;
  tenant_id: string;
  full_name: string;
  email: string;
  phone?: string | null;
  resume_url?: string | null;
  resume_text?: string | null;
  skills?: string[] | null;
  experience?: ExperienceData | null;
  education?: EducationData | null;
  resume_analysis?: ResumeAnalysis | null;
  created_at?: string;
  updated_at?: string;
}

interface CandidateProfile {
  id: string;
  candidate_id: string;
  tenant_id: string;
  created_at?: string;
  updated_at?: string;
  pdl_id?: string | null;
  pdl_likelihood?: number | null;
  last_enriched_at?: string | null;
  first_name?: string | null;
  middle_name?: string | null;
  last_name?: string | null;
  gender?: string | null;
  birth_year?: number | null;
  location_name?: string | null;
  location_locality?: string | null;
  location_region?: string | null;
  location_country?: string | null;
  location_continent?: string | null;
  location_postal_code?: string | null;
  location_street_address?: string | null;
  location_geo?: string | null;
  job_title?: string | null;
  job_company_name?: string | null;
  job_company_size?: string | null;
  job_company_industry?: string | null;
  job_start_date?: string | null;
  job_last_updated?: string | null;
  linkedin_url?: string | null;
  linkedin_username?: string | null;
  linkedin_id?: string | null;
  twitter_url?: string | null;
  twitter_username?: string | null;
  facebook_url?: string | null;
  facebook_username?: string | null;
  github_url?: string | null;
  github_username?: string | null;
  skills?: string[] | null;
  interests?: string[] | null;
  countries?: string[] | null;
  experience?: ExperienceData | null;
  education?: EducationData | null;
  industry?: string | null;
  job_title_levels?: string[] | null;
  phone?: string | null;
}

// Helper function to get initials from name
const getInitials = (name: string) => {
  if (!name) return '';
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase();
};

// Helper functions for parsing JSON data
const parseJsonSafely = <T,>(data: string | T | null | undefined): T | null => {
  if (!data) return null;
  if (typeof data !== 'string') return data as T;
  
  try {
    return JSON.parse(data) as T;
  } catch (error) {
    console.error('Error parsing JSON:', error);
    return null;
  }
};

const CandidateProfile = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [enrichedProfile, setEnrichedProfile] = useState<CandidateProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileTableExists, setProfileTableExists] = useState(true);

  useEffect(() => {
    const fetchCandidateData = async () => {
      if (!id) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch candidate and profile data in parallel using Promise.all
        const [candidateResult, profileResult] = await Promise.all([
          supabase
            .from('candidates')
            .select('*')
            .eq('id', id)
            .single(),
          supabase
            .from('candidate_profiles')
            .select('*')
            .eq('candidate_id', id)
            .maybeSingle()
        ]);
        
        // Handle candidate fetch error
        if (candidateResult.error) {
          throw candidateResult.error;
        }
        
        // Log data for debugging
        console.log('Fetched candidate data:', candidateResult.data);
        
        // Store candidate data with proper type casting
        // We need to use 'unknown' as an intermediate type to satisfy TypeScript
        const candidateData = candidateResult.data as unknown as Candidate;
        setCandidate(candidateData);
        
        // Handle profile data (won't throw error if not found)
        if (profileResult.data) {
          console.log('Fetched profile data:', profileResult.data);
          const profileData = profileResult.data as unknown as CandidateProfile;
          setEnrichedProfile(profileData);
        } else if (profileResult.error) {
          // Only log error if it's not a "not found" error
          if (!profileResult.error.message?.includes('No rows found')) {
            console.warn('Error fetching profile data:', profileResult.error);
            
            // Check if table doesn't exist
            if (profileResult.error.message?.includes('relation "public.candidate_profiles" does not exist')) {
              console.log('candidate_profiles table does not exist yet');
              setProfileTableExists(false);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching candidate:', err);
        setError('Failed to load candidate data');
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load candidate data',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCandidateData();
  }, [id, toast]);

  // Parse resume_analysis if it's a string
  useEffect(() => {
    if (candidate && candidate.resume_analysis) {
      try {
        // Parse if it's a string, otherwise keep as is
        const parsedAnalysis = typeof candidate.resume_analysis === 'string' 
          ? JSON.parse(candidate.resume_analysis) 
          : candidate.resume_analysis;
        
        setCandidate(prev => prev ? {
          ...prev,
          resume_analysis: parsedAnalysis
        } : null);
      } catch (error) {
        console.error('Error parsing resume_analysis:', error);
      }
    }
  }, [candidate?.id]);

  // If loading, show skeleton
  if (isLoading) {
    return (
      <div className="container py-6 space-y-8">
        <div className="flex items-start gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Tabs defaultValue="profile">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="resume">Resume</TabsTrigger>
            <TabsTrigger value="assessments">Assessments</TabsTrigger>
          </TabsList>
          <TabsContent value="profile" className="mt-4">
            <div className="grid gap-6 md:grid-cols-2">
              <Skeleton className="h-[400px]" />
              <Skeleton className="h-[400px]" />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // If error or no candidate, show error message
  if (error || !candidate) {
    return (
      <div className="container py-10">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>Could not load candidate profile</CardDescription>
          </CardHeader>
          <CardContent>
            <p>{error || 'Candidate not found'}</p>
            <Button className="mt-4" onClick={() => window.history.back()}>
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Helper functions for data fallbacks
  
  // Get positions with fallbacks in priority order
  const getPositions = (): JobPosition[] => {
    // 1. Use enriched experience if available
    if (enrichedProfile?.experience) {
      const expData = parseJsonSafely<JobPosition[] | { positions_held?: JobPosition[] }>(
        typeof enrichedProfile.experience === 'string' 
          ? enrichedProfile.experience 
          : enrichedProfile.experience
      );
      
      if (expData) {
        if (Array.isArray(expData)) return expData;
        if (expData.positions_held && Array.isArray(expData.positions_held)) return expData.positions_held;
      }
    }
    
    // 2. Use candidate experience if available
    if (candidate?.experience) {
      const expData = parseJsonSafely<JobPosition[] | { positions_held?: JobPosition[] }>(
        typeof candidate.experience === 'string' 
          ? candidate.experience 
          : candidate.experience
      );
      
      if (expData) {
        if (Array.isArray(expData)) return expData;
        if (expData.positions_held && Array.isArray(expData.positions_held)) return expData.positions_held;
      }
    }
    
    // 3. Use resume_analysis.experience.positions_held if available
    if (candidate?.resume_analysis?.experience?.positions_held) {
      return candidate.resume_analysis.experience.positions_held;
    }
    
    // 4. Fallback to empty array
    return [];
  };

  // Format date string from either dates field (e.g., "09/2022 - Present") or separate start/end fields
  const formatDateRange = (job: JobPosition): string => {
    // If dates field exists (from OpenAI), use it directly
    if (job.dates) {
      return job.dates;
    }
    
    // Otherwise use start_date and end_date if available
    const startDate = job.start_date || '';
    const endDate = job.end_date || 'Present';
    
    if (!startDate && !endDate) return '';
    if (startDate && !endDate) return startDate;
    return `${startDate} - ${endDate}`;
  };

  // Format responsibilities as a list or paragraph
  const formatResponsibilities = (responsibilities: string | string[] | undefined): string[] => {
    if (!responsibilities) return [];
    
    if (typeof responsibilities === 'string') {
      // Split by periods, new lines, or bullet points
      return responsibilities.split(/[.•\n]/)
        .map(item => item.trim())
        .filter(item => item.length > 0);
    }
    
    return responsibilities;
  };

  // Extract data from candidate and enriched profile (if available)
  const hasEnrichedData = !!enrichedProfile;
  const name = candidate.full_name || '';
  const avatarInitials = getInitials(name);
  
  // Location - try enriched profile first, then resume_analysis
  const location = enrichedProfile?.location_name || 
                  candidate.resume_analysis?.personal_info?.geographic_location || '';
  
  // Contact info - prefer candidate record, then enriched data
  const email = candidate.email || candidate.resume_analysis?.personal_info?.email || '';
  const phone = candidate.phone || 
                enrichedProfile?.phone ||
                candidate.resume_analysis?.personal_info?.phone || '';
  
  // Current position - try enriched profile first, then resume_analysis
  const jobTitle = enrichedProfile?.job_title || 
                  (candidate.resume_analysis?.experience?.positions_held && 
                   candidate.resume_analysis?.experience?.positions_held?.length > 0 ? 
                   candidate.resume_analysis?.experience?.positions_held?.[0]?.title : '');
                   
  const company = enrichedProfile?.job_company_name || 
                  (candidate.resume_analysis?.experience?.positions_held && 
                   candidate.resume_analysis?.experience?.positions_held?.length > 0 ? 
                   candidate.resume_analysis?.experience?.positions_held?.[0]?.company : '');
  
  // Professional summary from resume_analysis
  const summary = candidate.resume_analysis?.professional_summary || '';
  
  // Skills - combine from all sources
  // Ensure we're working with arrays to avoid errors
  const candidateSkills = Array.isArray(candidate.skills) ? candidate.skills : [];
  const resumeSkills = Array.isArray(candidate.resume_analysis?.skills) ? 
                      candidate.resume_analysis.skills : [];
  const enrichedSkills = Array.isArray(enrichedProfile?.skills) ? enrichedProfile.skills : [];
  
  // Combine skills from all sources and remove duplicates
  const skills = [...new Set([...candidateSkills, ...resumeSkills, ...enrichedSkills])];
  
  // Social links from enriched data
  const linkedinUrl = enrichedProfile?.linkedin_url || '';
  const githubUrl = enrichedProfile?.github_url || '';
  
  // Experience data
  const experience = getPositions();
  
  // Education data - similar approach as experience
  const getEducation = (): Education[] => {
    // First try enriched profile
    if (enrichedProfile?.education) {
      const eduData = parseJsonSafely<Education[]>(
        typeof enrichedProfile.education === 'string'
          ? enrichedProfile.education
          : enrichedProfile.education
      );
      
      if (eduData && Array.isArray(eduData)) return eduData;
    }
    
    // Then try candidate education
    if (candidate?.education) {
      const eduData = parseJsonSafely<Education[]>(
        typeof candidate.education === 'string'
          ? candidate.education
          : candidate.education
      );
      
      if (eduData && Array.isArray(eduData)) return eduData;
    }
    
    // Finally try resume_analysis
    if (candidate?.resume_analysis?.education) {
      // Check if it's already structured data
      if (Array.isArray(candidate.resume_analysis.education) && 
          typeof candidate.resume_analysis.education[0] === 'object') {
        return candidate.resume_analysis.education as Education[];
      }
      
      // Handle array of strings case (e.g., ["Degree, Institution", ...])
      if (Array.isArray(candidate.resume_analysis.education)) {
        return candidate.resume_analysis.education.map((edu: RawEducation) => {
          if (typeof edu !== 'string') {
            return edu; // Already an Education object
          }
          
          // Process string format
          const parts = edu.split(',').map(part => part.trim());
          
          if (parts.length >= 2) {
            return {
              degree: parts[0],
              institution: parts.slice(1).join(', ') // Combine the rest in case there are multiple commas
            };
          } else {
            // If no comma, just use the whole string as the degree
            return {
              degree: edu,
              institution: ''
            };
          }
        });
      }
    }
    
    return [];
  };
  
  const education = getEducation();

  // Add debug log for development
  console.log('Rendering with data:', { 
    name, 
    skills: skills.length, 
    experience: experience.length, 
    education: education.length,
    resumeAnalysis: candidate.resume_analysis,
    enrichedProfile
  });

  return (
    <div className="container py-6 space-y-8">
      {/* Header with basic info */}
      <div className="flex flex-col md:flex-row gap-6 items-start">
        <Avatar className="h-20 w-20 text-lg">
          <AvatarFallback>{avatarInitials}</AvatarFallback>
        </Avatar>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">{name}</h1>
          
          <div className="flex flex-wrap gap-y-2 gap-x-4">
            {location && (
              <div className="flex items-center gap-1 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className={hasEnrichedData ? 'text-blue-500' : ''}>
                  {location}
                </span>
              </div>
            )}
            
            {email && (
              <div className="flex items-center gap-1 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{email}</span>
              </div>
            )}
            
            {phone && (
              <div className="flex items-center gap-1 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className={hasEnrichedData ? 'text-blue-500' : ''}>
                  {phone}
                </span>
              </div>
            )}
            
            {(jobTitle || company) && (
              <div className="flex items-center gap-1 text-sm">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                <span className={hasEnrichedData ? 'text-blue-500' : ''}>
                  {jobTitle}{company ? ` at ${company}` : ''}
                </span>
              </div>
            )}
          </div>
          
          {/* Social links */}
          <div className="flex gap-2">
            {linkedinUrl && (
              <a 
                href={linkedinUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-700"
              >
                <LinkedinIcon className="h-5 w-5" />
              </a>
            )}
            
            {githubUrl && (
              <a 
                href={githubUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-700 hover:text-black dark:text-gray-300 dark:hover:text-white"
              >
                <GithubIcon className="h-5 w-5" />
              </a>
            )}
            
            {candidate.resume_url && (
              <a 
                href={candidate.resume_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-blue-500 hover:text-blue-700"
              >
                <FileText className="h-5 w-5" />
                <span>View Resume</span>
              </a>
            )}
          </div>
          
          {/* Profile status badge */}
          <div className="flex gap-2">
            {hasEnrichedData && (
              <Badge className="bg-blue-500">Enhanced Profile</Badge>
            )}
            
            {!profileTableExists && (
              <Badge variant="outline" className="border-amber-500 text-amber-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                <span>Database Upgrade Pending</span>
              </Badge>
            )}
          </div>
        </div>
      </div>
      
      {/* Main content with tabs */}
      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="resume">Resume</TabsTrigger>
          <TabsTrigger value="assessments">Assessments</TabsTrigger>
        </TabsList>
        
        {/* Profile Tab */}
        <TabsContent value="profile" className="mt-4">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Professional Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Professional Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {summary || 'No professional summary available'}
                </p>
              </CardContent>
            </Card>
            
            {/* Skills */}
            <Card>
              <CardHeader>
                <CardTitle>Skills</CardTitle>
              </CardHeader>
              <CardContent>
                {skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill: string, index: number) => (
                      <Badge
                        key={`${skill}-${index}`}
                        variant="secondary"
                        className="px-2.5 py-1 text-sm"
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No skills listed</p>
                )}
              </CardContent>
            </Card>
            
            {/* Areas of Specialization */}
            {candidate.resume_analysis?.areas_specialization && candidate.resume_analysis.areas_specialization.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Areas of Specialization</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {candidate.resume_analysis.areas_specialization.map((area: string, index: number) => (
                      <Badge
                        key={`${area}-${index}`}
                        variant="outline"
                        className="px-2.5 py-1 text-sm border-blue-500 text-blue-600"
                      >
                        {area}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Notable Achievements */}
            {candidate.resume_analysis?.notable_achievements && candidate.resume_analysis.notable_achievements.length > 0 && (
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Notable Achievements</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc list-inside space-y-2 pl-2">
                    {candidate.resume_analysis.notable_achievements.map((achievement: string, index: number) => (
                      <li key={index} className="text-blue-600">{achievement}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
            
            {/* Experience */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Experience</CardTitle>
              </CardHeader>
              <CardContent>
                {experience.length > 0 ? (
                  <div className="space-y-6">
                    {experience.map((job: JobPosition, index: number) => (
                      <div key={index} className="border-b pb-4 last:border-0">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
                          <h3 className="font-medium text-lg">{job.title}</h3>
                          <p className="text-sm text-muted-foreground flex items-center">
                            <span className="inline-block mr-1">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-calendar">
                                <rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect>
                                <line x1="16" x2="16" y1="2" y2="6"></line>
                                <line x1="8" x2="8" y1="2" y2="6"></line>
                                <line x1="3" x2="21" y1="10" y2="10"></line>
                              </svg>
                            </span>
                            {formatDateRange(job)}
                          </p>
                        </div>
                        <p className="font-medium text-blue-600">{job.company}</p>
                        
                        {formatResponsibilities(job.responsibilities).length > 0 && (
                          <div className="mt-2">
                            <ul className="list-disc list-inside text-sm space-y-1 pl-2">
                              {formatResponsibilities(job.responsibilities).map((item, idx) => (
                                <li key={idx}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {job.achievements && Array.isArray(job.achievements) && job.achievements.length > 0 && (
                          <div className="mt-3">
                            <p className="text-sm font-medium">Key Achievements:</p>
                            <ul className="list-disc list-inside text-sm space-y-1 pl-2">
                              {job.achievements.map((achievement, idx) => (
                                <li key={idx} className="text-blue-600">{achievement}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No experience listed</p>
                )}
              </CardContent>
            </Card>
            
            {/* Education */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Education</CardTitle>
              </CardHeader>
              <CardContent>
                {education.length > 0 ? (
                  <div className="space-y-4">
                    {education.map((edu: Education, index: number) => (
                      <div key={index} className="border-b pb-3 last:border-0">
                        <h3 className="font-medium text-lg">{edu.degree}</h3>
                        <p className="text-blue-600 font-medium">{edu.institution}</p>
                        {(edu.start_date || edu.end_date) && (
                          <div className="flex items-center mt-1">
                            <span className="inline-block mr-1">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-calendar">
                                <rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect>
                                <line x1="16" x2="16" y1="2" y2="6"></line>
                                <line x1="8" x2="8" y1="2" y2="6"></line>
                                <line x1="3" x2="21" y1="10" y2="10"></line>
                              </svg>
                            </span>
                            <p className="text-sm text-muted-foreground">
                              {edu.start_date || ''} {edu.end_date ? `- ${edu.end_date}` : edu.start_date ? '- Present' : ''}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No education listed</p>
                )}
              </CardContent>
            </Card>
            
            {/* Enriched Data (if available) */}
            {hasEnrichedData && (
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>
                    <span className="text-blue-500">Enhanced Profile Data</span>
                  </CardTitle>
                  <CardDescription>Additional data from People Data Labs</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Personal Info */}
                    {(enrichedProfile.first_name || enrichedProfile.last_name) && (
                      <div>
                        <h3 className="font-medium mb-2">Personal Information</h3>
                        <div className="space-y-1 text-sm">
                          {enrichedProfile.first_name && (
                            <p>First Name: <span className="text-blue-500">{enrichedProfile.first_name}</span></p>
                          )}
                          {enrichedProfile.last_name && (
                            <p>Last Name: <span className="text-blue-500">{enrichedProfile.last_name}</span></p>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Location Info */}
                    {enrichedProfile.location_name && (
                      <div>
                        <h3 className="font-medium mb-2">Location</h3>
                        <div className="space-y-1 text-sm">
                          <p>
                            <span className="text-blue-500">{enrichedProfile.location_name}</span>
                          </p>
                          {enrichedProfile.location_region && (
                            <p>Region: <span className="text-blue-500">{enrichedProfile.location_region}</span></p>
                          )}
                          {enrichedProfile.location_country && (
                            <p>Country: <span className="text-blue-500">{enrichedProfile.location_country}</span></p>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Work Info */}
                    {(enrichedProfile.job_title || enrichedProfile.job_company_name) && (
                      <div>
                        <h3 className="font-medium mb-2">Current Position</h3>
                        <div className="space-y-1 text-sm">
                          {enrichedProfile.job_title && (
                            <p>Title: <span className="text-blue-500">{enrichedProfile.job_title}</span></p>
                          )}
                          {enrichedProfile.job_company_name && (
                            <p>Company: <span className="text-blue-500">{enrichedProfile.job_company_name}</span></p>
                          )}
                          {enrichedProfile.job_start_date && (
                            <p>Started: <span className="text-blue-500">{enrichedProfile.job_start_date}</span></p>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Social Profiles */}
                    {(linkedinUrl || githubUrl) && (
                      <div>
                        <h3 className="font-medium mb-2">Social Profiles</h3>
                        <div className="space-y-1 text-sm">
                          {linkedinUrl && (
                            <p>
                              <a 
                                href={linkedinUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:underline flex items-center gap-1"
                              >
                                <LinkedinIcon className="h-4 w-4" />
                                LinkedIn Profile
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </p>
                          )}
                          {githubUrl && (
                            <p>
                              <a 
                                href={githubUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:underline flex items-center gap-1"
                              >
                                <GithubIcon className="h-4 w-4" />
                                GitHub Profile
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
        
        {/* Resume Tab */}
        <TabsContent value="resume" className="mt-4">
          {candidate.resume_url ? (
            <Card>
              <CardContent className="p-0 h-[800px]">
                <iframe
                  src={candidate.resume_url}
                  title="Resume"
                  className="w-full h-full"
                  frameBorder="0"
                />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No resume available</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {/* Assessments Tab */}
        <TabsContent value="assessments" className="mt-4">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No assessments available yet</p>
              <Button className="mt-4" variant="outline">
                Create Assessment
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CandidateProfile; 