import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { AuthButtons } from './navbar/AuthButtons';
import MobileNav from './navbar/MobileNav';

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  
  // Don't display the navbar in dashboard routes to avoid navigation redundancy
  const isDashboardRoute = location.pathname.startsWith('/dashboard') || 
                          location.pathname.startsWith('/candidates') ||
                          location.pathname.startsWith('/positions') ||
                          location.pathname.startsWith('/companies') ||
                          location.pathname.startsWith('/sessions') ||
                          location.pathname.startsWith('/reports');
  
  if (isDashboardRoute) {
    return null; // Don't render the navbar on dashboard routes
  }

  return (
    <nav className="fixed w-full z-50 bg-background/80 backdrop-blur-sm border-b">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              InterviewAI
            </Link>
          </div>

          {/* Desktop Navigation - Only for public pages */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Auth buttons */}
            <AuthButtons />
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <MobileNav isMenuOpen={isMenuOpen} isHomePage={isHomePage} />
      </div>
    </nav>
  );
};

export default Navbar;
