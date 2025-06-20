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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Users,
  UserPlus,
  Search,
  Edit,
  Trash2,
  Shield,
  Building,
  Mail,
  Calendar,
  RefreshCw,
  Key,
  MoreVertical,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";

interface User {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  tenant_id: string | null;
  tenant_name: string | null;
  role: string;
  auth_email: string | null;
  auth_id: string | null;
  first_name?: string;
  last_name?: string;
}

export const SystemAdminUsersManagement: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTenant, setSelectedTenant] = useState<string>("all");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [tenants, setTenants] = useState<{ id: string; name: string }[]>([]);

  // Dialog states
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editFormData, setEditFormData] = useState({
    role: "",
    tenant_id: "none",
  });

  useEffect(() => {
    fetchUsers();
    fetchTenants();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);

      // Use the new function that gives us user data with emails
      const { data, error } = await supabase.rpc("get_users_with_auth");

      if (error) throw error;

      // Transform the data to match our interface
      const transformedUsers =
        data?.map((user: any) => ({
          id: user.id,
          email: user.email || `User ${user.id.substring(0, 8)}...`,
          created_at: user.created_at,
          last_sign_in_at: user.last_sign_in_at,
          tenant_id: user.tenant_id,
          tenant_name: user.tenant_name,
          role: user.role || "user",
          auth_email: user.email,
          auth_id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
        })) || [];

      setUsers(transformedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const fetchTenants = async () => {
    try {
      const { data, error } = await supabase
        .from("tenants")
        .select("id, name")
        .order("name");

      if (error) throw error;
      setTenants(data || []);
    } catch (error) {
      console.error("Error fetching tenants:", error);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setEditFormData({
      role: user.role,
      tenant_id: user.tenant_id || "none",
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    // Prevent changing role of the last system admin
    if (
      editingUser.role === "system_admin" &&
      editFormData.role !== "system_admin"
    ) {
      const systemAdminCount = users.filter(
        (u) => u.role === "system_admin"
      ).length;
      if (systemAdminCount <= 1) {
        toast.error(
          "Cannot change role of the last system admin. The system must always have at least one system admin."
        );
        return;
      }
    }

    try {
      const { error } = await supabase
        .from("users")
        .update({
          role: editFormData.role,
          tenant_id:
            editFormData.tenant_id === "none" ? null : editFormData.tenant_id,
        })
        .eq("id", editingUser.id);

      if (error) throw error;

      toast.success("User updated successfully");
      setIsEditDialogOpen(false);
      fetchUsers();
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("Failed to update user");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    // Check if user is trying to delete themselves
    if (user && userId === user.id) {
      toast.error("You cannot delete your own account");
      return;
    }

    // Check if this is the last system admin
    const targetUser = users.find((u) => u.id === userId);
    if (targetUser?.role === "system_admin") {
      const systemAdminCount = users.filter(
        (u) => u.role === "system_admin"
      ).length;
      if (systemAdminCount <= 1) {
        toast.error(
          "Cannot delete the last system admin. The system must always have at least one system admin."
        );
        return;
      }
    }

    if (
      !confirm(
        "Are you sure you want to delete this user? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const { error } = await supabase.from("users").delete().eq("id", userId);

      if (error) throw error;

      toast.success("User deleted successfully");
      fetchUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Failed to delete user");
    }
  };

  const resetUserPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      toast.success("Password reset email sent");
    } catch (error) {
      console.error("Error sending password reset:", error);
      toast.error("Failed to send password reset email");
    }
  };

  // Filter users based on search and filters
  const filteredUsers = users.filter((user) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      searchTerm === "" ||
      user.email.toLowerCase().includes(searchLower) ||
      (user.tenant_name &&
        user.tenant_name.toLowerCase().includes(searchLower)) ||
      (user.first_name &&
        user.first_name.toLowerCase().includes(searchLower)) ||
      (user.last_name && user.last_name.toLowerCase().includes(searchLower));

    const matchesTenant =
      selectedTenant === "all" ||
      (selectedTenant === "none" && !user.tenant_id) ||
      user.tenant_id === selectedTenant;

    const matchesRole = selectedRole === "all" || user.role === selectedRole;

    return matchesSearch && matchesTenant && matchesRole;
  });

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      system_admin: { color: "bg-purple-100 text-purple-800", icon: Shield },
      tenant_admin: { color: "bg-blue-100 text-blue-800", icon: Building },
      tenant_interviewer: { color: "bg-green-100 text-green-800", icon: Users },
      tenant_candidate: { color: "bg-gray-100 text-gray-800", icon: Users },
      user: { color: "bg-gray-100 text-gray-800", icon: Users },
    };

    const config =
      roleConfig[role as keyof typeof roleConfig] || roleConfig.user;
    const Icon = config.icon;

    return (
      <Badge className={config.color}>
        <Icon className="mr-1 h-3 w-3" />
        {role.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
      </Badge>
    );
  };

  const getUserInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Users Management</h1>
          <p className="text-gray-600 mt-2">
            Manage all users across all tenants
          </p>
        </div>
        <Button variant="outline" onClick={fetchUsers} disabled={loading}>
          <RefreshCw
            className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Admins</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter((u) => u.role === "system_admin").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tenant Admins</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter((u) => u.role === "tenant_admin").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Interviewers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter((u) => u.role === "tenant_interviewer").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            View and manage users across the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name, email or tenant..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedTenant} onValueChange={setSelectedTenant}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by tenant" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tenants</SelectItem>
                <SelectItem value="none">No Tenant</SelectItem>
                {tenants.map((tenant) => (
                  <SelectItem key={tenant.id} value={tenant.id}>
                    {tenant.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="system_admin">System Admin</SelectItem>
                <SelectItem value="tenant_admin">Tenant Admin</SelectItem>
                <SelectItem value="tenant_interviewer">Interviewer</SelectItem>
                <SelectItem value="tenant_candidate">Candidate</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      Loading users...
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((tableUser) => (
                    <TableRow key={tableUser.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {getUserInitials(tableUser.email)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            {(tableUser.first_name || tableUser.last_name) && (
                              <div className="font-medium">
                                {`${tableUser.first_name || ""} ${
                                  tableUser.last_name || ""
                                }`.trim()}
                              </div>
                            )}
                            <div
                              className={
                                tableUser.first_name || tableUser.last_name
                                  ? "text-sm text-gray-600"
                                  : "font-medium"
                              }
                            >
                              {tableUser.email}
                            </div>
                            {tableUser.auth_id && (
                              <div className="text-xs text-gray-500">
                                ID: {tableUser.id}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {tableUser.tenant_name || (
                          <span className="text-gray-400">No tenant</span>
                        )}
                      </TableCell>
                      <TableCell>{getRoleBadge(tableUser.role)}</TableCell>
                      <TableCell>
                        {format(new Date(tableUser.created_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleEditUser(tableUser)}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit User
                            </DropdownMenuItem>
                            {tableUser.auth_email && (
                              <DropdownMenuItem
                                onClick={() =>
                                  resetUserPassword(tableUser.auth_email!)
                                }
                              >
                                <Key className="mr-2 h-4 w-4" />
                                Send Password Reset
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDeleteUser(tableUser.id)}
                              className={
                                (user && tableUser.id === user.id) ||
                                (tableUser.role === "system_admin" &&
                                  users.filter((u) => u.role === "system_admin")
                                    .length <= 1)
                                  ? "text-gray-400 cursor-not-allowed"
                                  : "text-red-600 cursor-pointer"
                              }
                              disabled={
                                // Can't delete yourself
                                (user && tableUser.id === user.id) ||
                                // Can't delete last system admin
                                (tableUser.role === "system_admin" &&
                                  users.filter((u) => u.role === "system_admin")
                                    .length <= 1)
                              }
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              {user && tableUser.id === user.id
                                ? "Cannot Delete Yourself"
                                : tableUser.role === "system_admin" &&
                                  users.filter((u) => u.role === "system_admin")
                                    .length <= 1
                                ? "Last System Admin"
                                : "Delete User"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user role and tenant assignment
            </DialogDescription>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={editingUser.email} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={editFormData.role}
                  onValueChange={(value) =>
                    setEditFormData({ ...editFormData, role: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="system_admin">System Admin</SelectItem>
                    <SelectItem value="tenant_admin">Tenant Admin</SelectItem>
                    <SelectItem value="tenant_interviewer">
                      Interviewer
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tenant">Tenant</Label>
                <Select
                  value={editFormData.tenant_id}
                  onValueChange={(value) =>
                    setEditFormData({ ...editFormData, tenant_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a tenant" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Tenant</SelectItem>
                    {tenants.map((tenant) => (
                      <SelectItem key={tenant.id} value={tenant.id}>
                        {tenant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {editFormData.role === "system_admin" && (
                  <p className="text-sm text-gray-500">
                    System admins typically don't have a tenant assignment
                  </p>
                )}
                {editingUser?.role === "system_admin" &&
                  users.filter((u) => u.role === "system_admin").length <=
                    1 && (
                    <p className="text-sm text-amber-600 mt-2">
                      ⚠️ This is the last system admin. You cannot change their
                      role.
                    </p>
                  )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateUser}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
