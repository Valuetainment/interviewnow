import React from "react";
import { NavLink } from "react-router-dom";
import {
  Building2,
  Users,
  Briefcase,
  Calendar,
  FileText,
  CreditCard,
  Mail,
  LayoutDashboard,
  Building,
  UserCheck,
  LogOut,
  Settings,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { title: "Dashboard", href: "/system-admin", icon: LayoutDashboard },
  { title: "Tenants", href: "/system-admin/tenants", icon: Building2 },
  { title: "Users", href: "/system-admin/users", icon: Users },
  { title: "Companies", href: "/system-admin/companies", icon: Building },
  { title: "Positions", href: "/system-admin/positions", icon: Briefcase },
  { title: "Candidates", href: "/system-admin/candidates", icon: UserCheck },
  { title: "Sessions", href: "/system-admin/sessions", icon: Calendar },
  { title: "Transcripts", href: "/system-admin/transcripts", icon: FileText },
  { title: "Billing", href: "/system-admin/billing", icon: CreditCard },
  { title: "Invitations", href: "/system-admin/invitations", icon: Mail },
  { title: "Settings", href: "/system-admin/settings", icon: Settings },
];

export const SystemAdminSidebar: React.FC = () => {
  const { signOut } = useAuth();

  return (
    <div className="w-64 bg-slate-900 text-white flex flex-col">
      <div className="p-6">
        <h2 className="text-2xl font-bold">System Admin</h2>
        <p className="text-sm text-slate-400 mt-1">
          InterviewNow Control Panel
        </p>
      </div>

      <nav className="flex-1 px-4 pb-4">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.href}>
              <NavLink
                to={item.href}
                end={item.href === "/system-admin"}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                    "hover:bg-slate-800",
                    isActive ? "bg-slate-800 text-white" : "text-slate-300"
                  )
                }
              >
                <item.icon className="h-5 w-5" />
                <span>{item.title}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button
          onClick={() => signOut()}
          className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-slate-800 text-slate-300 w-full"
        >
          <LogOut className="h-5 w-5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};
