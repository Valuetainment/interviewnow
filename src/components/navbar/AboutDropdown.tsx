
import React from 'react';
import { Link } from 'react-router-dom';
import {
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

export const AboutDropdown: React.FC = () => {
  return (
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
  );
};
