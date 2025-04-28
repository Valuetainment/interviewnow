
import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/toast';
import { FileUp } from 'lucide-react';

const Candidate = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [candidateName, setCandidateName] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [resumeText, setResumeText] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Check if file is a PDF
      if (selectedFile.type !== 'application/pdf') {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF file",
          variant: "destructive"
        });
        return;
      }
      
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a PDF resume to upload",
        variant: "destructive"
      });
      return;
    }

    if (!candidateName || !candidateEmail) {
      toast({
        title: "Missing information",
        description: "Please provide candidate name and email",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    // Mock the PDF processing - in a real app, we'd send to Supabase
    // and parse the PDF server-side
    setTimeout(() => {
      // Mock resume text extraction
      const mockResumeText = `
        # ${candidateName}
        Email: ${candidateEmail}
        
        ## Experience
        - Senior Developer at Tech Company (2020-Present)
        - Software Engineer at Startup Inc. (2018-2020)
        
        ## Education
        - Bachelor of Computer Science, University (2014-2018)
        
        ## Skills
        - JavaScript, TypeScript, React
        - Node.js, Express
        - SQL, NoSQL databases
        - Cloud platforms (AWS, GCP)
      `;
      
      setResumeText(mockResumeText);
      setLoading(false);
      
      toast({
        title: "Resume uploaded",
        description: "Resume has been successfully processed",
      });
    }, 2000);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex-grow container mx-auto px-4 py-24 md:py-32">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold mb-8">Add Candidate</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Candidate Information</CardTitle>
                <CardDescription>
                  Upload a candidate's resume and enter their details.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Candidate Name</Label>
                  <Input 
                    id="name"
                    value={candidateName}
                    onChange={(e) => setCandidateName(e.target.value)}
                    placeholder="John Doe"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email"
                    type="email"
                    value={candidateEmail}
                    onChange={(e) => setCandidateEmail(e.target.value)}
                    placeholder="john.doe@example.com"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="resume">Resume (PDF only)</Label>
                  <div className="border border-dashed border-input rounded-md p-6 flex flex-col items-center justify-center">
                    <FileUp className="mb-2 h-8 w-8 text-muted-foreground" />
                    <p className="mb-2 text-sm text-muted-foreground">
                      Drag and drop your file here or click to browse
                    </p>
                    <Input
                      id="resume"
                      type="file"
                      accept="application/pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById('resume')?.click()}
                    >
                      Select PDF
                    </Button>
                    {file && (
                      <p className="mt-2 text-sm">
                        Selected: {file.name}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={handleUpload} 
                  disabled={loading || !file}
                  className="w-full"
                >
                  {loading ? "Processing..." : "Upload & Process Resume"}
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Processed Resume</CardTitle>
                <CardDescription>
                  The extracted content from the candidate's resume.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {resumeText ? (
                  <div className="whitespace-pre-line border rounded-md p-4 bg-muted/50 h-[400px] overflow-y-auto">
                    {resumeText}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[400px] border rounded-md text-muted-foreground bg-muted/50">
                    <p>Upload a resume to see the processed content</p>
                  </div>
                )}
              </CardContent>
              <CardFooter className="justify-end">
                {resumeText && (
                  <Button variant="outline">Save Candidate</Button>
                )}
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Candidate;
