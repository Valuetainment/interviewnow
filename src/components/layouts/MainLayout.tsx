import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Outlet, Navigate } from 'react-router-dom';
import Navbar from '../navbar/Navbar';
import Footer from '../footer/Footer';

// Import UI components when they're created
// import Navbar from '../navbar/Navbar';
// import Footer from '../footer/Footer';

interface MainLayoutProps {
  children?: React.ReactNode;
  requireAuth?: boolean;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, requireAuth = false }) => {
  const { user, isLoading } = useAuth();

  // If authentication is required and user is not authenticated, redirect to login
  if (requireAuth && !isLoading && !user) {
    return <Navigate to="/login" />;
  }

  // Show loading indicator while checking auth status
  if (requireAuth && isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Navigation */}
      <Navbar />
      
      {/* Main content */}
      <main className="flex-grow">
        {children || <Outlet />}
      </main>
      
      {/* Footer */}
      <Footer />
    </div>
  );
};

export default MainLayout; 