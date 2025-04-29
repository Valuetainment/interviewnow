
import React from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard, Settings } from 'lucide-react';

interface NavigationLinksProps {
  isHomePage: boolean;
}

export const NavigationLinks: React.FC<NavigationLinksProps> = ({ isHomePage }) => {
  if (isHomePage) return null;
  
  return (
    <>
      <Link to="/dashboard" className="flex items-center gap-1 text-foreground/80 hover:text-foreground transition-colors px-4 py-2">
        <LayoutDashboard size={16} />
        <span>Dashboard</span>
      </Link>
      <Link to="/settings" className="flex items-center gap-1 text-foreground/80 hover:text-foreground transition-colors px-4 py-2">
        <Settings size={16} />
        <span>Settings</span>
      </Link>
    </>
  );
};
