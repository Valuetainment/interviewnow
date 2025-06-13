import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FileText,
  Building,
  Video,
  Settings,
  BriefcaseBusiness,
  Search,
  BarChart,
  TestTube,
  Beaker,
  Mic
} from 'lucide-react';

import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarSeparator,
  SidebarGroup,
  SidebarGroupLabel,
} from '@/components/ui/sidebar';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const DashboardSidebar: React.FC = () => {
  const location = useLocation();
  
  // Helper to check if a path is active
  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center px-2">
          <Link to="/" className="flex items-center gap-2">
            <div className="rounded-md bg-primary p-1">
              <div className="h-6 w-6 text-primary-foreground">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 4L4 8L12 12L20 8L12 4Z" />
                  <path d="M4 12L12 16L20 12" />
                  <path d="M4 16L12 20L20 16" />
                </svg>
              </div>
            </div>
            <div className="font-semibold">InterviewAI</div>
          </Link>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <Link to="/dashboard">
              <SidebarMenuButton 
                asChild
                isActive={isActive('/dashboard')}
                tooltip="Dashboard"
              >
                <div className="flex items-center gap-2">
                  <LayoutDashboard />
                  <span>Dashboard</span>
                </div>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <Link to="/sessions">
              <SidebarMenuButton 
                asChild
                isActive={isActive('/sessions')}
                tooltip="Interview Sessions"
              >
                <div className="flex items-center gap-2">
                  <Video />
                  <span>Sessions</span>
                </div>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <Link to="/candidates">
              <SidebarMenuButton 
                asChild
                isActive={isActive('/candidates')}
                tooltip="Candidates"
              >
                <div className="flex items-center gap-2">
                  <Users />
                  <span>Candidates</span>
                </div>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <Link to="/positions">
              <SidebarMenuButton 
                asChild
                isActive={isActive('/positions')}
                tooltip="Positions"
              >
                <div className="flex items-center gap-2">
                  <BriefcaseBusiness />
                  <span>Positions</span>
                </div>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <Link to="/companies">
              <SidebarMenuButton 
                asChild
                isActive={isActive('/companies')}
                tooltip="Companies"
              >
                <div className="flex items-center gap-2">
                  <Building />
                  <span>Companies</span>
                </div>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <Link to="/settings">
              <SidebarMenuButton 
                asChild
                isActive={isActive('/settings')}
                tooltip="Settings"
              >
                <div className="flex items-center gap-2">
                  <Settings />
                  <span>Settings</span>
                </div>
              </SidebarMenuButton>
            </Link>
            
            {isActive('/settings') && (
              <SidebarMenuSub>
                <SidebarMenuSubItem>
                  <Link to="/settings/profile">
                    <SidebarMenuSubButton 
                      asChild
                      isActive={isActive('/settings/profile')}
                    >
                      <div>Profile</div>
                    </SidebarMenuSubButton>
                  </Link>
                </SidebarMenuSubItem>
                <SidebarMenuSubItem>
                  <Link to="/settings/organization">
                    <SidebarMenuSubButton 
                      asChild
                      isActive={isActive('/settings/organization')}
                    >
                      <div>Organization</div>
                    </SidebarMenuSubButton>
                  </Link>
                </SidebarMenuSubItem>
                <SidebarMenuSubItem>
                  <Link to="/settings/users">
                    <SidebarMenuSubButton 
                      asChild
                      isActive={isActive('/settings/users')}
                    >
                      <div>Users</div>
                    </SidebarMenuSubButton>
                  </Link>
                </SidebarMenuSubItem>
                <SidebarMenuSubItem>
                  <Link to="/settings/billing">
                    <SidebarMenuSubButton 
                      asChild
                      isActive={isActive('/settings/billing')}
                    >
                      <div>Billing</div>
                    </SidebarMenuSubButton>
                  </Link>
                </SidebarMenuSubItem>
              </SidebarMenuSub>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter>
        <div className="flex flex-col gap-2 px-2">
          <Button variant="outline" size="sm" className="justify-start gap-2">
            <Search className="h-4 w-4" />
            <span className="truncate">Search...</span>
            <kbd className="pointer-events-none ml-auto inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              <span className="text-xs">⌘</span>K
            </kbd>
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default DashboardSidebar; 