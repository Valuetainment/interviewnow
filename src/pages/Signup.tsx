
import React from 'react';
import { Link } from 'react-router-dom';
import { AuthForm } from '@/components/AuthForm';

const Signup: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background/60 to-background flex flex-col justify-center">
      <div className="container mx-auto px-4 py-16 flex flex-col items-center">
        <Link to="/" className="mb-8">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            InterviewAI
          </h2>
        </Link>
        
        <div className="w-full max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold">Create an account</h1>
            <p className="text-muted-foreground mt-2">
              Get started with InterviewAI today
            </p>
          </div>
          
          <AuthForm mode="signup" />
          
          <div className="text-center mt-6">
            <p className="text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
