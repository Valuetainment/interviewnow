
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface MobileNavProps {
  isMenuOpen: boolean;
  isHomePage: boolean;
}

export const MobileNav: React.FC<MobileNavProps> = ({ isMenuOpen, isHomePage }) => {
  if (!isMenuOpen) return null;
  
  return (
    <div className="md:hidden">
      <div className="px-2 pt-2 pb-4 space-y-3 flex flex-col">
        <div className="border-b pb-2">
          <div className="font-medium px-3 py-2">About</div>
          <Link to="/#features" className="block px-3 py-2 rounded-md text-base text-foreground/80 hover:text-foreground hover:bg-muted transition-colors">
            Features
          </Link>
          <Link to="/#how-it-works" className="block px-3 py-2 rounded-md text-base text-foreground/80 hover:text-foreground hover:bg-muted transition-colors">
            How it Works
          </Link>
          <Link to="/#pricing" className="block px-3 py-2 rounded-md text-base text-foreground/80 hover:text-foreground hover:bg-muted transition-colors">
            Pricing
          </Link>
        </div>

        {/* Admin navigation items - only show when not on homepage */}
        {!isHomePage && (
          <>
            <Link to="/dashboard" className="block px-3 py-2 rounded-md text-base text-foreground/80 hover:text-foreground hover:bg-muted transition-colors">
              Dashboard
            </Link>
            
            <div className="border-b pb-2">
              <div className="font-medium px-3 py-2">Companies</div>
              <Link to="/companies" className="block px-3 py-2 rounded-md text-base text-foreground/80 hover:text-foreground hover:bg-muted transition-colors">
                All Companies
              </Link>
              <Link to="/companies/new" className="block px-3 py-2 rounded-md text-base text-foreground/80 hover:text-foreground hover:bg-muted transition-colors">
                Add Company
              </Link>
            </div>

            <div className="border-b pb-2">
              <div className="font-medium px-3 py-2">Recruiting</div>
              <Link to="/positions" className="block px-3 py-2 rounded-md text-base text-foreground/80 hover:text-foreground hover:bg-muted transition-colors">
                All Positions
              </Link>
              <Link to="/create-position" className="block px-3 py-2 rounded-md text-base text-foreground/80 hover:text-foreground hover:bg-muted transition-colors">
                Create Position
              </Link>
              <Link to="/candidate" className="block px-3 py-2 rounded-md text-base text-foreground/80 hover:text-foreground hover:bg-muted transition-colors">
                All Candidates
              </Link>
              <Link to="/candidate" className="block px-3 py-2 rounded-md text-base text-foreground/80 hover:text-foreground hover:bg-muted transition-colors">
                Add Candidate
              </Link>
            </div>

            <div className="border-b pb-2">
              <div className="font-medium px-3 py-2">Interviews</div>
              <Link to="/test-interview" className="block px-3 py-2 rounded-md text-base text-foreground/80 hover:text-foreground hover:bg-muted transition-colors">
                Test Interview
              </Link>
              <Link to="/transcripts" className="block px-3 py-2 rounded-md text-base text-foreground/80 hover:text-foreground hover:bg-muted transition-colors">
                Transcripts
              </Link>
            </div>
            
            <Link to="/settings" className="block px-3 py-2 rounded-md text-base text-foreground/80 hover:text-foreground hover:bg-muted transition-colors">
              Settings
            </Link>
          </>
        )}
        
        <div className="pt-2 space-y-2">
          <Link to="/login" className="w-full block">
            <Button variant="outline" className="w-full">Log in</Button>
          </Link>
          <Link to="/signup" className="w-full block">
            <Button className="w-full">Get Started</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
