import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Outlet, Navigate } from 'react-router-dom';

interface AuthLayoutProps {
  children?: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  const { user, isLoading } = useAuth();

  // If user is already authenticated, redirect to dashboard
  if (!isLoading && user) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-md">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold">AI Interview Insights</h1>
          <p className="text-gray-600">Transform your hiring process</p>
        </div>
        
        {children || <Outlet />}
      </div>
    </div>
  );
};

export default AuthLayout; 