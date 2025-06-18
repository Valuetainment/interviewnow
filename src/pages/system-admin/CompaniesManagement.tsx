import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const SystemAdminCompaniesManagement: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Companies Management</h1>
        <p className="text-gray-600 mt-2">
          Manage all companies across all tenants
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Companies</CardTitle>
          <CardDescription>
            View and manage companies system-wide
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">
            Companies management interface coming soon...
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
