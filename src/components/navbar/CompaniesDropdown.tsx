import React from "react";
import { Link } from "react-router-dom";
import { Building, Plus } from "lucide-react";
import {
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { useAuth } from "@/hooks/useAuth";

interface CompaniesDropdownProps {
  isHomePage: boolean;
}

export const CompaniesDropdown: React.FC<CompaniesDropdownProps> = ({
  isHomePage,
}) => {
  const { isTenantAdmin, isSystemAdmin } = useAuth();

  if (isHomePage) return null;

  return (
    <NavigationMenuItem>
      <NavigationMenuTrigger>Companies</NavigationMenuTrigger>
      <NavigationMenuContent className="bg-background">
        <ul className="grid gap-3 p-4 w-[300px]">
          <li>
            <Link
              to="/companies"
              className="block p-3 rounded-md hover:bg-muted"
            >
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                <span className="text-sm font-medium">All Companies</span>
              </div>
              <div className="text-sm text-muted-foreground ml-6">
                View and manage companies
              </div>
            </Link>
          </li>
          {(isTenantAdmin || isSystemAdmin) && (
            <li>
              <Link
                to="/companies/new"
                className="block p-3 rounded-md hover:bg-muted"
              >
                <div className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  <span className="text-sm font-medium">Add Company</span>
                </div>
                <div className="text-sm text-muted-foreground ml-6">
                  Create a new company profile
                </div>
              </Link>
            </li>
          )}
        </ul>
      </NavigationMenuContent>
    </NavigationMenuItem>
  );
};
