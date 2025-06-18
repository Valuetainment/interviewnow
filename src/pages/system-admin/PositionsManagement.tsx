import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const SystemAdminPositionsManagement: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Positions Management</h1>
        <p className="text-gray-600 mt-2">
          Manage all positions across all tenants
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Positions</CardTitle>
          <CardDescription>
            View and manage positions system-wide
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">
            Positions management interface coming soon...
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
