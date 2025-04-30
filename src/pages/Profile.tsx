import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { User, Mail, Upload, Save, Shield } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

// Define validation schema
const profileSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address').optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const securitySchema = z.object({
  currentPassword: z.string().min(8, 'Password must be at least 8 characters'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SecurityFormValues = z.infer<typeof securitySchema>;

const Profile: React.FC = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.user_metadata?.full_name || '',
      email: user?.email || '',
    },
  });

  const securityForm = useForm<SecurityFormValues>({
    resolver: zodResolver(securitySchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  // Load user data
  useEffect(() => {
    if (user) {
      profileForm.setValue('fullName', user.user_metadata?.full_name || '');
      profileForm.setValue('email', user.email || '');
      setAvatarUrl(user.user_metadata?.avatar_url || null);
    }
  }, [user, profileForm]);

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    const fullName = profileForm.watch('fullName');
    if (!fullName) return user?.email?.[0].toUpperCase() || 'U';
    
    const nameParts = fullName.split(' ');
    if (nameParts.length > 1) {
      return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
    }
    return nameParts[0][0].toUpperCase();
  };

  // Handle avatar upload
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      
      if (!event.target.files || event.target.files.length === 0) {
        return;
      }
      
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `avatars/${user?.id}.${fileExt}`;
      
      // Upload the file to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, file, { upsert: true });
        
      if (uploadError) {
        throw uploadError;
      }
      
      // Get the public URL
      const { data } = supabase.storage.from('profiles').getPublicUrl(filePath);
      const avatarUrl = data.publicUrl;
      
      // Update user metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: avatarUrl }
      });
      
      if (updateError) {
        throw updateError;
      }
      
      setAvatarUrl(avatarUrl);
      toast.success('Avatar uploaded successfully');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload avatar');
    } finally {
      setUploading(false);
    }
  };

  // Handle profile update
  const onProfileSubmit = async (data: ProfileFormValues) => {
    setIsLoading(true);
    setUpdateError(null);
    
    try {
      // Update user metadata
      const { error } = await supabase.auth.updateUser({
        data: { 
          full_name: data.fullName 
        }
      });
      
      if (error) {
        throw error;
      }
      
      toast.success('Profile updated successfully');
    } catch (error: any) {
      setUpdateError(error.message || 'Failed to update profile');
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle password update
  const onSecuritySubmit = async (data: SecurityFormValues) => {
    setIsLoading(true);
    setUpdateError(null);
    
    try {
      // Update user password
      const { error } = await supabase.auth.updateUser({
        password: data.newPassword
      });
      
      if (error) {
        throw error;
      }
      
      // Reset form after successful update
      securityForm.reset({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      
      toast.success('Password updated successfully');
    } catch (error: any) {
      setUpdateError(error.message || 'Failed to update password');
      toast.error('Failed to update password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container max-w-4xl py-10">
      <div className="flex flex-col space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences.
          </p>
        </div>
        
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>Profile</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span>Security</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your profile information and manage your account.
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {updateError && (
                  <Alert variant="destructive">
                    <AlertDescription>{updateError}</AlertDescription>
                  </Alert>
                )}
                
                <div className="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0 items-center">
                  <div className="relative">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={avatarUrl || undefined} />
                      <AvatarFallback className="text-xl">{getUserInitials()}</AvatarFallback>
                    </Avatar>
                    
                    <div className="absolute -bottom-2 -right-2">
                      <Label 
                        htmlFor="avatar-upload" 
                        className="cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 rounded-full p-2 shadow-sm"
                      >
                        {uploading ? (
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
                        ) : (
                          <Upload className="h-4 w-4" />
                        )}
                      </Label>
                      <Input 
                        id="avatar-upload" 
                        type="file" 
                        accept="image/*" 
                        onChange={handleAvatarUpload} 
                        className="hidden" 
                        disabled={uploading}
                      />
                    </div>
                  </div>
                  
                  <div className="flex-1 space-y-1">
                    <h3 className="font-medium">{profileForm.watch('fullName') || 'Your Name'}</h3>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Upload a new avatar (max 2MB)
                    </p>
                  </div>
                </div>
                
                <Separator />
                
                <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                    <FormField
                      control={profileForm.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input 
                                placeholder="Enter your full name" 
                                className="pl-10" 
                                {...field} 
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={profileForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input 
                                placeholder="Enter your email" 
                                className="pl-10" 
                                {...field}
                                disabled 
                              />
                            </div>
                          </FormControl>
                          <FormDescription>
                            Email cannot be changed after registration.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex justify-end">
                      <Button 
                        type="submit" 
                        disabled={isLoading || !profileForm.formState.isDirty}
                        className="gap-2"
                      >
                        {isLoading ? (
                          <>
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
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>
                  Update your password and security preferences.
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                {updateError && (
                  <Alert variant="destructive" className="mb-6">
                    <AlertDescription>{updateError}</AlertDescription>
                  </Alert>
                )}
                
                <Form {...securityForm}>
                  <form onSubmit={securityForm.handleSubmit(onSecuritySubmit)} className="space-y-6">
                    <FormField
                      control={securityForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Password</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="Enter your current password" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={securityForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="Enter your new password" 
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Password must be at least 8 characters and include uppercase, lowercase, and numbers.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={securityForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm Password</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="Confirm your new password" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex justify-end">
                      <Button 
                        type="submit" 
                        disabled={isLoading || !securityForm.formState.isDirty}
                        className="gap-2"
                      >
                        {isLoading ? (
                          <>
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
                            Updating...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4" />
                            Update Password
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile; 