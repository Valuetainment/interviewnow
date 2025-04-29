
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Menu, 
  Plus, 
  FileUp, 
  Settings, 
  UserCheck, 
  FileText,
  ChevronDown,
  Briefcase,
  LayoutDashboard,
  Building,
  Users
} from 'lucide-react';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

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
          <div className="hidden md:flex items-center space-x-4">
            {/* Public pages */}
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger>About</NavigationMenuTrigger>
                  <NavigationMenuContent className="bg-background">
                    <ul className="grid gap-3 p-4 w-[400px]">
                      <li>
                        <Link to="/#features" className="block p-3 rounded-md hover:bg-muted">
                          <div className="text-sm font-medium">Features</div>
                          <div className="text-sm text-muted-foreground">See what our platform offers</div>
                        </Link>
                      </li>
                      <li>
                        <Link to="/#how-it-works" className="block p-3 rounded-md hover:bg-muted">
                          <div className="text-sm font-medium">How it Works</div>
                          <div className="text-sm text-muted-foreground">Learn about our interview process</div>
                        </Link>
                      </li>
                      <li>
                        <Link to="/#pricing" className="block p-3 rounded-md hover:bg-muted">
                          <div className="text-sm font-medium">Pricing</div>
                          <div className="text-sm text-muted-foreground">View our pricing plans</div>
                        </Link>
                      </li>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                {/* Dashboard */}
                <NavigationMenuItem>
                  <Link to="/dashboard" className="flex items-center gap-1 text-foreground/80 hover:text-foreground transition-colors px-4 py-2">
                    <LayoutDashboard size={16} />
                    <span>Dashboard</span>
                  </Link>
                </NavigationMenuItem>

                {/* Company Management */}
                <NavigationMenuItem>
                  <NavigationMenuTrigger>Companies</NavigationMenuTrigger>
                  <NavigationMenuContent className="bg-background">
                    <ul className="grid gap-3 p-4 w-[300px]">
                      <li>
                        <Link to="/companies" className="block p-3 rounded-md hover:bg-muted">
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4" />
                            <span className="text-sm font-medium">All Companies</span>
                          </div>
                          <div className="text-sm text-muted-foreground ml-6">View and manage companies</div>
                        </Link>
                      </li>
                      <li>
                        <Link to="/companies/new" className="block p-3 rounded-md hover:bg-muted">
                          <div className="flex items-center gap-2">
                            <Plus className="h-4 w-4" />
                            <span className="text-sm font-medium">Add Company</span>
                          </div>
                          <div className="text-sm text-muted-foreground ml-6">Create a new company profile</div>
                        </Link>
                      </li>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                {/* Candidates & Positions */}
                <NavigationMenuItem>
                  <NavigationMenuTrigger>Recruiting</NavigationMenuTrigger>
                  <NavigationMenuContent className="bg-background">
                    <ul className="grid gap-3 p-4 md:w-[400px] lg:w-[500px] grid-cols-1 md:grid-cols-2">
                      <li className="md:col-span-2">
                        <div className="px-3 py-2 text-sm font-medium text-muted-foreground">Positions</div>
                      </li>
                      <li>
                        <Link to="/positions" className="block p-3 rounded-md hover:bg-muted">
                          <div className="flex items-center gap-2">
                            <Briefcase className="h-4 w-4" />
                            <span className="text-sm font-medium">All Positions</span>
                          </div>
                          <div className="text-sm text-muted-foreground ml-6">View job positions</div>
                        </Link>
                      </li>
                      <li>
                        <Link to="/create-position" className="block p-3 rounded-md hover:bg-muted">
                          <div className="flex items-center gap-2">
                            <Plus className="h-4 w-4" />
                            <span className="text-sm font-medium">Create Position</span>
                          </div>
                          <div className="text-sm text-muted-foreground ml-6">Add a new job position</div>
                        </Link>
                      </li>
                      <li className="md:col-span-2 mt-2">
                        <div className="px-3 py-2 text-sm font-medium text-muted-foreground">Candidates</div>
                      </li>
                      <li>
                        <Link to="/candidate" className="block p-3 rounded-md hover:bg-muted">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            <span className="text-sm font-medium">All Candidates</span>
                          </div>
                          <div className="text-sm text-muted-foreground ml-6">View candidates</div>
                        </Link>
                      </li>
                      <li>
                        <Link to="/candidate" className="block p-3 rounded-md hover:bg-muted">
                          <div className="flex items-center gap-2">
                            <FileUp className="h-4 w-4" />
                            <span className="text-sm font-medium">Add Candidate</span>
                          </div>
                          <div className="text-sm text-muted-foreground ml-6">Upload candidate profiles</div>
                        </Link>
                      </li>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                {/* Interviews */}
                <NavigationMenuItem>
                  <NavigationMenuTrigger>Interviews</NavigationMenuTrigger>
                  <NavigationMenuContent className="bg-background">
                    <ul className="grid gap-3 p-4 w-[300px]">
                      <li>
                        <Link to="/test-interview" className="block p-3 rounded-md hover:bg-muted">
                          <div className="flex items-center gap-2">
                            <UserCheck className="h-4 w-4" />
                            <span className="text-sm font-medium">Test Interview</span>
                          </div>
                          <div className="text-sm text-muted-foreground ml-6">Run test interviews with AI</div>
                        </Link>
                      </li>
                      <li>
                        <Link to="/transcripts" className="block p-3 rounded-md hover:bg-muted">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            <span className="text-sm font-medium">Transcripts</span>
                          </div>
                          <div className="text-sm text-muted-foreground ml-6">View past interviews</div>
                        </Link>
                      </li>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                {/* Settings */}
                <NavigationMenuItem>
                  <Link to="/settings" className="flex items-center gap-1 text-foreground/80 hover:text-foreground transition-colors px-4 py-2">
                    <Settings size={16} />
                    <span>Settings</span>
                  </Link>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
            
            {/* Auth buttons */}
            <div className="flex items-center space-x-2 ml-4">
              <Link to="/login">
                <Button variant="outline">Log in</Button>
              </Link>
              <Link to="/signup">
                <Button>Get Started</Button>
              </Link>
            </div>
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
