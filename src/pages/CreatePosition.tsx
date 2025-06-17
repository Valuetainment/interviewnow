import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Loader2, AlertCircle } from 'lucide-react';
import { toast } from "sonner";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { CompetencyWeights } from '@/components/CompetencyWeights';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import CompanySelect from '@/components/companies/CompanySelect';
import { useAuth } from '@/hooks/useAuth';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

// Define the schema for form validation
const formSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  shortDescription: z.string().min(10, 'Description must be at least 10 characters'),
  experienceLevel: z.enum(['entry-level', 'mid-level', 'senior', 'lead']),
  companyId: z.string().optional(),
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
  const [activeTab, setActiveTab] = useState('details');
  const [generatedData, setGeneratedData] = useState<any>(null);
  const [suggestedCompetencies, setSuggestedCompetencies] = useState<Competency[]>([
    { id: 'comp-1', name: 'Technical Knowledge', description: 'Depth of technical skills and expertise related to the role', suggested_weight: 0 },
    { id: 'comp-2', name: 'Problem Solving', description: 'Ability to identify, analyze, and solve complex problems', suggested_weight: 0 },
    { id: 'comp-3', name: 'Communication Skills', description: 'Ability to communicate effectively both written and verbally', suggested_weight: 0 },
    { id: 'comp-4', name: 'Teamwork', description: 'Ability to collaborate effectively with others', suggested_weight: 0 },
    { id: 'comp-5', name: 'Leadership', description: 'Ability to guide and influence others', suggested_weight: 0 },
    { id: 'comp-6', name: 'Adaptability', description: 'Ability to adjust to new conditions and requirements', suggested_weight: 0 },
    { id: 'comp-7', name: 'Attention to Detail', description: 'Thoroughness in accomplishing tasks with high accuracy', suggested_weight: 0 },
    { id: 'comp-8', name: 'Initiative', description: 'Self-motivated drive to identify and address issues proactively', suggested_weight: 0 },
    { id: 'comp-9', name: 'Creativity', description: 'Ability to generate innovative solutions and ideas', suggested_weight: 0 },
    { id: 'comp-10', name: 'Project Management', description: 'Skill in planning, executing, and closing projects effectively', suggested_weight: 0 },
  ]);
  const [competencyWeights, setCompetencyWeights] = useState<Record<string, number>>({});
  const [weightsValid, setWeightsValid] = useState(false);
  const [exactlyFiveSelected, setExactlyFiveSelected] = useState(false);
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      shortDescription: '',
      experienceLevel: 'mid-level',
      companyId: '',
    },
  });

  // Check if exactly 5 competencies are selected
  useEffect(() => {
    const selectedCompetencies = Object.entries(competencyWeights).filter(([_, weight]) => weight > 0);
    setExactlyFiveSelected(selectedCompetencies.length === 5);
  }, [competencyWeights]);

  const onSubmit = async (data: FormData) => {
    if (!tenantId) {
      toast.error("You must be logged in to create a position");
      return;
    }

    // Validate that weights add up to 100%
    if (!weightsValid) {
      toast.error("Competency weights must add up to 100% before generating position");
      return;
    }

    // Validate that exactly 5 competencies are selected
    if (!exactlyFiveSelected) {
      toast.error("Please select exactly 5 competencies for this position");
      return;
    }

    setIsGenerating(true);
    try {
      // Call the Supabase Edge Function with competencies included
      const selectedCompetencies = Object.entries(competencyWeights)
        .filter(([_, weight]) => weight > 0)
        .map(([id, weight]) => {
          const comp = suggestedCompetencies.find(c => c.id === id);
          return {
            name: comp?.name || '',
            description: comp?.description || '',
            suggested_weight: weight
          };
        });

      const { data: genData, error } = await supabase.functions.invoke('generate-position', {
        body: { 
          title: data.title, 
          shortDescription: data.shortDescription,
          experienceLevel: data.experienceLevel,
          competencies: selectedCompetencies
        }
      });
      
      if (error) throw error;

      if (!genData) {
        throw new Error("Failed to generate position description");
      }
      
      // Set the generated data
      setGeneratedData(genData);
      
      // Switch to the description tab
      setActiveTab('description');
      
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

    // Validate that exactly 5 competencies are selected
    if (!exactlyFiveSelected) {
      toast.error("Please select exactly 5 competencies for this position");
      return;
    }

    const { title, shortDescription, experienceLevel, companyId } = form.getValues();
    
    if (!generatedData) {
      toast.error("Please generate a position description first");
      return;
    }
    
    // DEBUG: Check JWT and session
    try {
      const { data: session } = await supabase.auth.getSession();
      console.log("Current session:", session);
      console.log("JWT claims:", session?.session?.access_token);
      console.log("Tenant ID used for insert:", tenantId);
    } catch (sessionError) {
      console.error("Error fetching session:", sessionError);
    }
    
    setIsSaving(true);
    try {
      console.log("Starting position save with:", { 
        tenantId, 
        title, 
        description: generatedData.description?.substring(0, 20) + "...",
        companyId 
      });
      
      // 1. Create the position with enhanced fields
      // @ts-ignore - Database type definition might not include all fields
      const { data: position, error: positionError } = await supabase
        .from('positions')
        .insert({
          tenant_id: tenantId,
          title: title,
          description: generatedData.description,
          role_overview: generatedData.role_overview,
          key_responsibilities: generatedData.key_responsibilities,
          required_qualifications: generatedData.required_qualifications, 
          preferred_qualifications: generatedData.preferred_qualifications,
          benefits: generatedData.benefits,
          key_competencies_section: generatedData.key_competencies_section,
          experience_level: experienceLevel,
          company_id: companyId || null,
        })
        .select('id')
        .single();
        
      console.log("Position insert result:", { position, error: positionError });
      
      if (positionError) throw positionError;
      
      if (!position || !position.id) {
        throw new Error("Failed to create position");
      }
      
      // 2. Create the competencies and associate them with the position
      const competencyPromises = Object.entries(competencyWeights)
        .filter(([_, weight]) => weight > 0)
        .map(async ([compId, weight]) => {
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
    <div className="container max-w-4xl py-8">
        <h1 className="text-3xl font-bold mb-6">Create New Position</h1>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="details">Position Details</TabsTrigger>
            <TabsTrigger value="description" disabled={!generatedData}>Description</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                    <CardDescription>
                      Enter the position details
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Job Title</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Senior Frontend Developer" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="experienceLevel"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Experience Level</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select level" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="entry-level">Entry Level</SelectItem>
                                <SelectItem value="mid-level">Mid Level</SelectItem>
                                <SelectItem value="senior">Senior</SelectItem>
                                <SelectItem value="lead">Lead</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="companyId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Company</FormLabel>
                            <FormControl>
                              <CompanySelect
                                value={field.value}
                                onChange={field.onChange}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
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
                  </CardContent>
                </Card>
                
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Key Competencies</CardTitle>
                    <CardDescription>
                      Select exactly 5 competencies and distribute importance (%) across them. Total must equal 100%.
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
                          Competency weights must add up to exactly 100% before generating position.
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    {!exactlyFiveSelected && (
                      <Alert variant="destructive" className="w-full">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Incorrect number of competencies</AlertTitle>
                        <AlertDescription>
                          Please select exactly 5 competencies for this position.
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardFooter>
                </Card>
                
                <Button 
                  type="submit" 
                  disabled={isGenerating || !weightsValid || !exactlyFiveSelected}
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
          </TabsContent>
          
          <TabsContent value="description">
            {generatedData ? (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Role Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none">
                      <div className="whitespace-pre-wrap">{generatedData.role_overview}</div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Key Responsibilities</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none">
                      <div className="whitespace-pre-wrap">{generatedData.key_responsibilities}</div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Required Qualifications</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none">
                      <div className="whitespace-pre-wrap">{generatedData.required_qualifications}</div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Preferred Qualifications</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none">
                      <div className="whitespace-pre-wrap">{generatedData.preferred_qualifications}</div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Benefits</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none">
                      <div className="whitespace-pre-wrap">{generatedData.benefits}</div>
                    </div>
                  </CardContent>
                </Card>
                
                <Button 
                  onClick={handleSavePosition} 
                  className="w-full"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving Position...
                    </>
                  ) : (
                    'Save Position'
                  )}
                </Button>
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center justify-center h-[300px] text-center text-muted-foreground">
                    <p>No description generated yet</p>
                    <p className="text-sm mt-2">Fill out the form and click "Generate Description"</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
    </div>
  );
};

export default CreatePosition; 