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

// Define types for better type safety
interface Candidate {
  id: string;
  tenant_id: string;
  full_name: string;
  email: string;
  phone?: string;
  resume_url?: string;
  skills?: string[];
  resume_analysis?: ResumeAnalysis;
}

interface ResumeAnalysis {
  personal_info: {
    full_name: string;
    email: string;
    phone?: string;
    geographic_location?: string;
  };
  professional_summary?: string;
  key_skills_expertise?: string[];
  positions_held?: JobPosition[];
  education?: Education[];
}

interface JobPosition {
  title: string;
  company: string;
  start_date?: string;
  end_date?: string;
  responsibilities?: string;
}

interface Education {
  degree: string;
  institution: string;
  start_date?: string;
  end_date?: string;
}

interface CandidateProfile {
  id: string;
  candidate_id: string;
  tenant_id: string;
  first_name?: string;
  last_name?: string;
  location_name?: string;
  mobile_phone?: string;
  job_title?: string;
  job_company_name?: string;
  linkedin_url?: string;
  github_url?: string;
  skills?: string[];
  experience?: any; // JSON data
  education?: any; // JSON data
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
        // Fetch candidate data first
        const candidateResult = await supabase
          .from('candidates')
          .select('*')
          .eq('id', id)
          .single();
        
        if (candidateResult.error) throw candidateResult.error;
        
        // Log candidate data to help with debugging
        console.log('Fetched candidate data:', candidateResult.data);
        
        // Store candidate data
        setCandidate(candidateResult.data);
        
        // Try to fetch profile data, but handle the case where table doesn't exist yet
        try {
          const profileResult = await supabase
            .from('candidate_profiles')
            .select('*')
            .eq('candidate_id', id)
            .maybeSingle();
          
          // If successful, store profile data
          if (profileResult.data) {
            console.log('Fetched profile data:', profileResult.data);
            setEnrichedProfile(profileResult.data);
          }
        } catch (profileError: any) {
          console.warn('Error fetching profile data:', profileError);
          
          // If the error is that the table doesn't exist, set the flag
          if (profileError.message && profileError.message.includes('relation "public.candidate_profiles" does not exist')) {
            console.log('candidate_profiles table does not exist yet');
            setProfileTableExists(false);
          }
          
          // Don't set error since this is optional data
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

  // Extract data from candidate and enriched profile (if available)
  const hasEnrichedData = !!enrichedProfile;
  const name = candidate.full_name || '';
  const avatarInitials = getInitials(name);
  
  // Location - try enriched profile first, then resume_analysis
  const location = enrichedProfile?.location_name || 
                  candidate.resume_analysis?.personal_info.geographic_location || '';
  
  // Contact info - prefer candidate record, then enriched data
  const email = candidate.email || candidate.resume_analysis?.personal_info.email || '';
  const phone = candidate.phone || 
                enrichedProfile?.mobile_phone || 
                candidate.resume_analysis?.personal_info.phone || '';
  
  // Current position - try enriched profile first, then resume_analysis
  const jobTitle = enrichedProfile?.job_title || 
                  (candidate.resume_analysis?.positions_held && 
                   candidate.resume_analysis.positions_held.length > 0 ? 
                   candidate.resume_analysis.positions_held[0].title : '');
                   
  const company = enrichedProfile?.job_company_name || 
                  (candidate.resume_analysis?.positions_held && 
                   candidate.resume_analysis.positions_held.length > 0 ? 
                   candidate.resume_analysis.positions_held[0].company : '');
  
  // Professional summary from resume_analysis
  const summary = candidate.resume_analysis?.professional_summary || '';
  
  // Skills - combine from all sources
  // Ensure we're working with arrays to avoid errors
  const candidateSkills = Array.isArray(candidate.skills) ? candidate.skills : [];
  const resumeSkills = Array.isArray(candidate.resume_analysis?.key_skills_expertise) ? 
                      candidate.resume_analysis.key_skills_expertise : [];
  const enrichedSkills = Array.isArray(enrichedProfile?.skills) ? enrichedProfile.skills : [];
  
  // Combine skills from all sources and remove duplicates
  const skills = [...new Set([...candidateSkills, ...resumeSkills, ...enrichedSkills])];
  
  // Social links from enriched data
  const linkedinUrl = enrichedProfile?.linkedin_url || '';
  const githubUrl = enrichedProfile?.github_url || '';
  
  // Work experience - use enriched profile or resume_analysis
  const experienceFromEnriched = enrichedProfile?.experience ? 
                                (typeof enrichedProfile.experience === 'string' ? 
                                  JSON.parse(enrichedProfile.experience) : 
                                  enrichedProfile.experience) : 
                                [];
  
  const experienceFromResume = Array.isArray(candidate.resume_analysis?.positions_held) ? 
                              candidate.resume_analysis.positions_held : 
                              [];
  
  // Use enriched experience if available, otherwise use resume_analysis
  const experience = experienceFromEnriched.length > 0 ? 
                    experienceFromEnriched : 
                    experienceFromResume;
  
  // Education data - similar approach as experience
  const educationFromEnriched = enrichedProfile?.education ? 
                              (typeof enrichedProfile.education === 'string' ? 
                                JSON.parse(enrichedProfile.education) : 
                                enrichedProfile.education) : 
                              [];
  
  const educationFromResume = Array.isArray(candidate.resume_analysis?.education) ? 
                            candidate.resume_analysis.education : 
                            [];
  
  // Use enriched education if available, otherwise use resume_analysis
  const education = educationFromEnriched.length > 0 ? 
                  educationFromEnriched : 
                  educationFromResume;

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
                  <div className="flex flex-wrap gap-1.5">
                    {skills.map((skill: string, index: number) => (
                      <Badge key={`${skill}-${index}`} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No skills listed</p>
                )}
              </CardContent>
            </Card>
            
            {/* Experience */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Experience</CardTitle>
              </CardHeader>
              <CardContent>
                {experience.length > 0 ? (
                  <div className="space-y-4">
                    {experience.map((job: JobPosition, index: number) => (
                      <div key={index} className="border-b pb-3 last:border-0">
                        <h3 className="font-medium">{job.title} at {job.company}</h3>
                        <p className="text-sm text-muted-foreground">
                          {job.start_date || ''} {job.end_date ? `- ${job.end_date}` : '- Present'}
                        </p>
                        {job.responsibilities && (
                          <p className="text-sm mt-2">{job.responsibilities}</p>
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
                        <h3 className="font-medium">{edu.degree}</h3>
                        <p className="text-sm">{edu.institution}</p>
                        <p className="text-sm text-muted-foreground">
                          {edu.start_date || ''} {edu.end_date ? `- ${edu.end_date}` : ''}
                        </p>
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