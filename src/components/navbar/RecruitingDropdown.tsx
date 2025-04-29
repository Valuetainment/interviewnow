
import React from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Plus, Users, FileUp } from 'lucide-react';
import {
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

interface RecruitingDropdownProps {
  isHomePage: boolean;
}

export const RecruitingDropdown: React.FC<RecruitingDropdownProps> = ({ isHomePage }) => {
  if (isHomePage) return null;
  
  return (
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
  );
};
