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
                          location.pathname.startsWith('/sessions') ||
                          location.pathname.startsWith('/company');
  
  if (isDashboardRoute) {
    return null;
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
          {!isHomePage && (
            <nav className="flex items-center space-x-6 text-sm font-medium">
              <Link
                to="/"
                className="transition-colors hover:text-foreground/80"
              >
                Home
              </Link>
              <Link
                to="/about"
                className="transition-colors hover:text-foreground/80"
              >
                About
              </Link>
              <Link
                to="/pricing"
                className="transition-colors hover:text-foreground/80"
              >
                Pricing
              </Link>
              <Link
                to="/contact"
                className="transition-colors hover:text-foreground/80"
              >
                Contact
              </Link>
            </nav>
          )}
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:grow-0">
            <div className="md:hidden">
              <Button
                variant="ghost"
                className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
              <MobileNav isMenuOpen={isMenuOpen} isHomePage={isHomePage} />
            </div>
          </div>
          <AuthButtons />
        </div>
      </div>
    </header>
  );
};

export default Navbar;
