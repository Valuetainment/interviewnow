import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';

// Define the validation schema
const resetPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

const ResetPassword: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { resetPassword } = useAuth();

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ResetPasswordFormValues) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await resetPassword(data.email);
      setIsSuccess(true);
      toast.success('Password reset instructions sent to your email');
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to send reset instructions. Please try again.';
      
      setError(errorMessage);
      toast.error('Failed to send reset instructions');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background/60 to-background flex flex-col justify-center">
      <div className="container mx-auto px-4 py-16 flex flex-col items-center">
        <Link to="/" className="mb-8">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            InterviewAI
          </h2>
        </Link>
        
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Reset your password</CardTitle>
            <CardDescription>
              Enter your email address and we'll send you instructions to reset your password.
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {isSuccess ? (
              <div className="space-y-4">
                <Alert className="border-green-500 text-green-500">
                  <AlertDescription>
                    We've sent reset instructions to your email address. Please check your inbox.
                  </AlertDescription>
                </Alert>
                <p className="text-sm text-muted-foreground">
                  If you don't receive an email within a few minutes, please check your spam folder or try again.
                </p>
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input 
                              type="email" 
                              placeholder="Enter your email" 
                              className="pl-10" 
                              {...field} 
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle 
                            className="opacity-25" 
                            cx="12" cy="12" r="10" 
                            stroke="currentColor" 
                            strokeWidth="4"
                            fill="none"
                          />
                          <path 
                            className="opacity-75" 
                            fill="currentColor" 
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Sending instructions...
                      </span>
                    ) : (
                      <span>Send reset instructions</span>
                    )}
                  </Button>
                </form>
              </Form>
            )}
          </CardContent>
          
          <CardFooter>
            <div className="w-full flex justify-center">
              <Link 
                to="/login" 
                className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1"
              >
                <ArrowLeft className="h-3 w-3" />
                Back to login
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword; 