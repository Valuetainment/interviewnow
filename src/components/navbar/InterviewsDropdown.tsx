
import React from 'react';
import { Link } from 'react-router-dom';
import { UserCheck, FileText } from 'lucide-react';
import {
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

interface InterviewsDropdownProps {
  isHomePage: boolean;
}

export const InterviewsDropdown: React.FC<InterviewsDropdownProps> = ({ isHomePage }) => {
  if (isHomePage) return null;
  
  return (
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
  );
};
