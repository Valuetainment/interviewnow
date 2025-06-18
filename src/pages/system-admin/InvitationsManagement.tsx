import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const SystemAdminInvitations: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tenant Invitations</h1>
        <p className="text-gray-600 mt-2">
          Invite new tenant organizations to InterviewNow
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Send Invitations</CardTitle>
          <CardDescription>
            Invite new tenants via email with company codes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Invitation system coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
};
