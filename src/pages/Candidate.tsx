import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Card } from '@/components/ui/card';
import { useQueryClient } from '@tanstack/react-query';
import ResumeUploader from '@/components/resume/ResumeUploader';
import CandidateList from '@/components/candidates/CandidateList';

const Candidate = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);

  const handleUploadComplete = async (fileUrl: string, fileName: string) => {
    // Refresh the candidates list after upload
    await queryClient.invalidateQueries({ queryKey: ['candidates'] });
    toast({
      title: "Resume uploaded",
      description: "Candidate information has been extracted and profile has been enriched",
    });
  };

  const handleUploadError = (error: Error) => {
    toast({
      title: "Error uploading resume",
      description: error.message || "An unexpected error occurred",
      variant: "destructive"
    });
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
          <ResumeUploader 
            onUploadComplete={handleUploadComplete}
            onUploadError={handleUploadError}
          />
        </Card>

        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6">Candidate Directory</h2>
          <CandidateList />
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Candidate;
