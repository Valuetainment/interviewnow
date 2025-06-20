import React, { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Activity,
  Calendar,
  ChevronRight,
  LayoutDashboard,
  Mail,
  Plus,
  PlusCircle,
  UserPlus,
  Users,
  FileText,
  BriefcaseBusiness,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardInterviews from "@/components/dashboard/DashboardInterviews";
import DashboardInvitations from "@/components/dashboard/DashboardInvitations";
import DashboardStatistics from "@/components/dashboard/DashboardStatistics";
import DashboardOverview from "@/components/dashboard/DashboardOverview";

const RecentActivityItem = ({
  icon,
  title,
  description,
  time,
  status,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  time: string;
  status?: "success" | "pending" | "failed";
}) => (
  <div className="flex items-start space-x-4 py-3">
    <div className="rounded-full bg-muted p-2">{icon}</div>
    <div className="flex-1 space-y-1">
      <p className="text-sm font-medium">{title}</p>
      <p className="text-sm text-muted-foreground">{description}</p>
      <div className="flex items-center pt-1">
        <Clock className="mr-1 h-3 w-3 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">{time}</span>
        {status && (
          <div className="ml-2 flex items-center">
            {status === "success" && (
              <CheckCircle2 className="mr-1 h-3 w-3 text-green-500" />
            )}
            {status === "pending" && (
              <Clock className="mr-1 h-3 w-3 text-yellow-500" />
            )}
            {status === "failed" && (
              <XCircle className="mr-1 h-3 w-3 text-red-500" />
            )}
            <span
              className={`text-xs ${
                status === "success"
                  ? "text-green-500"
                  : status === "pending"
                  ? "text-yellow-500"
                  : "text-red-500"
              }`}
            >
              {status === "success"
                ? "Completed"
                : status === "pending"
                ? "Pending"
                : "Failed"}
            </span>
          </div>
        )}
      </div>
    </div>
  </div>
);

const QuickStatCard = ({
  icon,
  title,
  value,
  description,
  trend,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  description: string;
  trend?: {
    value: string;
    up?: boolean;
  };
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">
        {title}
      </CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className="flex items-baseline justify-between">
        <div className="text-3xl font-bold">{value}</div>
        {trend && (
          <div
            className={`ml-2 text-xs ${
              trend.up ? "text-green-500" : "text-red-500"
            }`}
          >
            {trend.up ? "↑" : "↓"} {trend.value}
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground mt-1">{description}</p>
    </CardContent>
  </Card>
);

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { role, tenantId, isTenantAdmin, isSystemAdmin } = useAuth();

  // Tab states - Initialize from URL hash or default to "overview"
  const getInitialTab = () => {
    const hash = location.hash.replace("#", "");
    const validTabs = ["overview", "interviews", "invitations", "statistics"];
    return validTabs.includes(hash) ? hash : "overview";
  };

  const [activeTab, setActiveTab] = useState(getInitialTab());
  const [checkingCompanies, setCheckingCompanies] = useState(true);

  // Update URL hash when tab changes
  useEffect(() => {
    navigate(`#${activeTab}`, { replace: true });
  }, [activeTab, navigate]);

  // Check if we're coming from onboarding with state data
  const fromOnboarding = location.state?.fromOnboarding;
  const onboardingRole = location.state?.role;
  const onboardingTenantId = location.state?.tenantId;

  // Use onboarding data if available, otherwise use auth context
  const effectiveRole = fromOnboarding ? onboardingRole : role;
  const effectiveTenantId = fromOnboarding ? onboardingTenantId : tenantId;

  console.log("Dashboard state:", {
    fromOnboarding,
    onboardingRole,
    onboardingTenantId,
    authRole: role,
    authTenantId: tenantId,
    effectiveRole,
    effectiveTenantId,
  });

  useEffect(() => {
    console.log(
      "Dashboard mounted - Role:",
      effectiveRole,
      "TenantId:",
      effectiveTenantId
    );

    // Clear location state after using it
    if (fromOnboarding) {
      window.history.replaceState({}, document.title);
    }

    // Wait for auth to be ready before checking companies
    const checkAuth = async () => {
      // If we have role/tenantId from onboarding or auth context, proceed
      if (effectiveRole !== null && effectiveTenantId !== null) {
        await checkForCompanies();
        return;
      }

      // If we don't have role/tenantId yet, the auth context is still loading
      // This prevents the 406 error when the user record doesn't exist yet
      if (role === null && tenantId === null) {
        // Check if we have a session at all
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          // No session, user will be redirected by auth guard
          setCheckingCompanies(false);
          return;
        }

        // We have a session but no role/tenantId yet, wait a bit
        console.log("Waiting for auth context to load role/tenantId...");
        setTimeout(() => {
          // Re-trigger the effect by changing a dependency
          // Since role/tenantId will eventually be set by useAuth, this effect will re-run
        }, 100);
        return;
      }

      // Now we have role/tenantId from auth context, safe to check companies
      await checkForCompanies();
    };

    checkAuth();
  }, [navigate, role, tenantId, effectiveRole, effectiveTenantId]);

  const checkForCompanies = async () => {
    try {
      // Use effective role/tenantId instead of querying again
      console.log(
        "Checking companies with role:",
        effectiveRole,
        "tenantId:",
        effectiveTenantId
      );

      // System admins don't need companies
      if (effectiveRole === "system_admin") {
        console.log("User is system admin, skipping company check");
        setCheckingCompanies(false);
        return;
      }

      // For tenant interviewers, they can't create companies
      if (effectiveRole === "tenant_interviewer") {
        console.log("User is interviewer, they cannot create companies");
        // Don't redirect interviewers to company setup
        setCheckingCompanies(false);
        return;
      }

      // For tenant admins, check if the tenant has any companies
      let query = supabase.from("companies").select("id");

      // Filter by tenant_id if user has one
      if (effectiveTenantId) {
        query = query.eq("tenant_id", effectiveTenantId);
      }

      const { data: companies, error } = await query.limit(1);

      console.log("Company check result:", {
        companies,
        error,
        tenant_id: effectiveTenantId,
      });

      if (error) {
        console.error("Error checking companies:", error);
        setCheckingCompanies(false);
        return;
      }

      if (!companies || companies.length === 0) {
        // Only redirect tenant admins to company setup
        if (effectiveRole === "tenant_admin") {
          console.log(
            "No companies found for tenant admin, redirecting to setup wizard..."
          );
          setCheckingCompanies(false);
          navigate("/company-setup", { replace: true });
        } else {
          setCheckingCompanies(false);
        }
      } else {
        // User has companies, continue with dashboard
        console.log("Companies found:", companies);
        setCheckingCompanies(false);
      }
    } catch (error) {
      console.error("Error checking companies:", error);
      setCheckingCompanies(false);
    }
  };

  // Show loading spinner while checking for companies
  if (checkingCompanies) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  // Mock data for recent activities
  const recentActivities = [
    {
      icon: <Users className="h-4 w-4" />,
      title: "Ben Pappas completed the Cursor AI Engineer interview",
      description: "The assessment has been generated with a score of 8.5/10",
      time: "2 hours ago",
      status: "success" as const,
    },
    {
      icon: <Mail className="h-4 w-4" />,
      title: "Interview invitation sent to Sarah Johnson",
      description: "For the position of Frontend Engineer",
      time: "Yesterday",
      status: "pending" as const,
    },
    {
      icon: <BriefcaseBusiness className="h-4 w-4" />,
      title: "New position created: Digital Marketing Media Buyer",
      description: "With 7 competencies defined",
      time: "2 days ago",
    },
    {
      icon: <FileText className="h-4 w-4" />,
      title: "Resume uploaded for Alex Wong",
      description: "For the Backend Node Engineer position",
      time: "3 days ago",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        {(isTenantAdmin || isSystemAdmin) && (
          <div className="flex items-center space-x-2">
            <Button onClick={() => navigate("/companies/new")}>
              <Plus className="mr-2 h-4 w-4" />
              New Company
            </Button>
          </div>
        )}
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="bg-muted/40 w-full justify-start border-b pb-px mb-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="interviews" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>Interviews</span>
          </TabsTrigger>
          <TabsTrigger value="invitations" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            <span>Invitations</span>
          </TabsTrigger>
          <TabsTrigger value="statistics" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            <span>Statistics</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <DashboardOverview
            onNavigateToStatistics={() => setActiveTab("statistics")}
          />
        </TabsContent>

        <TabsContent value="interviews">
          <DashboardInterviews />
        </TabsContent>

        <TabsContent value="invitations">
          <DashboardInvitations />
        </TabsContent>

        <TabsContent value="statistics">
          <DashboardStatistics />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
