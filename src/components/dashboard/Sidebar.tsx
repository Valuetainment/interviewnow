import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  FileText,
  Building,
  Video,
  Settings,
  BriefcaseBusiness,
  BarChart,
  TestTube,
  Beaker,
  Mic,
} from "lucide-react";

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
} from "@/components/ui/sidebar";

import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const DashboardSidebar: React.FC = () => {
  const location = useLocation();
  const { isTenantInterviewer } = useAuth();

  // Helper to check if a path is active
  const isActive = (path: string) => {
    return (
      location.pathname === path || location.pathname.startsWith(`${path}/`)
    );
  };

  return (
    <Sidebar>
      <SidebarHeader className="h-14 p-0">
        <div className="flex h-full items-center px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="rounded-md bg-primary p-1.5">
              <div className="h-5 w-5 text-primary-foreground">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 4L4 8L12 12L20 8L12 4Z" />
                  <path d="M4 12L12 16L20 12" />
                  <path d="M4 16L12 20L20 16" />
                </svg>
              </div>
            </div>
            <div className="font-semibold text-lg">InterviewAI</div>
          </Link>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu className="px-2 py-2">
          <SidebarMenuItem>
            <Link to="/dashboard">
              <SidebarMenuButton
                isActive={isActive("/dashboard")}
                tooltip="Dashboard"
                className="w-full"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>Dashboard</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <Link to="/sessions">
              <SidebarMenuButton
                isActive={isActive("/sessions")}
                tooltip="Interview Sessions"
                className="w-full"
              >
                <Video className="h-4 w-4" />
                <span>Sessions</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <Link to="/transcripts">
              <SidebarMenuButton
                isActive={isActive("/transcripts")}
                tooltip="Interview Transcripts"
                className="w-full"
              >
                <FileText className="h-4 w-4" />
                <span>Transcripts</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <Link to="/candidates">
              <SidebarMenuButton
                isActive={isActive("/candidates")}
                tooltip="Candidates"
                className="w-full"
              >
                <Users className="h-4 w-4" />
                <span>Candidates</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <Link to="/positions">
              <SidebarMenuButton
                isActive={isActive("/positions")}
                tooltip="Positions"
                className="w-full"
              >
                <BriefcaseBusiness className="h-4 w-4" />
                <span>Positions</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <Link to="/companies">
              <SidebarMenuButton
                isActive={isActive("/companies")}
                tooltip="Companies"
                className="w-full"
              >
                <Building className="h-4 w-4" />
                <span>Companies</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>

          {/* Only show Settings for non-interviewer users */}
          {!isTenantInterviewer && (
            <SidebarMenuItem>
              <Link to="/settings">
                <SidebarMenuButton
                  isActive={isActive("/settings")}
                  tooltip="Settings"
                  className="w-full"
                >
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-4">
        {/* Search button removed */}
      </SidebarFooter>
    </Sidebar>
  );
};

export default DashboardSidebar;
