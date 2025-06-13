import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Outlet, Navigate } from 'react-router-dom';
import Footer from '../footer/Footer';

// Import the new components
import DashboardSidebar from '../dashboard/Sidebar';
import DashboardHeader from '../dashboard/DashboardHeader';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';

interface DashboardLayoutProps {
  children?: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { user, isLoading } = useAuth();

  // Add a global error suppressor for the lovable-tagger error
  // This must be before any conditional returns to follow Rules of Hooks
  React.useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      if (event.error?.message?.includes('Cannot read properties of undefined') && 
          event.error?.message?.includes("reading 'add'")) {
        console.warn('Suppressing .add() error in DashboardLayout');
        event.preventDefault();
        event.stopPropagation();
      }
    };

    window.addEventListener('error', handleError, true);
    return () => window.removeEventListener('error', handleError, true);
  }, []);

  // If not authenticated, redirect to login
  if (!isLoading && !user) {
    return <Navigate to="/login" />;
  }

  // Show loading indicator while checking auth status
  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-svh">
        {/* Dashboard Sidebar */}
        <DashboardSidebar />
        
        {/* Main Content Area */}
        <SidebarInset>
          <div className="flex flex-col h-full">
            {/* Dashboard Header */}
            <DashboardHeader />
            
            {/* Main Content */}
            <div className="flex-grow p-6">
              {children || <Outlet />}
            </div>
            
            {/* Footer */}
            <Footer />
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout; 