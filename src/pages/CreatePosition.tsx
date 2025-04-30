/*
 * Note: This file contains TypeScript errors related to the Database type definitions
 * which don't include positions, competencies, and position_competencies tables.
 * These type errors would need to be fixed by updating the types in src/integrations/supabase/types.ts
 * The code will still work at runtime despite these TypeScript errors.
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Loader2, AlertCircle } from 'lucide-react';
import { toast } from "sonner";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import { CompetencyWeights } from '@/components/CompetencyWeights';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

// Define the schema for form validation
const formSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  shortDescription: z.string().min(10, 'Description must be at least 10 characters'),
});

type FormData = z.infer<typeof formSchema>;

// Define the type for competencies
type Competency = {
  id: string;
  name: string;
  description: string;
  suggested_weight?: number;
};

const CreatePosition = () => {
  const navigate = useNavigate();
  const { tenantId } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [generatedDescription, setGeneratedDescription] = useState('');
  const [suggestedCompetencies, setSuggestedCompetencies] = useState<Competency[]>([]);
  const [competencyWeights, setCompetencyWeights] = useState<Record<string, number>>({});
  const [weightsValid, setWeightsValid] = useState(false);
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      shortDescription: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    if (!tenantId) {
      toast.error("You must be logged in to create a position");
      return;
    }

    setIsGenerating(true);
    try {
      // Call the Supabase Edge Function
      const { data: generatedData, error } = await supabase.functions.invoke('generate-position', {
        body: { 
          title: data.title, 
          shortDescription: data.shortDescription 
        }
      });
      
      if (error) throw error;

      if (!generatedData || !generatedData.description) {
        throw new Error("Failed to generate position description");
      }
      
      // Set the generated description
      setGeneratedDescription(generatedData.description);
      
      // Process suggested competencies
      if (generatedData.competencies && Array.isArray(generatedData.competencies)) {
        // Format competencies with unique IDs
        const formattedCompetencies = generatedData.competencies.map((comp, index) => ({
          id: `suggested-${index}`,
          name: comp.name,
          description: comp.description,
          suggested_weight: typeof comp.suggested_weight === 'number' ? comp.suggested_weight : 0,
        }));
        
        setSuggestedCompetencies(formattedCompetencies);
        
        // Initialize weights based on suggestions
        const initialWeights = formattedCompetencies.reduce((acc, comp) => {
          acc[comp.id] = typeof comp.suggested_weight === 'number' ? comp.suggested_weight : 0;
          return acc;
        }, {} as Record<string, number>);
        
        setCompetencyWeights(initialWeights);
        
        // Check if the weights are valid (sum to 100)
        const totalWeight = Object.values(initialWeights).reduce((sum, weight) => sum + weight, 0);
        setWeightsValid(totalWeight === 100);
      }
      
      toast.success("Position description generated successfully!");
    } catch (error) {
      console.error("Error generating position description:", error);
      toast.error(error instanceof Error ? error.message : "Failed to generate position description");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSavePosition = async () => {
    if (!tenantId) {
      toast.error("You must be logged in to create a position");
      return;
    }

    // Validate that weights add up to 100%
    if (!weightsValid) {
      toast.error("Competency weights must add up to 100% before saving position");
      return;
    }

    const { title, shortDescription } = form.getValues();
    
    setIsSaving(true);
    try {
      // 1. Create the position
      // @ts-ignore - Database type definition doesn't include positions table
      const { data: position, error: positionError } = await supabase
        .from('positions')
        .insert({
          tenant_id: tenantId,
          title: title,
          description: generatedDescription,
        })
        .select('id')
        .single();
        
      if (positionError) throw positionError;
      
      if (!position || !position.id) {
        throw new Error("Failed to create position");
      }
      
      // 2. Create the competencies and associate them with the position
      const competencyPromises = Object.entries(competencyWeights).map(async ([compId, weight]) => {
        // Skip if weight is 0
        if (weight === 0) return;
        
        // Find the competency details
        const competency = suggestedCompetencies.find(c => c.id === compId);
        if (!competency) return;
        
        // Check if this competency already exists
        // @ts-ignore - Database type definition doesn't include competencies table
        const { data: existingComp, error: searchError } = await supabase
          .from('competencies')
          .select('id')
          .eq('tenant_id', tenantId)
          .eq('name', competency.name)
          .maybeSingle();
          
        if (searchError) throw searchError;
        
        let competencyId;
        
        if (existingComp) {
          // Use existing competency
          competencyId = existingComp.id;
        } else {
          // Create new competency
          // @ts-ignore - Database type definition doesn't include competencies table
          const { data: newComp, error: compError } = await supabase
            .from('competencies')
            .insert({
              tenant_id: tenantId,
              name: competency.name,
              description: competency.description,
            })
            .select('id')
            .single();
            
          if (compError) throw compError;
          competencyId = newComp.id;
        }
        
        // Create the position-competency association
        // @ts-ignore - Database type definition doesn't include position_competencies table
        const { error: assocError } = await supabase
          .from('position_competencies')
          .insert({
            position_id: position.id,
            competency_id: competencyId,
            tenant_id: tenantId,
            weight: weight,
          });
          
        if (assocError) throw assocError;
      });
      
      // Wait for all competency operations to complete
      await Promise.all(competencyPromises);
      
      toast.success("Position saved successfully!");
      navigate(`/positions/${position.id}`);
    } catch (error) {
      console.error("Error saving position:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save position");
    } finally {
      setIsSaving(false);
    }
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
          </Card>
        </div>

        {/* Competency Weights Section - Only show after generation */}
        {generatedDescription && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Competency Weights</CardTitle>
              <CardDescription>
                Distribute importance (%) across competencies for this position. Total must equal exactly 100%.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CompetencyWeights 
                competencies={suggestedCompetencies}
                weights={competencyWeights}
                onChange={(weights, valid) => {
                  setCompetencyWeights(weights);
                  setWeightsValid(valid);
                }}
              />
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              {!weightsValid && (
                <Alert variant="destructive" className="w-full">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Invalid weights</AlertTitle>
                  <AlertDescription>
                    Competency weights must add up to exactly 100% before saving.
                  </AlertDescription>
                </Alert>
              )}
              <Button 
                className="w-full" 
                disabled={!generatedDescription || !weightsValid || isSaving} 
                onClick={handleSavePosition}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving Position...
                  </>
                ) : (
                  'Save Position with Competencies'
                )}
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CreatePosition;
