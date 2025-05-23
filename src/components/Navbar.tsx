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
                          location.pathname.startsWith('/company') ||
                          location.pathname.startsWith('/sessions') ||
                          location.pathname.startsWith('/reports');
  
  if (isDashboardRoute) {
    return null; // Don't render the navbar on dashboard routes
  }

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <Link to="/" className="mr-6 flex items-center space-x-2">
            <span className="hidden font-bold sm:inline-block">
              InterviewAI
            </span>
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
          <MobileNav isMenuOpen={isMenuOpen} isHomePage={isHomePage} />
        </div>
      </div>
    </header>
  );
};

export default Navbar;
