import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Building2, Edit, Trash2, Plus, Search, Users } from "lucide-react";
import { format } from "date-fns";

interface Tenant {
  id: string;
  name: string;
  plan_tier: string;
  tenancy_type: string;
  created_at: string;
  updated_at: string;
  _count?: {
    users: number;
    companies: number;
  };
}

export const TenantsManagement: React.FC = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [totals, setTotals] = useState({
    tenants: 0,
    users: 0,
    companies: 0,
  });

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    plan_tier: "free",
    tenancy_type: "enterprise",
  });

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      setLoading(true);

      // First, fetch all tenants
      const { data: tenantsData, error: tenantsError } = await supabase
        .from("tenants")
        .select("*")
        .order("created_at", { ascending: false });

      if (tenantsError) throw tenantsError;

      // Then, fetch counts for each tenant
      const tenantsWithCounts = await Promise.all(
        (tenantsData || []).map(async (tenant) => {
          // Fetch user count for this tenant
          const { count: userCount, error: userError } = await supabase
            .from("users")
            .select("*", { count: "exact", head: true })
            .eq("tenant_id", tenant.id);

          // Fetch company count for this tenant
          const { count: companyCount, error: companyError } = await supabase
            .from("companies")
            .select("*", { count: "exact", head: true })
            .eq("tenant_id", tenant.id);

          if (userError) console.error("Error fetching user count:", userError);
          if (companyError)
            console.error("Error fetching company count:", companyError);

          return {
            ...tenant,
            _count: {
              users: userCount || 0,
              companies: companyCount || 0,
            },
          };
        })
      );

      setTenants(tenantsWithCounts);

      // Calculate totals
      const totalUsers = tenantsWithCounts.reduce(
        (sum, tenant) => sum + tenant._count.users,
        0
      );
      const totalCompanies = tenantsWithCounts.reduce(
        (sum, tenant) => sum + tenant._count.companies,
        0
      );

      setTotals({
        tenants: tenantsWithCounts.length,
        users: totalUsers,
        companies: totalCompanies,
      });
    } catch (error) {
      console.error("Error fetching tenants:", error);
      toast.error("Failed to load tenants");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTenant = async () => {
    try {
      const { error } = await supabase.from("tenants").insert([
        {
          name: formData.name,
          plan_tier: formData.plan_tier,
          tenancy_type: formData.tenancy_type,
        },
      ]);

      if (error) throw error;

      toast.success("Tenant created successfully");
      setIsCreateDialogOpen(false);
      fetchTenants();
      resetForm();
    } catch (error) {
      console.error("Error creating tenant:", error);
      toast.error("Failed to create tenant");
    }
  };

  const handleUpdateTenant = async () => {
    if (!selectedTenant) return;

    try {
      const { error } = await supabase
        .from("tenants")
        .update({
          name: formData.name,
          plan_tier: formData.plan_tier,
          tenancy_type: formData.tenancy_type,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedTenant.id);

      if (error) throw error;

      toast.success("Tenant updated successfully");
      setIsEditDialogOpen(false);
      fetchTenants();
      resetForm();
    } catch (error) {
      console.error("Error updating tenant:", error);
      toast.error("Failed to update tenant");
    }
  };

  const handleDeleteTenant = async (tenantId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this tenant? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const { error } = await supabase
        .from("tenants")
        .delete()
        .eq("id", tenantId);

      if (error) throw error;

      toast.success("Tenant deleted successfully");
      fetchTenants();
    } catch (error) {
      console.error("Error deleting tenant:", error);
      toast.error("Failed to delete tenant");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      plan_tier: "free",
      tenancy_type: "enterprise",
    });
    setSelectedTenant(null);
  };

  const openEditDialog = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setFormData({
      name: tenant.name,
      plan_tier: tenant.plan_tier,
      tenancy_type: tenant.tenancy_type,
    });
    setIsEditDialogOpen(true);
  };

  const filteredTenants = tenants.filter((tenant) =>
    tenant.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case "pro":
        return "bg-blue-100 text-blue-800";
      case "enterprise":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Tenants Management</h1>
          <p className="text-gray-600 mt-2">Manage all tenant organizations</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Tenant
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Tenant</DialogTitle>
              <DialogDescription>
                Create a new tenant organization
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Tenant Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Enter tenant name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="plan">Plan Tier</Label>
                <Select
                  value={formData.plan_tier}
                  onValueChange={(value) =>
                    setFormData({ ...formData, plan_tier: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="pro">Pro</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tenancy">Tenancy Type</Label>
                <Select
                  value={formData.tenancy_type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, tenancy_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                    <SelectItem value="self-service">Self-Service</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateTenant}>Create Tenant</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.tenants}</div>
            <p className="text-xs text-muted-foreground">
              Active organizations
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.users}</div>
            <p className="text-xs text-muted-foreground">Across all tenants</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Companies
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.companies}</div>
            <p className="text-xs text-muted-foreground">Across all tenants</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Tenants</CardTitle>
          <CardDescription>
            View and manage all tenant organizations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search tenants..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead>Companies</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Loading tenants...
                    </TableCell>
                  </TableRow>
                ) : filteredTenants.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      No tenants found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTenants.map((tenant) => (
                    <TableRow key={tenant.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-gray-400" />
                          {tenant.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPlanBadgeColor(tenant.plan_tier)}>
                          {tenant.plan_tier}
                        </Badge>
                      </TableCell>
                      <TableCell>{tenant.tenancy_type}</TableCell>
                      <TableCell>{tenant._count?.users || 0}</TableCell>
                      <TableCell>{tenant._count?.companies || 0}</TableCell>
                      <TableCell>
                        {format(new Date(tenant.created_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(tenant)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteTenant(tenant.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Tenant</DialogTitle>
            <DialogDescription>Update tenant information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Tenant Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Enter tenant name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-plan">Plan Tier</Label>
              <Select
                value={formData.plan_tier}
                onValueChange={(value) =>
                  setFormData({ ...formData, plan_tier: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-tenancy">Tenancy Type</Label>
              <Select
                value={formData.tenancy_type}
                onValueChange={(value) =>
                  setFormData({ ...formData, tenancy_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                  <SelectItem value="self-service">Self-Service</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateTenant}>Update Tenant</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
