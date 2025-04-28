
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Loader2 } from 'lucide-react';
import { toast } from "sonner";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';

type FormData = {
  title: string;
  shortDescription: string;
};

const CreatePosition = () => {
  const navigate = useNavigate();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDescription, setGeneratedDescription] = useState('');
  
  const form = useForm<FormData>({
    defaultValues: {
      title: '',
      shortDescription: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsGenerating(true);
    try {
      // In a real implementation, this would call a Supabase Edge Function
      // that would use OpenAI to generate the position description
      
      // Simulate AI generation with a timeout
      setTimeout(() => {
        const aiGeneratedDescription = generateMockDescription(data.title, data.shortDescription);
        setGeneratedDescription(aiGeneratedDescription);
        setIsGenerating(false);
        toast.success("Position description generated successfully!");
      }, 1500);
      
      // For a real implementation, you would use:
      /*
      const { data: aiResponse, error } = await supabase.functions.invoke('generate-position-description', {
        body: { title: data.title, shortDescription: data.shortDescription }
      });
      
      if (error) throw error;
      setGeneratedDescription(aiResponse.description);
      */
      
    } catch (error) {
      console.error("Error generating position description:", error);
      toast.error("Failed to generate position description. Please try again.");
      setIsGenerating(false);
    }
  };

  const handleSavePosition = async () => {
    // In a real implementation, this would save the position to the database
    toast.success("Position saved successfully!");
    navigate('/positions'); // Redirect to positions list (to be implemented)
  };

  // Mock function to generate a position description
  const generateMockDescription = (title: string, shortDesc: string) => {
    return `
# ${title}

## Overview
${shortDesc}

## Responsibilities
- Design, develop, and maintain high-performance software applications
- Collaborate with cross-functional teams to define and implement new features
- Write clean, efficient, and well-documented code
- Participate in code reviews and provide constructive feedback
- Troubleshoot and fix bugs in existing applications

## Requirements
- Bachelor's degree in Computer Science or related field
- 3+ years of experience in software development
- Strong proficiency in JavaScript/TypeScript and React
- Experience with modern frontend frameworks and state management
- Knowledge of RESTful APIs and HTTP protocols
- Excellent problem-solving and communication skills

## Preferred Qualifications
- Experience with Supabase, Firebase, or other backend-as-a-service platforms
- Familiarity with CI/CD pipelines and DevOps practices
- Understanding of responsive design principles
- Experience with AI-powered applications or integrating AI services

## Benefits
- Competitive salary and benefits package
- Flexible work arrangements
- Professional development opportunities
- Collaborative and inclusive work environment
    `;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-4xl pt-24 pb-16">
        <h1 className="text-3xl font-bold mb-6">Create New Position</h1>
        
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Position Details</CardTitle>
              <CardDescription>
                Provide basic information and we'll generate a full position description
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Position Title</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Senior Frontend Developer" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="shortDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Brief Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Briefly describe the position and key responsibilities" 
                            className="min-h-[120px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Just a few sentences to guide the AI in generating a full description
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    disabled={isGenerating}
                    className="w-full"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      'Generate Description'
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Generated Description</CardTitle>
              <CardDescription>
                AI-generated position description based on your input
              </CardDescription>
            </CardHeader>
            <CardContent>
              {generatedDescription ? (
                <div className="prose prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap bg-muted p-4 rounded-md text-sm overflow-auto max-h-[500px]">
                    {generatedDescription}
                  </pre>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[300px] text-center text-muted-foreground">
                  <p>No description generated yet</p>
                  <p className="text-sm mt-2">Fill out the form and click "Generate Description"</p>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                disabled={!generatedDescription} 
                onClick={handleSavePosition}
              >
                Save Position
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CreatePosition;
