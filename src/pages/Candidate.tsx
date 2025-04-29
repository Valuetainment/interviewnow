
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { FileText, User, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

const Candidate = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);

  // Query to fetch candidates
  const { data: candidates, isLoading } = useQuery({
    queryKey: ['candidates'],
    queryFn: async () => {
      // Mock data for now, as we don't have the actual table yet
      // In production this would be a Supabase query to fetch candidates
      return [
        {
          id: '1',
          full_name: 'Maral Keshishian',
          location: 'Dallas, TX',
          email: null,
          phone: null,
          summary: 'Seasoned financial-services executive with nearly two decades of experience spanning life insurance sales, financial planning, and investment management.',
          skills: ['Strategic Leadership & Culture Change', 'Life Insurance & Annuity Sales', 'Financial Planning & Reporting (GAAP)'],
          resume_url: '#',
          initials: 'MK',
        },
        {
          id: '2',
          full_name: 'JOHN R. OWENS III',
          location: 'Dallas, TX 75229',
          email: 'jrowens3@gmail.com',
          phone: '(858) 999-6214',
          summary: 'Dynamic and results-oriented professional with extensive experience in investment analysis, market research, and public relations.',
          skills: ['Investment Analysis', 'Public Relations', 'Market Research'],
          extra_skills_count: 6,
          resume_url: '#',
          initials: 'JRO',
        },
        {
          id: '3',
          full_name: 'Timothy Nichols',
          location: 'Naples, FL',
          email: 'timothy0530@gmail.com',
          phone: '(561) 631-1059',
          summary: 'Digital Advertising & Marketing Technology Executive with extensive experience leading data-driven marketing initiatives.',
          skills: ['Digital Advertising', 'Marketing Technology', 'Data Analysis'],
          extra_skills_count: 4,
          resume_url: '#',
          initials: 'TN',
        },
        {
          id: '4',
          full_name: 'Amado Guerrero',
          location: 'Hialeah, FL 33016',
          email: 'amado.s.guerrero@gmail.com',
          phone: '786-259-5989',
          summary: '',
          skills: [],
          resume_url: '#',
          initials: 'AG',
        },
        {
          id: '5',
          full_name: 'Valerie Uribe',
          location: 'Southern California',
          email: 'valerie.a.uribe@gmail.com',
          phone: '951-452-2183',
          summary: '',
          skills: [],
          resume_url: '#',
          initials: 'VU',
        },
      ];
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Check if file is a PDF
      if (file.type !== 'application/pdf') {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF file",
          variant: "destructive"
        });
        return;
      }
      
      setIsUploading(true);
      
      try {
        // Step 1: Upload to Supabase Storage
        toast({
          title: "Processing resume...",
          description: "Your file is being uploaded and analyzed",
        });

        // Mock the upload and processing flow
        setTimeout(() => {
          toast({
            title: "Resume processed successfully",
            description: "Candidate information has been extracted",
          });
          setIsUploading(false);
          
          // In a real implementation, we would navigate to the candidate details page
          // navigate(`/candidates/${newCandidateId}`);
        }, 3000);

        // In a real implementation, this would be:
        /*
        // Upload file to Supabase storage
        const fileName = `${Date.now()}-${file.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('resumes')
          .upload(fileName, file);
          
        if (uploadError) throw uploadError;

        // Get public URL for the file
        const { data: publicUrlData } = supabase.storage
          .from('resumes')
          .getPublicUrl(uploadData.path);
          
        const publicUrl = publicUrlData.publicUrl;
        
        // Process the PDF to extract text
        const { data: processedData, error: processError } = await supabase.functions
          .invoke('process-resume', { body: { pdfUrl: publicUrl } });
          
        if (processError) throw processError;
        
        // Use AI to analyze the resume text
        const { data: analysisData, error: analysisError } = await supabase.functions
          .invoke('analyze-resume', { body: { resumeText: processedData.text } });
          
        if (analysisError) throw analysisError;
        
        // Store candidate data in database
        const { data: candidate, error: dbError } = await supabase
          .from('candidates')
          .insert({
            resume_url: publicUrl,
            resume_text: processedData.text,
            full_name: analysisData.personal_info.full_name,
            email: analysisData.personal_info.email,
            phone: analysisData.personal_info.phone,
            location: analysisData.personal_info.location,
            summary: analysisData.summary,
            skills: analysisData.skills,
            experience: analysisData.experience,
            education: analysisData.education,
          })
          .select('id')
          .single();
          
        if (dbError) throw dbError;
        
        // Navigate to the new candidate's page
        navigate(`/candidates/${candidate.id}`);
        */
      } catch (error: any) {
        console.error("Error processing resume:", error);
        toast({
          title: "Error processing resume",
          description: error.message || "An unexpected error occurred",
          variant: "destructive"
        });
      } finally {
        setIsUploading(false);
      }
    }
  };
  
  const triggerFileInput = () => {
    document.getElementById('resume-upload')?.click();
  };

  const getInitialsColor = (initials: string) => {
    // Simple hash function to get a consistent color for initials
    const hash = initials.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const hue = hash % 360;
    return `hsl(${hue}, 70%, 30%)`;
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex-grow container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Candidates</h1>
          <Button onClick={() => navigate('/add-candidate')} className="flex items-center gap-2">
            <span>+ Add New Candidate</span>
          </Button>
        </div>

        <Card className="mb-8 p-8">
          <h2 className="text-2xl font-bold mb-6">Upload Resume</h2>
          <Button 
            onClick={triggerFileInput} 
            className="flex items-center gap-2"
            variant="default"
            disabled={isUploading}
          >
            <FileText className="h-5 w-5" />
            <span>{isUploading ? "Processing..." : "Upload Resume"}</span>
          </Button>
          <input
            id="resume-upload"
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="hidden"
          />
        </Card>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <p>Loading candidates...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {candidates?.map((candidate) => (
              <Card key={candidate.id} className="overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div 
                      className="h-14 w-14 rounded-full flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: getInitialsColor(candidate.initials) }}
                    >
                      {candidate.initials}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{candidate.full_name}</h3>
                      <p className="text-gray-500 flex items-center gap-1">
                        <span className="inline-block h-4 w-4">📍</span> {candidate.location}
                      </p>
                    </div>
                  </div>
                  
                  {candidate.email && (
                    <div className="flex items-center gap-2 mb-2">
                      <span className="inline-block h-4 w-4">✉️</span>
                      <span className="text-sm">{candidate.email}</span>
                    </div>
                  )}

                  {candidate.phone && (
                    <div className="flex items-center gap-2 mb-4">
                      <span className="inline-block h-4 w-4">📞</span>
                      <span className="text-sm">{candidate.phone}</span>
                    </div>
                  )}
                  
                  {candidate.summary && (
                    <div className="mb-4">
                      <div className="flex items-center gap-1 mb-1">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-500">Summary</span>
                      </div>
                      <p className="text-sm line-clamp-3">{candidate.summary}</p>
                    </div>
                  )}
                  
                  {candidate.skills && candidate.skills.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {candidate.skills.map((skill, index) => (
                          <span 
                            key={index}
                            className="inline-block bg-gray-100 px-3 py-1 rounded-md text-xs"
                          >
                            {skill}
                          </span>
                        ))}
                        {candidate.extra_skills_count && (
                          <span className="inline-block bg-gray-100 px-3 py-1 rounded-md text-xs">
                            +{candidate.extra_skills_count}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div className="border-t">
                  <Button 
                    variant="ghost" 
                    className="w-full flex items-center justify-center gap-2 py-3"
                    onClick={() => navigate(`/candidates/${candidate.id}`)}
                  >
                    <FileText className="h-4 w-4" />
                    <span>View Resume</span>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Candidate;
