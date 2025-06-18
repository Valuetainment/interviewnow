import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const SystemAdminCandidatesManagement: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Candidates Management</h1>
        <p className="text-gray-600 mt-2">
          Manage all candidates across all tenants
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Candidates</CardTitle>
          <CardDescription>
            View and manage candidates system-wide
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">
            Candidates management interface coming soon...
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
