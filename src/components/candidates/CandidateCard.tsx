import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, MapPin, Mail, Phone, Briefcase, ExternalLink, LinkedinIcon, GithubIcon } from 'lucide-react';
import { formatFullName } from '@/lib/utils';

interface CandidateCardProps {
  candidate: any; // Candidate type
  enrichedProfile?: any; // Optional enriched profile data
}

// Helper function to get initials from name
const getInitials = (name: string | null): string => {
  if (!name) return '?';
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

export const CandidateCard: React.FC<CandidateCardProps> = ({ candidate, enrichedProfile }) => {
  // Determine if we have enriched data
  const hasEnrichedData = !!enrichedProfile;
  
  // Get name from appropriate source
  const name = formatFullName(candidate.first_name, candidate.last_name);
  const avatarInitials = getInitials(name);
  
  // Get location from either enriched data or resume analysis
  const location = enrichedProfile?.location_name || 
                   (candidate.resume_analysis?.geographic_location || '');
  
  // Get email from either source
  const email = candidate.email || '';
  
  // Get phone from either source
  const phone = enrichedProfile?.mobile_phone || candidate.phone || '';
  
  // Get current position from either source
  const jobTitle = enrichedProfile?.job_title || 
                   (candidate.resume_analysis?.positions_held?.[0]?.title || '');
  const company = enrichedProfile?.job_company_name || 
                  (candidate.resume_analysis?.positions_held?.[0]?.company || '');
  
  // Get skills - combine both sources if available
  const baseSkills = candidate.skills || 
                    (candidate.resume_analysis?.key_skills_expertise || []);
  const enrichedSkills = enrichedProfile?.skills || [];
  const skills = [...new Set([...baseSkills, ...enrichedSkills])].slice(0, 10);
  
  // Determine if we should display skills
  const displaySkills = skills.slice(0, 3);
  const moreSkills = skills.length > 3 ? skills.length - 3 : 0;
  
  // Social links from enriched data
  const linkedinUrl = enrichedProfile?.linkedin_url || '';
  const githubUrl = enrichedProfile?.github_url || '';
  
  return (
    <Link to={`/candidates/${candidate.id}`} className="block transition-all hover:shadow-md">
      <Card className="h-full">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarFallback>{avatarInitials}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="line-clamp-1">{name}</CardTitle>
              {location && (
                <CardDescription className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  <span className={hasEnrichedData ? 'text-blue-500' : ''}>
                    {location}
                  </span>
                </CardDescription>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Contact Information */}
          <div className="space-y-1">
            {email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="truncate">{email}</span>
              </div>
            )}
            {phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className={hasEnrichedData ? 'text-blue-500' : ''}>
                  {phone}
                </span>
              </div>
            )}
            {(jobTitle || company) && (
              <div className="flex items-center gap-2 text-sm">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                <span className={hasEnrichedData ? 'text-blue-500' : ''}>
                  {jobTitle}{company ? ` at ${company}` : ''}
                </span>
              </div>
            )}
          </div>
          
          {/* Summary */}
          {candidate.resume_analysis?.professional_summary && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {candidate.resume_analysis.professional_summary}
            </p>
          )}
          
          {/* Skills */}
          {displaySkills.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {displaySkills.map((skill: string, index: number) => (
                <Badge key={`${skill}-${index}`} variant="secondary" className="text-xs">
                  {skill}
                </Badge>
              ))}
              {moreSkills > 0 && (
                <Badge variant="outline" className="text-xs">
                  +{moreSkills} more
                </Badge>
              )}
            </div>
          )}
          
          {/* Social Links (only if enriched) */}
          {hasEnrichedData && (linkedinUrl || githubUrl) && (
            <div className="flex gap-2 mt-2">
              {linkedinUrl && (
                <a 
                  href={linkedinUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-700"
                  onClick={(e) => e.stopPropagation()}
                >
                  <LinkedinIcon className="h-4 w-4" />
                </a>
              )}
              {githubUrl && (
                <a 
                  href={githubUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-gray-700"
                  onClick={(e) => e.stopPropagation()}
                >
                  <GithubIcon className="h-4 w-4" />
                </a>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          {candidate.resume_url && (
            <Button variant="outline" size="sm" className="text-xs">
              <FileText className="h-3 w-3 mr-1" />
              Resume
            </Button>
          )}
          {hasEnrichedData && (
            <Badge variant="outline" className="text-blue-500 border-blue-500">
              Enhanced
            </Badge>
          )}
        </CardFooter>
      </Card>
    </Link>
  );
};

export default CandidateCard; 