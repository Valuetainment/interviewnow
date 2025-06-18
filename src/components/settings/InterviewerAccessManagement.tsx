import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Building2, UserCheck, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";

interface TenantInterviewer {
  id: string;
  email: string;
  role: string;
  created_at: string;
}

interface Company {
  id: string;
  name: string;
}

interface InterviewerAccess {
  user_id: string;
  company_id: string;
  granted_at: string;
  granted_by: string;
  users: {
    email: string;
  };
  companies: {
    name: string;
  };
}

export const InterviewerAccessManagement: React.FC = () => {
  const { tenantId, user } = useAuth();
  const [interviewers, setInterviewers] = useState<TenantInterviewer[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [accessList, setAccessList] = useState<InterviewerAccess[]>([]);
  const [selectedInterviewer, setSelectedInterviewer] = useState<string>("");
  const [selectedCompanies, setSelectedCompanies] = useState<Set<string>>(
    new Set()
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (tenantId) {
      fetchData();
    }
  }, [tenantId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchInterviewers(),
        fetchCompanies(),
        fetchAccessList(),
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchInterviewers = async () => {
    const { data, error } = await supabase
      .from("users")
      .select(
        `
        id, 
        role, 
        created_at,
        auth_users:id (
          email
        )
      `
      )
      .eq("tenant_id", tenantId)
      .eq("role", "tenant_interviewer")
      .order("created_at");

    if (error) {
      console.error("Error fetching interviewers:", error);
      toast.error("Failed to load interviewers");
    } else {
      // Transform the data to include email at the top level
      const transformedData = (data || []).map((user) => ({
        ...user,
        email: user.auth_users?.email || "Unknown",
      }));
      setInterviewers(transformedData);
    }
  };

  const fetchCompanies = async () => {
    const { data, error } = await supabase
      .from("companies")
      .select("id, name")
      .eq("tenant_id", tenantId)
      .order("name");

    if (error) {
      console.error("Error fetching companies:", error);
      toast.error("Failed to load companies");
    } else {
      setCompanies(data || []);
    }
  };

  const fetchAccessList = async () => {
    const { data, error } = await supabase
      .from("interviewer_company_access")
      .select(
        `
        user_id,
        company_id,
        created_at,
        granted_by,
        users!interviewer_company_access_user_id_fkey (
          id,
          auth_users:id (
            email
          )
        ),
        companies!interviewer_company_access_company_id_fkey (name)
      `
      )
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching access list:", error);
      toast.error("Failed to load access list");
    } else {
      // Transform the data to have the email at the expected location
      const transformedData = (data || []).map((access) => ({
        ...access,
        granted_at: access.created_at,
        users: {
          email: access.users?.auth_users?.email || "Unknown",
        },
      }));
      setAccessList(transformedData);
    }
  };

  const handleGrantAccess = async () => {
    if (!selectedInterviewer || selectedCompanies.size === 0) {
      toast.error("Please select an interviewer and at least one company");
      return;
    }

    try {
      const accessGrants = Array.from(selectedCompanies).map((companyId) => ({
        user_id: selectedInterviewer,
        company_id: companyId,
        granted_by: user?.id,
      }));

      const { error } = await supabase
        .from("interviewer_company_access")
        .insert(accessGrants);

      if (error) throw error;

      toast.success("Access granted successfully");
      setIsDialogOpen(false);
      setSelectedInterviewer("");
      setSelectedCompanies(new Set());
      fetchAccessList();
    } catch (error) {
      console.error("Error granting access:", error);
      toast.error("Failed to grant access");
    }
  };

  const handleRevokeAccess = async (userId: string, companyId: string) => {
    if (!confirm("Are you sure you want to revoke this access?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("interviewer_company_access")
        .delete()
        .match({ user_id: userId, company_id: companyId });

      if (error) throw error;

      toast.success("Access revoked successfully");
      fetchAccessList();
    } catch (error) {
      console.error("Error revoking access:", error);
      toast.error("Failed to revoke access");
    }
  };

  const toggleCompanySelection = (companyId: string) => {
    const newSelection = new Set(selectedCompanies);
    if (newSelection.has(companyId)) {
      newSelection.delete(companyId);
    } else {
      newSelection.add(companyId);
    }
    setSelectedCompanies(newSelection);
  };

  const getInterviewerCompanies = (interviewerId: string) => {
    return accessList
      .filter((access) => access.user_id === interviewerId)
      .map((access) => access.companies.name)
      .join(", ");
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Interviewer Access Management</CardTitle>
            <CardDescription>
              Control which companies each interviewer can access
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Grant Access
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Grant Company Access</DialogTitle>
                <DialogDescription>
                  Select an interviewer and the companies they should have
                  access to
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Select Interviewer
                  </label>
                  <Select
                    value={selectedInterviewer}
                    onValueChange={setSelectedInterviewer}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose an interviewer" />
                    </SelectTrigger>
                    <SelectContent>
                      {interviewers.map((interviewer) => (
                        <SelectItem key={interviewer.id} value={interviewer.id}>
                          {interviewer.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Select Companies
                  </label>
                  <div className="border rounded-lg p-4 max-h-60 overflow-y-auto space-y-2">
                    {companies.map((company) => (
                      <div
                        key={company.id}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={company.id}
                          checked={selectedCompanies.has(company.id)}
                          onCheckedChange={() =>
                            toggleCompanySelection(company.id)
                          }
                        />
                        <label
                          htmlFor={company.id}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {company.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleGrantAccess}>Grant Access</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <>
            {/* Interviewers Overview */}
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-3">Interviewers</h3>
              <div className="grid gap-3">
                {interviewers.map((interviewer) => (
                  <div
                    key={interviewer.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <UserCheck className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{interviewer.email}</p>
                        <p className="text-sm text-muted-foreground">
                          Companies:{" "}
                          {getInterviewerCompanies(interviewer.id) ||
                            "No access"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Access List */}
            <div>
              <h3 className="text-lg font-medium mb-3">
                Current Access Permissions
              </h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Interviewer</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Granted</TableHead>
                    <TableHead>Granted By</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accessList.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        No access permissions granted yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    accessList.map((access) => (
                      <TableRow key={`${access.user_id}-${access.company_id}`}>
                        <TableCell>{access.users.email}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            {access.companies.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          {format(new Date(access.granted_at), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">System</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleRevokeAccess(
                                access.user_id,
                                access.company_id
                              )
                            }
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
