import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Building2,
  Users,
  Briefcase,
  Calendar,
  DollarSign,
  TrendingUp,
  UserPlus,
  Activity,
  UserCheck,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

interface SystemStats {
  totalTenants: number;
  totalUsers: number;
  totalCompanies: number;
  totalSessions: number;
  totalRevenue: number;
  activeSubscriptions: number;
  pendingInvoices: number;
  totalCandidates: number;
}

export const SystemAdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<SystemStats>({
    totalTenants: 0,
    totalUsers: 0,
    totalCompanies: 0,
    totalSessions: 0,
    totalRevenue: 0,
    activeSubscriptions: 0,
    pendingInvoices: 0,
    totalCandidates: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSystemStats();
  }, []);

  const fetchSystemStats = async () => {
    try {
      // Fetch all stats in parallel
      const [
        tenantsResult,
        usersResult,
        companiesResult,
        sessionsResult,
        invoicesResult,
        candidatesResult,
      ] = await Promise.all([
        supabase.from("tenants").select("id", { count: "exact", head: true }),
        supabase.rpc("get_users_with_auth"),
        supabase.from("companies").select("id", { count: "exact", head: true }),
        supabase
          .from("interview_sessions")
          .select("id", { count: "exact", head: true }),
        supabase.from("invoices").select("amount_paid, status"),
        supabase
          .from("candidates")
          .select("id", { count: "exact", head: true }),
      ]);

      // Calculate revenue and pending invoices
      let totalRevenue = 0;
      let pendingInvoices = 0;

      if (invoicesResult.data) {
        invoicesResult.data.forEach((invoice) => {
          totalRevenue += invoice.amount_paid || 0;
          if (invoice.status === "open") {
            pendingInvoices++;
          }
        });
      }

      setStats({
        totalTenants: tenantsResult.count || 0,
        totalUsers: usersResult.data?.length || 0,
        totalCompanies: companiesResult.count || 0,
        totalSessions: sessionsResult.count || 0,
        totalRevenue: totalRevenue / 100, // Convert from cents
        activeSubscriptions: tenantsResult.count || 0, // For now, assume all tenants are active
        pendingInvoices,
        totalCandidates: candidatesResult.count || 0,
      });
    } catch (error) {
      console.error("Error fetching system stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "Total Tenants",
      value: stats.totalTenants,
      description: "Active organizations",
      icon: Building2,
      href: "/system-admin/tenants",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Total Users",
      value: stats.totalUsers,
      description: "Across all tenants",
      icon: Users,
      href: "/system-admin/users",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Total Companies",
      value: stats.totalCompanies,
      description: "Registered companies",
      icon: Briefcase,
      href: "/system-admin/companies",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Total Candidates",
      value: stats.totalCandidates,
      description: "All candidates",
      icon: UserCheck,
      href: "/system-admin/candidates",
      color: "text-cyan-600",
      bgColor: "bg-cyan-50",
    },
    {
      title: "Interview Sessions",
      value: stats.totalSessions,
      description: "Total sessions",
      icon: Calendar,
      href: "/system-admin/sessions",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      title: "Total Revenue",
      value: `$${stats.totalRevenue.toLocaleString()}`,
      description: "Lifetime revenue",
      icon: DollarSign,
      href: "/system-admin/billing",
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      title: "Active Subscriptions",
      value: stats.activeSubscriptions,
      description: "Current subscriptions",
      icon: TrendingUp,
      href: "/system-admin/billing",
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
    },
    {
      title: "Pending Invoices",
      value: stats.pendingInvoices,
      description: "Awaiting payment",
      icon: Activity,
      href: "/system-admin/billing",
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">System Overview</h1>
        <p className="text-gray-600 mt-2">
          Monitor and manage all InterviewNow resources
        </p>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Link to="/system-admin/invitations">
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Invite New Tenant
              </Button>
            </Link>
            <Link to="/system-admin/users">
              <Button variant="outline">
                <Users className="mr-2 h-4 w-4" />
                Manage Users
              </Button>
            </Link>
            <Link to="/system-admin/billing">
              <Button variant="outline">
                <DollarSign className="mr-2 h-4 w-4" />
                View Billing
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <Link key={stat.title} to={stat.href}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-gray-600 mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};
