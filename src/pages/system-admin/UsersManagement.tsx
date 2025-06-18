import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const SystemAdminUsersManagement: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Users Management</h1>
        <p className="text-gray-600 mt-2">
          Manage all users across all tenants
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>View and manage users system-wide</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">
            Users management interface coming soon...
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
