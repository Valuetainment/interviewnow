
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, Plus, FileUp, Settings, UserCheck, FileText } from 'lucide-react';

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
          <div className="hidden md:flex items-center space-x-6">
            <a href="#features" className="text-foreground/80 hover:text-foreground transition-colors">Features</a>
            <a href="#how-it-works" className="text-foreground/80 hover:text-foreground transition-colors">How it Works</a>
            <a href="#pricing" className="text-foreground/80 hover:text-foreground transition-colors">Pricing</a>
            <Link to="/create-position" className="text-foreground/80 hover:text-foreground transition-colors">
              <Button variant="ghost" className="gap-2">
                <Plus size={16} />
                Create Position
              </Button>
            </Link>
            <Link to="/candidate" className="text-foreground/80 hover:text-foreground transition-colors">
              <Button variant="ghost" className="gap-2">
                <FileUp size={16} />
                Add Candidate
              </Button>
            </Link>
            <Link to="/test-interview" className="text-foreground/80 hover:text-foreground transition-colors">
              <Button variant="ghost" className="gap-2">
                <UserCheck size={16} />
                Test Interview
              </Button>
            </Link>
            <Link to="/transcripts" className="text-foreground/80 hover:text-foreground transition-colors">
              <Button variant="ghost" className="gap-2">
                <FileText size={16} />
                Transcripts
              </Button>
            </Link>
            <Link to="/settings" className="text-foreground/80 hover:text-foreground transition-colors">
              <Button variant="ghost" className="gap-2">
                <Settings size={16} />
                Settings
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" className="ml-2">Log in</Button>
            </Link>
            <Link to="/signup">
              <Button>Get Started</Button>
            </Link>
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
        <div className={`md:hidden ${isMenuOpen ? 'block' : 'hidden'}`}>
          <div className="px-2 pt-2 pb-4 space-y-3 flex flex-col">
            <a href="#features" className="block px-3 py-2 rounded-md text-base font-medium text-foreground/80 hover:text-foreground hover:bg-muted transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="block px-3 py-2 rounded-md text-base font-medium text-foreground/80 hover:text-foreground hover:bg-muted transition-colors">
              How it Works
            </a>
            <a href="#pricing" className="block px-3 py-2 rounded-md text-base font-medium text-foreground/80 hover:text-foreground hover:bg-muted transition-colors">
              Pricing
            </a>
            <Link to="/create-position" className="block px-3 py-2 rounded-md text-base font-medium text-foreground/80 hover:text-foreground hover:bg-muted transition-colors">
              Create Position
            </Link>
            <Link to="/candidate" className="block px-3 py-2 rounded-md text-base font-medium text-foreground/80 hover:text-foreground hover:bg-muted transition-colors">
              Add Candidate
            </Link>
            <Link to="/test-interview" className="block px-3 py-2 rounded-md text-base font-medium text-foreground/80 hover:text-foreground hover:bg-muted transition-colors">
              Test Interview
            </Link>
            <Link to="/transcripts" className="block px-3 py-2 rounded-md text-base font-medium text-foreground/80 hover:text-foreground hover:bg-muted transition-colors">
              Transcripts
            </Link>
            <Link to="/settings" className="block px-3 py-2 rounded-md text-base font-medium text-foreground/80 hover:text-foreground hover:bg-muted transition-colors">
              Settings
            </Link>
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
      </div>
    </nav>
  );
};

export default Navbar;
