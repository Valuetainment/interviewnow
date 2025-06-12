import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Outlet, Navigate } from 'react-router-dom';
import Footer from '../footer/Footer';
import DashboardHeader from '../dashboard/DashboardHeader';

interface DashboardLayoutProps {
  children?: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { user, isLoading } = useAuth();

  // If not authenticated, redirect to login
  if (!isLoading && !user) {
    return <Navigate to="/login" />;
  }

  // Show loading indicator while checking auth status
  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="flex h-screen">
      {/* Temporary Simple Sidebar for Debugging */}
      <div className="w-64 bg-gray-100 p-4 border-r">
        <h2 className="font-bold mb-4 text-lg">InterviewAI</h2>
        <nav className="space-y-2">
          <a href="/dashboard" className="block p-2 hover:bg-gray-200 rounded">Dashboard</a>
          <a href="/sessions" className="block p-2 hover:bg-gray-200 rounded font-semibold bg-blue-100">Sessions</a>
          <a href="/candidates" className="block p-2 hover:bg-gray-200 rounded">Candidates</a>
          <a href="/positions" className="block p-2 hover:bg-gray-200 rounded">Positions</a>
          <a href="/companies" className="block p-2 hover:bg-gray-200 rounded">Companies</a>
          <div className="my-4 border-t pt-4">
            <p className="text-sm font-semibold mb-2">Testing Tools</p>
            <a href="/test-interview" className="block p-2 hover:bg-gray-200 rounded text-sm">Test Interview</a>
          </div>
        </nav>
        <div className="mt-8 p-3 bg-yellow-100 rounded text-xs">
          <p className="font-semibold">Debug Mode</p>
          <p>Temporary sidebar to isolate .add() error</p>
        </div>
      </div>
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Keep original header */}
        <DashboardHeader />
        
        {/* Main Content */}
        <div className="flex-grow p-6 overflow-auto">
          {children || <Outlet />}
        </div>
        
        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
};

export default DashboardLayout; 