import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const SystemAdminTranscriptsManagement: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Transcripts Management</h1>
        <p className="text-gray-600 mt-2">
          Manage all transcripts across all tenants
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Transcripts</CardTitle>
          <CardDescription>
            View and manage interview transcripts system-wide
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">
            Transcripts management interface coming soon...
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
