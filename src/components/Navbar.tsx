
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import {
  NavigationMenu,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";

// Import our newly created components
import { AboutDropdown } from './navbar/AboutDropdown';
import { CompaniesDropdown } from './navbar/CompaniesDropdown';
import { RecruitingDropdown } from './navbar/RecruitingDropdown';
import { InterviewsDropdown } from './navbar/InterviewsDropdown';
import { NavigationLinks } from './navbar/NavigationLinks';
import { AuthButtons } from './navbar/AuthButtons';
import { MobileNav } from './navbar/MobileNav';

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const isHomePage = location.pathname === '/';

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

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Public pages */}
            <NavigationMenu>
              <NavigationMenuList>
                {/* About dropdown always visible */}
                <AboutDropdown />

                {/* Admin navigation - only show when not on homepage */}
                <NavigationLinks isHomePage={isHomePage} />
                <CompaniesDropdown isHomePage={isHomePage} />
                <RecruitingDropdown isHomePage={isHomePage} />
                <InterviewsDropdown isHomePage={isHomePage} />
              </NavigationMenuList>
            </NavigationMenu>
            
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
