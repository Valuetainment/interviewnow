import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const SystemAdminSessionsManagement: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Sessions Management</h1>
        <p className="text-gray-600 mt-2">
          Manage all interview sessions across all tenants
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Sessions</CardTitle>
          <CardDescription>
            View and manage interview sessions system-wide
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">
            Sessions management interface coming soon...
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
